import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * List all conversations for a project, ordered by most recent first.
 * Paginates using cursor-based approach with a limit.
 */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_project_created", (q) =>
        q.eq("projectId", args.projectId)
      )
      .order("desc")
      .take(limit);

    return conversations;
  },
});

/**
 * Get a single conversation with all its messages, ordered chronologically.
 */
export const getWithMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Fetch feedback for each message
    const messagesWithFeedback = await Promise.all(
      messages.map(async (message) => {
        const feedback = await ctx.db
          .query("feedback")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .first();
        return { ...message, feedback: feedback ?? null };
      })
    );

    return { ...conversation, messages: messagesWithFeedback };
  },
});

/**
 * Get unanswered / low-confidence questions:
 * - Messages that received a "down" (thumbs down) feedback rating
 * - Includes the user question that preceded the rated assistant response
 */
export const getLowConfidenceQuestions = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get all thumbs-down feedback for this project
    const negativeRatings = await ctx.db
      .query("feedback")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit);

    const downRatings = negativeRatings.filter((f) => f.rating === "down");

    // For each negative rating, get the assistant message and the preceding user message
    const questions = await Promise.all(
      downRatings.map(async (rating) => {
        const assistantMessage = await ctx.db.get(rating.messageId);
        if (!assistantMessage) return null;

        // Get the conversation to find the preceding user message
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", rating.conversationId)
          )
          .order("asc")
          .collect();

        // Find the user message that immediately preceded this assistant message
        const assistantIndex = allMessages.findIndex(
          (m) => m._id === rating.messageId
        );
        const userMessage =
          assistantIndex > 0 &&
          allMessages[assistantIndex - 1].role === "user"
            ? allMessages[assistantIndex - 1]
            : null;

        return {
          feedbackId: rating._id,
          conversationId: rating.conversationId,
          rating: rating.rating,
          note: rating.note ?? null,
          feedbackCreatedAt: rating.createdAt,
          userQuestion: userMessage?.content ?? null,
          assistantAnswer: assistantMessage.content,
          assistantMessageId: assistantMessage._id,
        };
      })
    );

    return questions.filter(Boolean);
  },
});

/**
 * Get aggregate conversation stats for a project.
 */
export const getStats = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const [conversations, negativeRatings, positiveRatings] = await Promise.all(
      [
        ctx.db
          .query("conversations")
          .withIndex("by_projectId", (q) =>
            q.eq("projectId", args.projectId)
          )
          .collect(),
        ctx.db
          .query("feedback")
          .withIndex("by_projectId", (q) =>
            q.eq("projectId", args.projectId)
          )
          .filter((q) => q.eq(q.field("rating"), "down"))
          .collect(),
        ctx.db
          .query("feedback")
          .withIndex("by_projectId", (q) =>
            q.eq("projectId", args.projectId)
          )
          .filter((q) => q.eq(q.field("rating"), "up"))
          .collect(),
      ]
    );

    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.messageCount,
      0
    );

    return {
      totalConversations: conversations.length,
      totalMessages,
      thumbsUp: positiveRatings.length,
      thumbsDown: negativeRatings.length,
    };
  },
});
