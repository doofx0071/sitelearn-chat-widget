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
        metadata: v.object({
          headings: v.optional(v.array(v.string())),
          section: v.optional(v.string()),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);

    // Delete old chunks for this page if any (re-crawl)
    const existingChunks = await ctx.db
      .query("chunks")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
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
        url: page?.url ?? "",
        pageTitle: page?.title,
        content: chunk.content,
        chunkIndex: i,
        tokenCount: chunk.content.split(/\s+/).filter(Boolean).length,
        embedding: chunk.embedding,
        metadata: {
          section: chunk.metadata.section,
          headings: chunk.metadata.headings,
        },
      });
    }

    await ctx.db.patch(args.pageId, {
      status: "embedded",
      lastCrawledAt: Date.now(),
    });
  },
});

export const markPageEmbedFailed = internalMutation({
  args: {
    pageId: v.id("crawledPages"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return;

    await ctx.db.patch(args.pageId, {
      status: "failed",
      errorMessage: args.error,
    });

    const job = await ctx.db.get(page.crawlJobId);
    if (job) {
      await ctx.db.patch(job._id, {
        failedUrls: job.failedUrls + 1,
      });
    }
  },
});
