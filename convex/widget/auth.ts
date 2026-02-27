import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const validateBotKey = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    const botKey = await ctx.db
      .query("botApiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", args.keyHash))
      .unique();
    
    if (!botKey) return null;
    
    const project = await ctx.db.get(botKey.projectId);
    return project;
  },
});

export const checkRateLimit = internalMutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rateLimit = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => 
        q.eq("key", args.key)
      )
      .unique();

    if (!rateLimit) {
      await ctx.db.insert("rateLimits", {
        key: args.key,
        count: 1,
        windowStart: now,
        expiresAt: now + args.windowMs,
      });
      return { allowed: true };
    }

    if (now > rateLimit.expiresAt) {
      await ctx.db.patch(rateLimit._id, {
        count: 1,
        windowStart: now,
        expiresAt: now + args.windowMs,
      });
      return { allowed: true };
    }

    if (rateLimit.count >= args.limit) {
      return { allowed: false, expiresAt: rateLimit.expiresAt };
    }

    await ctx.db.patch(rateLimit._id, {
      count: rateLimit.count + 1,
    });
    return { allowed: true };
  },
});
