import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    coverageWarning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { 
      status: "pending" | "running" | "completed" | "failed"; 
      startedAt?: number;
      coverageWarning?: string;
    } = {
      status: args.status,
    };
    if (args.status === "running") {
      patch.startedAt = Date.now();
    }
    if (args.coverageWarning !== undefined) {
      patch.coverageWarning = args.coverageWarning;
    }
    await ctx.db.patch(args.jobId, patch);
  },
});

export const saveDiscoveredUrls = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
    urls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    let inserted = 0;

    for (const url of args.urls) {
      // Check if already exists for this job to avoid duplicates.
      // We intentionally allow same URL across different jobs for re-crawls.
      const existing = await ctx.db
        .query("crawledPages")
        .withIndex("by_crawlJobId", (q) => q.eq("crawlJobId", args.jobId))
        .filter((q) => q.eq(q.field("url"), url))
        .first();

      if (!existing) {
        await ctx.db.insert("crawledPages", {
          projectId: job.projectId,
          crawlJobId: args.jobId,
          url,
          content: "",
          contentHash: "",
          status: "pending",
        });
        inserted += 1;
      }
    }

    if (inserted > 0) {
      await ctx.db.patch(args.jobId, {
        totalUrls: job.totalUrls + inserted,
      });
    }

    await ctx.db.patch(job.projectId, {
      crawlStatus: "crawling",
    });
  },
});

export const markJobFailed = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });

    if (job) {
      await ctx.db.patch(job.projectId, {
        crawlStatus: "failed",
        lastCrawledAt: Date.now(),
      });
    }
  },
});
