import { v } from "convex/values";
import { internalAction, internalQuery, internalMutation, mutation, query, QueryCtx, ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { buildRagContext, ChunkResult, calculateRelevanceScore } from "../../src/lib/rag/context-builder";
import { Id } from "../_generated/dataModel";

export const getChunksByIds = internalQuery({
  args: {
    chunkIds: v.array(v.id("chunks")),
  },
  handler: async (ctx, args): Promise<ChunkResult[]> => {
    const chunks = [];
    for (const id of args.chunkIds) {
      const chunk = await ctx.db.get(id);
      if (chunk) {
        chunks.push({
          content: chunk.content,
          url: chunk.url,
          pageTitle: chunk.pageTitle,
          score: 1.0, // We'll overwrite this in the action
        });
      }
    }
    return chunks;
  },
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GenerateChatResponseArgs {
  projectId: Id<"projects">;
  conversationId: Id<"conversations">;
  message: string;
}

interface ChunkWithScore extends ChunkResult {
  keywordScore: number;
}

export const generateChatResponse = internalAction({
  args: {
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
    message: v.string(),
  },
  handler: async (ctx: ActionCtx, args: GenerateChatResponseArgs): Promise<string> => {
    // 1. Get project
    const project = await ctx.runQuery(internal.chat.rag.getProject, { projectId: args.projectId });
    if (!project) throw new Error("Project not found");

    // 2. Generate embedding for query
    const embedding = await ctx.runAction(internal.chat.llm.generateEmbeddingAction, {
      text: args.message,
      workspaceId: project.workspaceId,
    });

    // 3. Search relevant chunks
    const searchResults = await ctx.vectorSearch("chunks", "by_embedding", {
      vector: embedding,
      limit: 12,
      filter: (q) => q.eq("projectId", args.projectId),
    });

    const chunks = await ctx.runQuery(internal.chat.rag.getChunksByIds, {
      chunkIds: searchResults.map((r) => r._id),
    });

    // Attach scores + keyword relevance
    const chunksWithScores: ChunkWithScore[] = chunks
      .map((chunk: ChunkResult, i: number): ChunkWithScore => ({
        ...chunk,
        score: searchResults[i]?._score ?? 0,
        keywordScore: calculateRelevanceScore(args.message, chunk),
      }))
      .filter((chunk: ChunkWithScore) => (chunk.score ?? 0) >= 0.45 || chunk.keywordScore >= 0.25)
      .sort(
        (a: ChunkWithScore, b: ChunkWithScore) =>
          ((b.score ?? 0) + b.keywordScore) - ((a.score ?? 0) + a.keywordScore)
      )
      .slice(0, 8);

    // 4. Build context
    const context = buildRagContext(args.message, chunksWithScores);

    // 5. Get conversation history
    const history: Array<{ role: string; content: string }> = await ctx.runQuery(internal.chat.rag.getConversationMessages, {
      conversationId: args.conversationId,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          `You are the SiteLearn assistant for ${project.name}. ` +
          `Answer ONLY using the provided context sources. ` +
          `If the answer is not in the context, say: "I don't know based on the learned content." ` +
          `When possible, cite source numbers like [Source 1].\n\n` +
          context,
      },
      ...history.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      { role: "user", content: args.message }
    ];

    // 6. Call LLM
    const response: string = await ctx.runAction(internal.chat.llm.callLLM, {
      messages,
      workspaceId: project.workspaceId,
    });

    // 7. Save assistant message
    await ctx.runMutation(internal.chat.rag.addMessageInternal, {
      conversationId: args.conversationId,
      role: "assistant",
      content: response,
      sources: chunksWithScores.slice(0, 5).map((chunk: ChunkWithScore) => ({
        url: chunk.url,
        title: chunk.pageTitle,
        snippet: chunk.content.slice(0, 240),
      })),
    });

    return response;
  },
});

export const getProject = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx: QueryCtx, args: { projectId: Id<"projects"> }) => {
    return await ctx.db.get(args.projectId);
  },
});

export const getConversationMessages = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx: QueryCtx, args: { conversationId: Id<"conversations"> }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

export const createConversation = mutation({
  args: {
    projectId: v.id("projects"),
    sessionId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      projectId: args.projectId,
      sessionId: args.sessionId,
      messageCount: 0,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: conversation.projectId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });

    // Update conversation stats
    await ctx.db.patch(args.conversationId, {
      messageCount: conversation.messageCount + 1,
      lastMessageAt: Date.now(),
    });

    // If it's a user message, trigger the RAG response
    if (args.role === "user") {
      await ctx.scheduler.runAfter(0, internal.chat.rag.generateChatResponse as any, {
        projectId: conversation.projectId,
        conversationId: args.conversationId,
        message: args.content,
      });
    }

    return messageId;
  },
});

export const addMessageInternal = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.optional(v.string()),
          snippet: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: conversation.projectId,
      role: args.role,
      content: args.content,
      sources: args.sources,
      createdAt: Date.now(),
    });
  },
});

export const createConversationInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    sessionId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      projectId: args.projectId,
      sessionId: args.sessionId,
      messageCount: 0,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  },
});

export const addMessagePublicInternal = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.optional(v.string()),
          snippet: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: conversation.projectId,
      role: args.role,
      content: args.content,
      sources: args.sources,
      createdAt: Date.now(),
    });

    // Update conversation stats
    await ctx.db.patch(args.conversationId, {
      messageCount: conversation.messageCount + 1,
      lastMessageAt: Date.now(),
    });

    // If it's a user message, trigger the RAG response
    if (args.role === "user") {
      await ctx.scheduler.runAfter(0, internal.chat.rag.generateChatResponse as any, {
        projectId: conversation.projectId,
        conversationId: args.conversationId,
        message: args.content,
      });
    }

    return messageId;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();
      
    return { ...conversation, messages };
  },
});
