import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const startCrawl = mutation({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
    depth: v.optional(v.union(v.literal("single"), v.literal("nested"), v.literal("full"))),
  },
  handler: async (ctx, args) => {
    // 1. Validate project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // 2. Create crawl job
    const jobId = await ctx.db.insert("crawlJobs", {
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      status: "pending",
      totalUrls: 0,
      processedUrls: 0,
      failedUrls: 0,
      depth: args.depth || "nested",
      createdAt: Date.now(),
    });

    // 3. Schedule discovery
    await ctx.scheduler.runAfter(0, internal.crawl.discover.discoverUrls, {
      jobId,
      url: args.url,
    });

    return jobId;
  },
});

export const cancelCrawl = mutation({
  args: {
    jobId: v.id("crawlJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status === "running" || job.status === "pending") {
      await ctx.db.patch(args.jobId, {
        status: "failed",
        error: "Cancelled by user",
      });
    }
  },
});
