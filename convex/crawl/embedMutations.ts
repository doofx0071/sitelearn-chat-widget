import { v } from "convex/values";
import { internalQuery, internalMutation } from "../_generated/server";

export const getPage = internalQuery({
  args: { pageId: v.id("crawledPages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pageId);
  },
});

export const saveChunks = internalMutation({
  args: {
    projectId: v.id("projects"),
    pageId: v.id("crawledPages"),
    chunks: v.array(
      v.object({
        content: v.string(),
        embedding: v.array(v.float64()),
        metadata: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete old chunks for this page if any (re-crawl)
    const existingChunks = await ctx.db
      .query("chunks")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("pageId"), args.pageId))
      .collect();

    for (const chunk of existingChunks) {
      await ctx.db.delete(chunk._id);
    }

    // Insert new chunks
    for (let i = 0; i < args.chunks.length; i++) {
      const chunk = args.chunks[i];
      await ctx.db.insert("chunks", {
        projectId: args.projectId,
        pageId: args.pageId,
        url: "", // Should be passed from action
        content: chunk.content,
        chunkIndex: i,
        tokenCount: 0, // Should be calculated
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      });
    }
  },
});
