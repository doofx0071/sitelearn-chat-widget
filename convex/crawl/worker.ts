"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { fetchAndParseRobotsTxt } from "../../src/lib/crawler/robots";
import { normalizeUrl, isSameDomain } from "../../src/lib/crawler/url-normalizer";
import { isExcludedPath } from "../../src/lib/crawler/exclusions";

const BATCH_SIZE = 5;
const DEFAULT_DELAY_MS = 1000;
const MAX_SCRAPE_POLLS = 30;
const SCRAPE_POLL_DELAY_MS = 2000;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple hash function using Web Crypto API
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const processBatch = internalAction({
  args: {
    jobId: v.id("crawlJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.crawl.workerMutations.getJob, { jobId: args.jobId });
    if (!job || job.status !== "running") return;

    const project = await ctx.runQuery(internal.crawl.workerMutations.getProject, { projectId: job.projectId });
    if (!project) return;

    const customExclusions = project.learningConfig?.excludedPaths;

    const pendingPages = await ctx.runQuery(internal.crawl.workerMutations.getPendingPages, {
      jobId: args.jobId,
      limit: BATCH_SIZE,
    });

    if (pendingPages.length === 0) {
      await ctx.runMutation(internal.crawl.workerMutations.finalizeCrawl, { jobId: args.jobId });
      return;
    }

    // Fetch robots.txt for politeness and rules
    const robots = await fetchAndParseRobotsTxt(project.domain);
    const crawlDelay = robots.getCrawlDelay() * 1000 || DEFAULT_DELAY_MS;

    for (const page of pendingPages) {
      try {
        // Double check robots.txt before fetching
        if (!robots.isAllowed(page.url)) {
          await ctx.runMutation(internal.crawl.workerMutations.markPageFailed, {
            pageId: page._id,
            error: "Disallowed by robots.txt",
          });
          continue;
        }

        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
          throw new Error("Missing FIRECRAWL_API_KEY");
        }

        const scrapeStart = await ctx.runMutation(
          components.firecrawlScrape.lib.startScrape,
          {
            url: page.url,
            apiKey,
            options: {
              formats: ["markdown", "links", "html"],
              onlyMainContent: false,
            },
          }
        );

        let attempts = 0;
        let status = await ctx.runQuery(components.firecrawlScrape.lib.getStatus, {
          id: scrapeStart.jobId,
        });

        while (status?.status === "pending" || status?.status === "scraping") {
          if (attempts >= MAX_SCRAPE_POLLS) {
            throw new Error("Firecrawl scrape timed out");
          }
          attempts += 1;
          await new Promise((resolve) => setTimeout(resolve, SCRAPE_POLL_DELAY_MS));
          status = await ctx.runQuery(components.firecrawlScrape.lib.getStatus, {
            id: scrapeStart.jobId,
          });
        }

        if (!status || status.status === "failed") {
          throw new Error(status?.error || "Firecrawl scrape failed");
        }

        const content = await ctx.runQuery(components.firecrawlScrape.lib.getContent, {
          id: scrapeStart.jobId,
        });

        const extractedText =
          content?.markdown?.trim() ||
          content?.summary?.trim() ||
          (content?.html ? htmlToText(content.html) : "");
        if (!extractedText.trim()) {
          throw new Error("No content extracted from page");
        }

        const title = content?.metadata?.title || page.url;
        let discoveredLinks = content?.links || [];

        // Fallback link extraction from HTML if links are sparse
        if (discoveredLinks.length < 5 && content?.html) {
          const html = content.html as string;
          const hrefRegex = /href=["'](https?:\/\/[^"']+|(?:\/|\.\/|\.\.\/)[^"']+)["']/gi;
          let match;
          const htmlLinks = new Set<string>();
          while ((match = hrefRegex.exec(html)) !== null) {
            htmlLinks.add(match[1]);
          }
          if (htmlLinks.size > 0) {
            const merged = new Set([...discoveredLinks, ...htmlLinks]);
            discoveredLinks = Array.from(merged);
          }
        }

        const contentHash = await hashContent(extractedText);

        await ctx.runMutation(internal.crawl.workerMutations.savePageResults, {
          pageId: page._id,
          title,
          content: extractedText,
          contentHash,
        });

        // Handle Depth Discovery
        const depth = job.depth || "single";
        if (depth !== "single") {
          const discoveredUrls = discoveredLinks
            .map((link: string) => normalizeUrl(link, page.url))
            .filter((url) => isSameDomain(url, project.domain))
            .filter((url) => {
              const lower = url.toLowerCase();
              if (lower.includes("/sitemap")) return false;
              return !/(\.xml|\.json|\.txt|\.rss|\.atom|\.ico|\.svg|\.png|\.jpe?g|\.webp|\.gif|\.pdf|\.zip)(\?|$)/.test(lower);
            })
            .filter((url) => !isExcludedPath(url, customExclusions))
            .filter((url) => robots.isAllowed(url));

          const isRootPage = (() => {
            try {
              const parsed = new URL(page.url);
              return parsed.pathname === "/" || parsed.pathname === "";
            } catch {
              return false;
            }
          })();

          // If nested, we only want to go one level deeper than the root
          // For simplicity, we'll just add them and let the job finish
          // A more robust depth control would track 'depth' per page
          if (depth === "full" || (depth === "nested" && isRootPage)) {
             await ctx.runMutation(internal.crawl.discoverMutations.saveDiscoveredUrls, {
               jobId: args.jobId,
               urls: discoveredUrls,
             });
          }
        }

        // Trigger embedding for this page
        await ctx.scheduler.runAfter(0, internal.crawl.embed.chunkAndEmbed, {
          pageId: page._id,
        });

      } catch (error: any) {
        console.error(`Failed to process page ${page.url}:`, error);
        await ctx.runMutation(internal.crawl.workerMutations.markPageFailed, {
          pageId: page._id,
          error: error.message || "Unknown error",
        });
      }
    }

    // Schedule next batch with respect to crawl-delay
    await ctx.scheduler.runAfter(crawlDelay, internal.crawl.worker.processBatch, {
      jobId: args.jobId,
    });
  },
});
