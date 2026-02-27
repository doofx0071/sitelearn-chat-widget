import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getAuthenticatedUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  // identity.subject is the Better Auth user ID
  return identity.subject as string;
}

export async function authorizeWorkspaceMember(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">
) {
  const userIdStr = await getAuthenticatedUserId(ctx);
  if (!userIdStr) {
    throw new Error("Unauthorized: Not authenticated");
  }

  // Cast to Id<"users"> since Better Auth manages this table
  const userId = userIdStr as any;

  const member = await ctx.db
    .query("members")
    .withIndex("by_workspace_user", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .unique();

  if (!member) {
    throw new Error("Unauthorized: Not a member of this workspace");
  }

  return { userId, member };
}

export async function authorizeWorkspaceAdmin(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">
) {
  const { userId, member } = await authorizeWorkspaceMember(ctx, workspaceId);
  if (member.role !== "admin" && member.role !== "owner") {
    throw new Error("Unauthorized: Admin access required");
  }
  return { userId, member };
}

export async function authorizeProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">
) {
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const { userId, member } = await authorizeWorkspaceMember(ctx, project.workspaceId);
  return { userId, member, project };
}
