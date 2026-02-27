import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { status: args.status });
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

    for (const url of args.urls) {
      // Check if already exists for this project to avoid duplicates
      const existing = await ctx.db
        .query("crawledPages")
        .withIndex("by_projectId", (q) => q.eq("projectId", job.projectId))
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
      }
    }
  },
});

export const markJobFailed = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
    });
  },
});
