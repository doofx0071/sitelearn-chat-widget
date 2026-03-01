import { v } from "convex/values";
import { internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const getJob = internalQuery({
  args: { jobId: v.id("crawlJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getProject = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const getPendingPages = internalQuery({
  args: {
    jobId: v.id("crawlJobs"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crawledPages")
      .withIndex("by_crawlJobId", (q) => q.eq("crawlJobId", args.jobId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(args.limit);
  },
});

export const savePageResults = internalMutation({
  args: {
    pageId: v.id("crawledPages"),
    title: v.string(),
    content: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    await ctx.db.patch(args.pageId, {
      title: args.title,
      content: args.content,
      contentHash: args.contentHash,
      status: "crawled",
      lastCrawledAt: Date.now(),
    });

    if (page) {
      const job = await ctx.db.get(page.crawlJobId);
      if (job) {
        await ctx.db.patch(job._id, {
          processedUrls: job.processedUrls + 1,
        });
      }
    }
  },
});

export const markPageFailed = internalMutation({
  args: {
    pageId: v.id("crawledPages"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    await ctx.db.patch(args.pageId, {
      status: "failed",
      errorMessage: args.error,
    });

    if (page) {
      const job = await ctx.db.get(page.crawlJobId);
      if (job) {
        await ctx.db.patch(job._id, {
          failedUrls: job.failedUrls + 1,
          processedUrls: job.processedUrls + 1,
        });
      }
    }
  },
});

export const finalizeCrawl = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    const pages = await ctx.db
      .query("crawledPages")
      .withIndex("by_crawlJobId", (q) => q.eq("crawlJobId", args.jobId))
      .collect();

    const successfulPages = pages.filter((p) => p.status !== "failed").length;

    await ctx.db.patch(args.jobId, {
      status: "completed",
      completedAt: Date.now(),
      totalUrls: pages.length,
      processedUrls: pages.length,
      failedUrls: pages.filter((p) => p.status === "failed").length,
    });

    await ctx.db.patch(job.projectId, {
      crawlStatus: "completed",
      lastCrawledAt: Date.now(),
      pageCount: successfulPages,
    });

    await ctx.scheduler.runAfter(0, internal.crawl.scheduler.refreshScheduledRecrawl, {
      projectId: job.projectId,
    });
  },
});
