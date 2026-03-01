import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const startCrawlInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
    depth: v.optional(v.union(v.literal("single"), v.literal("nested"), v.literal("full"))),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const depth = args.depth ?? project.learningConfig?.depth ?? "full";

    const aiConfig = await ctx.db.query("aiConfig").first();
    if (!aiConfig) {
      throw new Error("Global AI configuration not found. Configure Admin -> AI first.");
    }

    await ctx.db.patch(args.projectId, {
      crawlStatus: "crawling",
    });

    const jobId = await ctx.db.insert("crawlJobs", {
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      status: "pending",
      totalUrls: 0,
      processedUrls: 0,
      failedUrls: 0,
      depth,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.crawl.discover.discoverUrls, {
      jobId,
      url: args.url,
    });

    return jobId;
  },
});

export const startCrawl = mutation({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
    depth: v.optional(v.union(v.literal("single"), v.literal("nested"), v.literal("full"))),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const depth = args.depth ?? project.learningConfig?.depth ?? "full";

    const aiConfig = await ctx.db.query("aiConfig").first();
    if (!aiConfig) {
      throw new Error("Global AI configuration not found. Configure Admin -> AI first.");
    }

    await ctx.db.patch(args.projectId, {
      crawlStatus: "crawling",
    });

    const jobId = await ctx.db.insert("crawlJobs", {
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      status: "pending",
      totalUrls: 0,
      processedUrls: 0,
      failedUrls: 0,
      depth,
      createdAt: Date.now(),
    });

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
