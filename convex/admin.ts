import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

import { components } from "./_generated/api";

export const debugAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const roles = await ctx.db.query("userRoles").collect();
    return { user, roles };
  },
});

/**
 * Helper to check if the current user is a Super Admin.
 * Checks for @sitelearn.ai email, admin@example.com, or a role in userRoles.
 */
async function checkSuperAdmin(ctx: QueryCtx) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new Error("Unauthorized: Not logged in");
  }

  const email = user.email;
  const isAdminEmail = email.endsWith("@sitelearn.ai") || email === "admin@example.com";
  
  if (isAdminEmail) return user;

  // Check userRoles table
  const userRole = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first();

  if (userRole?.role !== "admin") {
    throw new Error("Unauthorized: Super Admin access required");
  }

  return user;
}

/**
 * Returns whether the current user is a Super Admin.
 * Safe for client-side route guards (does not throw).
 */
export const getIsSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { isSuperAdmin: false };
    }

    const email = user.email;
    const isAdminEmail = email.endsWith("@sitelearn.ai") || email === "admin@example.com";
    if (isAdminEmail) {
      return { isSuperAdmin: true };
    }

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return { isSuperAdmin: userRole?.role === "admin" };
  },
});

/**
 * Updates a user's global role.
 */
export const updateUserRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    await checkSuperAdmin(ctx);
    
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
      
    if (existingRole) {
      await ctx.db.patch(existingRole._id, { role: args.role });
    } else {
      await ctx.db.insert("userRoles", {
        userId: args.userId,
        role: args.role,
      });
    }
  },
});

/**
 * Returns total users, total workspaces, total projects, total messages.
 * Note: Avoids heavy table scans (chunks, messages, crawledPages) to reduce bytes read.
 */
export const getGlobalStats = query({
  args: {},
  handler: async (ctx): Promise<{
    totalUsers: number;
    totalWorkspaces: number;
    totalProjects: number;
    totalMessages: number;
    totalChunks: number | null;
    totalCrawledPages: number;
    totalConversations: number;
    planDistribution: { free: number; pro: number; enterprise: number };
  }> => {
    await checkSuperAdmin(ctx);

    const members = await ctx.db.query("members").collect();
    const workspaces = await ctx.db.query("workspaces").collect();
    const projects = await ctx.db.query("projects").collect();
    const conversations = await ctx.db.query("conversations").collect();

    const planDistribution = workspaces.reduce(
      (acc, workspace) => {
        acc[workspace.plan] += 1;
        return acc;
      },
      { free: 0, pro: 0, enterprise: 0 }
    );

    // Compute totalMessages from conversation.messageCount (avoids scanning messages table)
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    );

    // Compute totalCrawledPages from project.pageCount (avoids scanning crawledPages table)
    const totalCrawledPages = projects.reduce(
      (sum, proj) => sum + (proj.pageCount ?? 0),
      0
    );

    return {
      totalUsers: members.length,
      totalWorkspaces: workspaces.length,
      totalProjects: projects.length,
      totalMessages,
      totalChunks: null, // Temporarily unavailable without expensive scan
      totalCrawledPages,
      totalConversations: conversations.length,
      planDistribution,
    };
  },
});

/**
 * Returns all users (from Better Auth) and their global roles.
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await checkSuperAdmin(ctx);
    
    // Query the Better Auth users table
    const usersResult = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      paginationOpts: { numItems: 100, cursor: null },
    });
    
    // Query our local userRoles table
    const roles = await ctx.db.query("userRoles").collect();
    const roleMap = new Map(roles.map(r => [r.userId, r.role]));
    
    return usersResult.page.map((u: any) => ({
      ...u,
      role: roleMap.get(u._id) || "user",
    }));
  },
});

/**
 * Returns all workspaces with their plan and project count.
 */
export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    await checkSuperAdmin(ctx);
    const workspaces = await ctx.db.query("workspaces").order("desc").collect();
    
    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
          .collect();
        
        return {
          ...workspace,
          projectCount: projects.length,
        };
      })
    );

    return workspacesWithStats;
  },
});

/**
 * Returns crawl jobs that are 'running' or 'pending'.
 */
export const listActiveJobs = query({
  args: {},
  handler: async (ctx) => {
    await checkSuperAdmin(ctx);

    const pendingJobs = await ctx.db
      .query("crawlJobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const runningJobs = await ctx.db
      .query("crawlJobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();

    return [...pendingJobs, ...runningJobs].sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Returns the global AI configuration.
 * Super-admin only. Masks the API key.
 */
export const getAIConfig = query({
  args: {},
  handler: async (ctx) => {
    await checkSuperAdmin(ctx);
    const config = await ctx.db.query("aiConfig").first();
    if (!config) return null;

    // Mask the key: show only last 4 chars
    const maskedKey = config.apiKeyEncrypted.length > 8
      ? `****${config.apiKeyEncrypted.slice(-4)}`
      : "****";

    return {
      ...config,
      apiKeyEncrypted: maskedKey,
    };
  },
});

/**
 * Sets or updates the global AI configuration.
 * Super-admin only.
 */
export const setAIConfig = mutation({
  args: {
    provider: v.union(v.literal("openrouter"), v.literal("openai"), v.literal("custom")),
    model: v.string(),
    baseURL: v.optional(v.string()),
    embeddingModel: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await checkSuperAdmin(ctx);
    const existing = await ctx.db.query("aiConfig").first();

    if (!args.apiKey && !existing) {
      throw new Error("API key is required for initial AI configuration");
    }

    const configData = {
      provider: args.provider,
      model: args.model,
      baseURL: args.baseURL,
      embeddingModel: args.embeddingModel,
      apiKeyEncrypted: args.apiKey ?? existing?.apiKeyEncrypted ?? "",
      updatedAt: Date.now(),
      updatedBy: user._id,
    };

    if (existing) {
      await ctx.db.patch(existing._id, configData);
    } else {
      await ctx.db.insert("aiConfig", configData);
    }
  },
});

export const getSecurityStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkSuperAdmin(ctx);

    const days = args.days ?? 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("securityEvents")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect();

    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byType: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const event of events) {
      bySeverity[event.severity] += 1;
      byType[event.eventType] = (byType[event.eventType] ?? 0) + 1;
      byDay[event.dayBucket] = (byDay[event.dayBucket] ?? 0) + 1;
    }

    return {
      total: events.length,
      blocked: events.filter((event) => event.blocked).length,
      bySeverity,
      byType,
      byDay,
    };
  },
});

export const listSecurityEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkSuperAdmin(ctx);

    const limit = Math.min(args.limit ?? 50, 200);
    const events = await ctx.db
      .query("securityEvents")
      .order("desc")
      .take(limit);

    return events.map((event) => ({
      _id: event._id,
      projectId: event.projectId,
      eventType: event.eventType,
      severity: event.severity,
      patternsMatched: event.patternsMatched,
      confidenceScore: event.confidenceScore,
      contentLength: event.contentLength,
      endpoint: event.endpoint,
      blocked: event.blocked,
      createdAt: event.createdAt,
    }));
  },
});
