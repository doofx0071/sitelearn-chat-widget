import { v } from "convex/values";
import { internalQuery, internalMutation } from "../_generated/server";

export const getJob = internalQuery({
  args: { jobId: v.id("crawlJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
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
      .filter((q) => q.eq(q.field("contentHash"), ""))
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
    await ctx.db.patch(args.pageId, {
      title: args.title,
      content: args.content,
      contentHash: args.contentHash,
    });
  },
});

export const finalizeCrawl = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
    });
  },
});
