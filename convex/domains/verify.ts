import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const createProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      domain: args.domain,
      botConfig: {
        name: args.name,
        welcomeMessage: `Hi! I'm the ${args.name} assistant. How can I help you today?`,
        primaryColor: "#3b82f6",
        position: "bottom-right",
        headerFont: "modern",
        avatarStyle: "bot",
      },
      learningConfig: {
        depth: "full",
        schedule: "weekly",
        excludedPaths: [],
      },
      crawlStatus: "idle",
      pageCount: 0,
      createdAt: Date.now(),
    });

    const aiConfig = await ctx.db.query("aiConfig").first();
    if (aiConfig) {
      await ctx.scheduler.runAfter(0, internal.crawl.start.startCrawlInternal, {
        projectId,
        url: `https://${args.domain}`,
        depth: "full",
      });
    }

    await ctx.scheduler.runAfter(0, internal.crawl.scheduler.refreshScheduledRecrawl, {
      projectId,
    });

    return projectId;
  },
});
