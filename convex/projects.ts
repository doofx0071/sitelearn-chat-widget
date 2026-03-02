import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";

function normalizeExcludedPath(path: string): string | null {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) return null;

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/+$/, "") || "/";
}

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of this workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) {
      throw new Error("Unauthorized");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    return projects;
  },
});

export const get = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) {
      throw new Error("Unauthorized");
    }

    return project;
  },
});

export const getDetailStats = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) {
      throw new Error("Unauthorized");
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    const latestJob = await ctx.db
      .query("crawlJobs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();

    const crawledPages = await ctx.db
      .query("crawledPages")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    const recentPageCandidates = crawledPages
      .filter((p) => p.status === "embedded" || p.status === "chunked" || p.status === "crawled")
      .sort((a, b) => (b.lastCrawledAt ?? 0) - (a.lastCrawledAt ?? 0))
      .map((p) => ({
        url: p.url,
        title: p.title ?? p.url,
        words: p.content ? p.content.split(/\s+/).filter(Boolean).length : 0,
      }));

    const dedupedByUrl = new Map<string, { url: string; title: string; words: number }>();
    for (const page of recentPageCandidates) {
      if (!dedupedByUrl.has(page.url)) {
        dedupedByUrl.set(page.url, page);
      }
      if (dedupedByUrl.size >= 50) break;
    }
    const recentPages = Array.from(dedupedByUrl.values());

    return {
      pagesIndexed: project.pageCount ?? 0,
      failedPages: latestJob?.failedUrls ?? 0,
      lastCrawledAt: project.lastCrawledAt,
      conversations: conversations.length,
      recentPages,
    };
  },
});

export const getCrawlDebug = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) throw new Error("Unauthorized");

    const latestJob = await ctx.db
      .query("crawlJobs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();

    if (!latestJob) {
      return {
        latestJob: null,
        recentDiscovered: [],
        failures: [],
      };
    }

    const pages = await ctx.db
      .query("crawledPages")
      .withIndex("by_crawlJobId", (q) => q.eq("crawlJobId", latestJob._id))
      .collect();

    const failures = pages
      .filter((p) => p.status === "failed")
      .slice(0, 20)
      .map((p) => ({
        id: p._id,
        url: p.url,
        error: p.errorMessage ?? "Unknown error",
      }));

    const recentDiscovered = pages
      .slice()
      .sort((a, b) => (b.lastCrawledAt ?? 0) - (a.lastCrawledAt ?? 0))
      .slice(0, 20)
      .map((p) => ({
        id: p._id,
        url: p.url,
        status: p.status,
      }));

    return {
      latestJob: {
        id: latestJob._id,
        status: latestJob.status,
        depth: latestJob.depth ?? "full",
        totalUrls: latestJob.totalUrls,
        processedUrls: latestJob.processedUrls,
        failedUrls: latestJob.failedUrls,
        startedAt: latestJob.startedAt,
        completedAt: latestJob.completedAt,
        error: latestJob.error,
      },
      recentDiscovered,
      failures,
    };
  },
});

export const getPageContent = query({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) {
      throw new Error("Unauthorized");
    }

    const page = await ctx.db
      .query("crawledPages")
      .withIndex("by_project_url", (q) =>
        q.eq("projectId", args.projectId).eq("url", args.url)
      )
      .first();

    if (!page) return null;

    return {
      url: page.url,
      title: page.title ?? page.url,
      content: page.content,
      wordCount: page.content ? page.content.split(/\s+/).filter(Boolean).length : 0,
    };
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Verify user is a member of this workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.projectId);
  },
});

export const updateSettings = mutation({
  args: {
    projectId: v.id("projects"),
    botConfig: v.object({
      name: v.string(),
      welcomeMessage: v.string(),
      primaryColor: v.string(),
      position: v.union(v.literal("bottom-left"), v.literal("bottom-right")),
      headerFont: v.optional(
        v.union(
          v.literal("editorial"),
          v.literal("modern"),
          v.literal("classic"),
          v.literal("minimal")
        )
      ),
      avatarStyle: v.optional(
        v.union(
          v.literal("sparkle"),
          v.literal("bot"),
          v.literal("chat"),
          v.literal("initial")
        )
      ),
    }),
    learningConfig: v.object({
      depth: v.union(v.literal("single"), v.literal("nested"), v.literal("full")),
      schedule: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("manual")),
      excludedPaths: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member) {
      throw new Error("Unauthorized");
    }

    const primaryColor = args.botConfig.primaryColor.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
      throw new Error("Primary color must be a 6-digit hex color");
    }

    const excludedPaths = Array.from(
      new Set(
        args.learningConfig.excludedPaths
          .map((value) => normalizeExcludedPath(value))
          .filter((value): value is string => Boolean(value))
      )
    );

    await ctx.db.patch(args.projectId, {
      botConfig: {
        ...args.botConfig,
        primaryColor,
      },
      learningConfig: {
        depth: args.learningConfig.depth,
        schedule: args.learningConfig.schedule,
        excludedPaths,
      },
    });

    await ctx.scheduler.runAfter(0, internal.crawl.scheduler.refreshScheduledRecrawl, {
      projectId: args.projectId,
    });

    return { ok: true };
  },
});
