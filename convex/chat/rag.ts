import { v } from "convex/values";
import { internalAction, internalQuery, internalMutation, mutation, query, QueryCtx, ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { buildRagContext, ChunkResult } from "../../src/lib/rag/context-builder";
import { Id } from "../_generated/dataModel";

export const searchRelevantChunks = internalQuery({
  args: {
    projectId: v.id("projects"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args): Promise<ChunkResult[]> => {
    const results = await ctx.db
      .query("chunks")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    // In a real app, we would use vector search here.
    // For now, we'll just return the first 5 chunks as a placeholder.
    const limitedResults = results.slice(0, 5);

    return Promise.all(
      limitedResults.map(async (result): Promise<ChunkResult> => {
        const page = await ctx.db.get(result.pageId);
        return {
          content: result.content,
          url: result.url,
          pageTitle: result.pageTitle,
          score: 1.0, // Score not directly available in this API
        };
      })
    );
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

export const generateChatResponse = internalAction({
  args: {
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
    message: v.string(),
  },
  handler: async (ctx: ActionCtx, args: GenerateChatResponseArgs): Promise<string> => {
    // 1. Get project and provider config
    const project = await ctx.runQuery(internal.chat.rag.getProject, { projectId: args.projectId });
    if (!project) throw new Error("Project not found");

    const providerKey = await ctx.runQuery(internal.chat.rag.getProviderKey, { workspaceId: project.workspaceId });
    if (!providerKey) throw new Error("No LLM provider configured for workspace");

    // 2. Generate embedding for query
    const embedding = await ctx.runAction(internal.chat.llm.generateEmbeddingAction, {
      text: args.message,
      workspaceId: project.workspaceId,
    });

    // 3. Search relevant chunks
    const chunks = await ctx.runQuery(internal.chat.rag.searchRelevantChunks, {
      projectId: args.projectId,
      embedding,
    });

    // 4. Build context
    const context = buildRagContext(args.message, chunks);

    // 5. Get conversation history
    const history: Array<{ role: string; content: string }> = await ctx.runQuery(internal.chat.rag.getConversationMessages, {
      conversationId: args.conversationId,
    });

    const messages: ChatMessage[] = [
      { role: "system", content: `You are a helpful assistant for ${project.name}. ${context}` },
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

export const getProviderKey = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx: QueryCtx, args: { workspaceId: Id<"workspaces"> }) => {
    return await ctx.db
      .query("providerKeys")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
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
      await ctx.scheduler.runAfter(0, internal.chat.rag.generateChatResponse, {
        projectId: conversation.projectId,
        conversationId: args.conversationId,
        message: args.content,
      } as any);
    }

    return messageId;
  },
});

export const addMessageInternal = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: conversation.projectId,
      role: args.role,
      content: args.content,
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
      await ctx.scheduler.runAfter(0, internal.chat.rag.generateChatResponse, {
        projectId: conversation.projectId,
        conversationId: args.conversationId,
        message: args.content,
      } as any);
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
