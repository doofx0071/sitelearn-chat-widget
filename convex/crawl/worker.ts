"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { fetchAndExtract } from "../../src/lib/crawler/extractor";

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

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

    const pendingPages = await ctx.runQuery(internal.crawl.workerMutations.getPendingPages, {
      jobId: args.jobId,
      limit: BATCH_SIZE,
    });

    if (pendingPages.length === 0) {
      await ctx.runMutation(internal.crawl.workerMutations.finalizeCrawl, { jobId: args.jobId });
      return;
    }

    for (const page of pendingPages) {
      try {
        const result = await fetchAndExtract(page.url);
        const contentHash = await hashContent(result.content);

        await ctx.runMutation(internal.crawl.workerMutations.savePageResults, {
          pageId: page._id,
          title: result.title,
          content: result.content,
          contentHash,
        });

        // Trigger embedding for this page
        await ctx.scheduler.runAfter(0, internal.crawl.embed.chunkAndEmbed, {
          pageId: page._id,
        });

      } catch (error: any) {
        console.error(`Failed to process page ${page.url}:`, error);
        // We continue with other pages even if one fails
      }
    }

    // Schedule next batch with delay
    await ctx.scheduler.runAfter(DELAY_MS, internal.crawl.worker.processBatch, {
      jobId: args.jobId,
    });
  },
});
