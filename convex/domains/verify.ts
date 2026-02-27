import { v } from "convex/values";
import { internalAction, internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const initiateVerification = mutation({
  args: {
    projectId: v.id("projects"),
    type: v.union(v.literal("dns"), v.literal("html")),
  },
  handler: async (ctx, args) => {
    const token = `sitelearn-verify-${Math.random().toString(36).substring(2)}`;
    // In a real app, you'd store this in a 'domainVerifications' table
    // For now, we'll just return it
    return { token };
  },
});

export const checkVerification = internalAction({
  args: {
    projectId: v.id("projects"),
    domain: v.string(),
    token: v.string(),
    type: v.union(v.literal("dns"), v.literal("html")),
  },
  handler: async (ctx, args) => {
    if (args.type === "dns") {
      try {
        // Mock DNS check
        // const records = await resolveTxt(`_sitelearn.${args.domain}`);
        // return records.includes(args.token);
        return true; 
      } catch (e) {
        return false;
      }
    } else {
      try {
        const response = await fetch(`https://${args.domain}`);
        const html = await response.text();
        return html.includes(args.token);
      } catch (e) {
        return false;
      }
    }
  },
});

export const updateVerification = internalMutation({
  args: {
    projectId: v.id("projects"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Update project status
    // await ctx.db.patch(args.projectId, { verified: args.verified });
  },
});
