import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const getMyWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;
    
    const member = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
      
    if (!member) return null;
    
    return await ctx.db.get(member.workspaceId);
  },
});

export const ensureWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existingMember) {
      return existingMember.workspaceId;
    }

    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "My Workspace",
      slug: `workspace-${now}`,
      plan: "free",
      maxProjects: 3,
      maxPagesPerProject: 100,
      createdAt: now,
    });

    await ctx.db.insert("members", {
      workspaceId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    return workspaceId;
  },
});

export const listMembers = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new Error("Unauthorized");

    const members = await ctx.db
      .query("members")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const profile = await authComponent.getAnyUserById(ctx, member.userId);
        return {
          _id: member._id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          name: profile?.name ?? "Unknown User",
          email: profile?.email ?? "",
        };
      })
    );
  },
});
