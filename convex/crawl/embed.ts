"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Mock embedding function - in a real app, this would call OpenAI/Anthropic
async function generateEmbedding(text: string): Promise<number[]> {
  // Return a dummy vector of 1536 dimensions
  return new Array(1536).fill(0).map(() => Math.random());
}

export const chunkAndEmbed = internalAction({
  args: {
    pageId: v.id("crawledPages"),
  },
  handler: async (ctx, args) => {
    const page = await ctx.runQuery(internal.crawl.embedMutations.getPage, { pageId: args.pageId });
    if (!page || !page.content) return;

    // Simple chunking by paragraph for now
    const paragraphs: string[] = page.content
      .split("\n")
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 100);

    const chunks = [];
    for (const content of paragraphs) {
      const embedding = await generateEmbedding(content);
      chunks.push({
        content,
        embedding,
        metadata: { url: page.url, title: page.title },
      });
    }

    if (chunks.length > 0) {
      await ctx.runMutation(internal.crawl.embedMutations.saveChunks, {
        projectId: page.projectId,
        pageId: page._id,
        chunks,
      });
    }
  },
});
