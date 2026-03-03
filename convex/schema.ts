import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    billingEmail: v.optional(v.string()),
    maxProjects: v.number(),
    maxPagesPerProject: v.number(),
    subscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  members: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(), // Better Auth user ID (string)
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    invitedBy: v.optional(v.string()), // Better Auth user ID (string)
    joinedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_userId", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // Global roles for super-admins (since Better Auth component schema is strict)
  userRoles: defineTable({
    userId: v.string(), // Better Auth user ID
    role: v.union(v.literal("admin"), v.literal("user")),
  }).index("by_userId", ["userId"]),

  aiConfig: defineTable({
    provider: v.union(v.literal("openrouter"), v.literal("openai"), v.literal("custom")),
    model: v.string(),
    baseURL: v.optional(v.string()),
    embeddingModel: v.optional(v.string()),
    apiKeyEncrypted: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(), // Better Auth user ID
  }),

  // Note: users table is provided by @convex-dev/better-auth component
  // We reference it via members.userId which links to the Better Auth users table

  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    domain: v.string(),
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
      modelProvider: v.optional(v.union(v.literal("openrouter"), v.literal("custom"))),
      modelId: v.optional(v.string()),
    }),
    learningConfig: v.optional(v.object({
      depth: v.union(v.literal("single"), v.literal("nested"), v.literal("full")),
      schedule: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("manual")),
      excludedPaths: v.array(v.string()),
    })),
    crawlStatus: v.optional(v.union(
      v.literal("idle"),
      v.literal("crawling"),
      v.literal("completed"),
      v.literal("failed")
    )),
    lastCrawledAt: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_domain", ["domain"]),

  botApiKeys: defineTable({
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    keyHash: v.string(),
    keyPrefix: v.string(),
    name: v.string(),
    allowedOrigins: v.array(v.string()),
    rateLimitPerMinute: v.number(),
    rateLimitPerDay: v.number(),
    lastUsedAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_keyHash", ["keyHash"])
    .index("by_projectId", ["projectId"])
    .index("by_workspaceId", ["workspaceId"]),

  crawlJobs: defineTable({
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    totalUrls: v.number(),
    processedUrls: v.number(),
    failedUrls: v.number(),
    depth: v.optional(v.union(v.literal("single"), v.literal("nested"), v.literal("full"))),
    error: v.optional(v.string()),
    coverageWarning: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_status", ["status"]),

  crawledPages: defineTable({
    projectId: v.id("projects"),
    crawlJobId: v.id("crawlJobs"),
    url: v.string(),
    title: v.optional(v.string()),
    content: v.string(),
    contentHash: v.string(),
    httpStatus: v.optional(v.number()),
    contentLength: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("crawled"),
      v.literal("chunked"),
      v.literal("embedded"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    lastCrawledAt: v.optional(v.number()),
  })
    .index("by_projectId", ["projectId"])
    .index("by_crawlJobId", ["crawlJobId"])
    .index("by_project_url", ["projectId", "url"])
    .index("by_crawlJob_status", ["crawlJobId", "status"]),

  chunks: defineTable({
    projectId: v.id("projects"),
    pageId: v.id("crawledPages"),
    url: v.string(),
    pageTitle: v.optional(v.string()),
    content: v.string(),
    chunkIndex: v.number(),
    tokenCount: v.number(),
    embedding: v.array(v.float64()),
    metadata: v.object({
      headings: v.optional(v.array(v.string())),
      section: v.optional(v.string()),
    }),
  })
    .index("by_projectId", ["projectId"])
    .index("by_pageId", ["pageId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 2048,
      filterFields: ["projectId"],
    }),

  conversations: defineTable({
    projectId: v.id("projects"),
    sessionId: v.string(),
    visitorFingerprint: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    messageCount: v.number(),
    createdAt: v.number(),
    lastMessageAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_sessionId", ["sessionId"])
    .index("by_project_created", ["projectId", "createdAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    sources: v.optional(v.array(v.object({
      url: v.string(),
      title: v.optional(v.string()),
      snippet: v.string(),
    }))),
    tokenUsage: v.optional(v.object({
      prompt: v.number(),
      completion: v.number(),
    })),
    latencyMs: v.optional(v.number()),
    model: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_project_created", ["projectId", "createdAt"]),

  feedback: defineTable({
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    rating: v.union(v.literal("up"), v.literal("down")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_projectId", ["projectId"]),

  rateLimits: defineTable({
    key: v.string(), // "bot:{keyPrefix}:{ip}" or similar
    count: v.number(),
    windowStart: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expires", ["expiresAt"]),

  // Background tasks queue for scheduled operations
  tasks: defineTable({
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    type: v.union(v.literal("recrawl"), v.literal("cleanup")),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    scheduledAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_projectId", ["projectId"])
    .index("by_status_scheduled", ["status", "scheduledAt"]),

  securityEvents: defineTable({
    projectId: v.optional(v.id("projects")),
    eventType: v.union(
      v.literal("jailbreak_attempt"),
      v.literal("prompt_leak_blocked"),
      v.literal("origin_violation"),
      v.literal("invalid_credentials"),
      v.literal("rate_limited")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    sessionHash: v.string(),
    ipHash: v.string(),
    patternsMatched: v.array(v.string()),
    confidenceScore: v.number(),
    contentLength: v.number(),
    endpoint: v.string(),
    blocked: v.boolean(),
    createdAt: v.number(),
    dayBucket: v.string(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_eventType_createdAt", ["eventType", "createdAt"])
    .index("by_dayBucket", ["dayBucket"]),

});
