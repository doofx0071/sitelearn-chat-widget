import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function dayBucket(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export const logSecurityEvent = internalMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    eventType: v.union(
      v.literal("jailbreak_attempt"),
      v.literal("prompt_leak_blocked"),
      v.literal("origin_violation"),
      v.literal("invalid_credentials"),
      v.literal("rate_limited")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    sessionId: v.optional(v.string()),
    ip: v.optional(v.string()),
    patternsMatched: v.array(v.string()),
    confidenceScore: v.number(),
    contentLength: v.number(),
    endpoint: v.string(),
    blocked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    await ctx.db.insert("securityEvents", {
      projectId: args.projectId,
      eventType: args.eventType,
      severity: args.severity,
      sessionHash: hashString(args.sessionId ?? "anonymous"),
      ipHash: hashString(args.ip ?? "unknown"),
      patternsMatched: args.patternsMatched,
      confidenceScore: args.confidenceScore,
      contentLength: args.contentLength,
      endpoint: args.endpoint,
      blocked: args.blocked,
      createdAt: timestamp,
      dayBucket: dayBucket(timestamp),
    });
  },
});
