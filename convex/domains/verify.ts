import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

function normalizeDomainInput(domain: string): string {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return trimmed;

  try {
    const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .replace(/^www\./, "");
  }
}

export const createProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedDomain = normalizeDomainInput(args.domain);

    const projectId = await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      domain: normalizedDomain,
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
        url: `https://${normalizedDomain}`,
        depth: "full",
      });
    }

    await ctx.scheduler.runAfter(0, internal.crawl.scheduler.refreshScheduledRecrawl, {
      projectId,
    });

    return projectId;
  },
});
