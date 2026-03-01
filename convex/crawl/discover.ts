"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { fetchSitemapUrls } from "../../src/lib/crawler/sitemap";
import { fetchAndParseRobotsTxt } from "../../src/lib/crawler/robots";
import { isSameDomain, normalizeUrl } from "../../src/lib/crawler/url-normalizer";
import { isExcludedPath } from "../../src/lib/crawler/exclusions";

export const discoverUrls = internalAction({
  args: {
    jobId: v.id("crawlJobs"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const job = await ctx.runQuery(internal.crawl.workerMutations.getJob, {
        jobId: args.jobId,
      });
      if (!job) {
        throw new Error("Crawl job not found");
      }

      const project = await ctx.runQuery(internal.crawl.workerMutations.getProject, {
        projectId: job.projectId,
      });
      if (!project) {
        throw new Error("Project not found");
      }

      const customExclusions = project.learningConfig?.excludedPaths;

      // 1. Fetch and respect robots.txt
      const robots = await fetchAndParseRobotsTxt(args.url);
      
      // 2. Try sitemaps from robots.txt or default location
      let urls: string[] = [];
      const sitemaps = robots.getSitemaps();
      
      if (sitemaps.length > 0) {
        for (const sitemapUrl of sitemaps) {
          const sitemapUrls = await fetchSitemapUrls(sitemapUrl);
          urls.push(...sitemapUrls);
        }
      } else {
        const defaultSitemapUrl = args.url.endsWith("/") 
          ? `${args.url}sitemap.xml` 
          : `${args.url}/sitemap.xml`;
        urls = await fetchSitemapUrls(defaultSitemapUrl);
      }

      // 3. Firecrawl map for broader discovery (merge with sitemap URLs)
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (apiKey) {
        try {
          const mapResponse = await fetch("https://api.firecrawl.dev/v2/map", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: args.url,
              includeSubdomains: true,
              sitemap: "include",
              limit: 5000,
              ignoreQueryParameters: true,
            }),
          });

          if (mapResponse.ok) {
            const mapJson = (await mapResponse.json()) as {
              success?: boolean;
              links?: string[];
              data?: { links?: string[] } | string[];
            };
            const mapLinks = Array.isArray(mapJson.data)
              ? mapJson.data
              : mapJson.data?.links ?? mapJson.links ?? [];
            urls.push(...mapLinks);
          }
        } catch {
          // ignore map errors and continue with sitemap/fallback URLs
        }
      }

      // 3.5. If sitemap/map produce very few URLs, add one homepage scrape-link seed pass
      if (urls.length < 10 && apiKey) {
        try {
          const scrapeResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: args.url,
              formats: ["links"],
              onlyMainContent: false,
            }),
          });
          if (scrapeResponse.ok) {
            const scrapeJson = await scrapeResponse.json();
            const scrapeLinks = scrapeJson.data?.links || [];
            urls.push(...scrapeLinks);
          }
        } catch {
          // ignore scrape errors
        }
      }

      // 4. Normalize and filter URLs by domain + robots rules
      urls = urls
        .map((url) => normalizeUrl(url, args.url))
        .filter((url) => isSameDomain(url, args.url))
        .filter((url) => {
          const lower = url.toLowerCase();
          // Skip obvious non-content and machine endpoints.
          if (lower.includes("/sitemap")) return false;
          return !/(\.xml|\.json|\.txt|\.rss|\.atom|\.ico|\.svg|\.png|\.jpe?g|\.webp|\.gif|\.pdf|\.zip)(\?|$)/.test(lower);
        })
        .filter((url) => !isExcludedPath(url, customExclusions))
        .filter((url) => robots.isAllowed(url));
      
      // Ensure root URL is always included
      if (robots.isAllowed(args.url) && !isExcludedPath(args.url, customExclusions)) {
        urls.push(normalizeUrl(args.url, args.url));
      }

      urls = Array.from(new Set(urls));

      // Fallback to just the root URL if sitemap fails or is empty
      if (urls.length === 0) {
        if (robots.isAllowed(args.url) && !isExcludedPath(args.url, customExclusions)) {
          urls = [args.url];
        } else {
          throw new Error("Root URL is disallowed by robots.txt");
        }
      }

      let coverageWarning: string | undefined;
      if (urls.length < 5) {
        coverageWarning = `Low URL discovery (${urls.length} URLs). The site may have strict robots.txt rules or limited link visibility.`;
      }

      await ctx.runMutation(internal.crawl.discoverMutations.saveDiscoveredUrls, {
        jobId: args.jobId,
        urls,
      });

      await ctx.runMutation(internal.crawl.discoverMutations.updateJobStatus, {
        jobId: args.jobId,
        status: "running",
        coverageWarning,
      });

      // Start the worker
      await ctx.scheduler.runAfter(0, internal.crawl.worker.processBatch, {
        jobId: args.jobId,
      });

    } catch (error: any) {
      await ctx.runMutation(internal.crawl.discoverMutations.markJobFailed, {
        jobId: args.jobId,
        error: error.message || "Unknown error during discovery",
      });
    }
  },
});
