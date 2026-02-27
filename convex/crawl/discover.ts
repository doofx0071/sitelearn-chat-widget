"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { fetchSitemapUrls } from "../../src/lib/crawler/sitemap";

export const discoverUrls = internalAction({
  args: {
    jobId: v.id("crawlJobs"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.runMutation(internal.crawl.discoverMutations.updateJobStatus, {
        jobId: args.jobId,
        status: "running",
      });

      // Try sitemap first
      let urls: string[] = [];
      const sitemapUrl = args.url.endsWith("/") 
        ? `${args.url}sitemap.xml` 
        : `${args.url}/sitemap.xml`;
      
      urls = await fetchSitemapUrls(sitemapUrl);

      // Fallback to just the root URL if sitemap fails or is empty
      if (urls.length === 0) {
        urls = [args.url];
      }

      await ctx.runMutation(internal.crawl.discoverMutations.saveDiscoveredUrls, {
        jobId: args.jobId,
        urls,
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
