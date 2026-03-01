"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { chunkText } from "../../src/lib/rag/chunker";

export const chunkAndEmbed = internalAction({
  args: {
    pageId: v.id("crawledPages"),
  },
  handler: async (ctx, args) => {
    try {
      const page = await ctx.runQuery(internal.crawl.embedMutations.getPage, { pageId: args.pageId });
      if (!page || !page.content) return;

      const project = await ctx.runQuery(internal.crawl.workerMutations.getProject, {
        projectId: page.projectId,
      });
      if (!project) return;

      const preparedContent = page.title
        ? `# ${page.title}\n\n${page.content}`
        : page.content;

      const textChunks = chunkText(preparedContent, {
        maxTokens: 800,
        overlap: 120,
      }).filter((c) => c.text.trim().length > 40);

      const chunks = [];
      for (const chunk of textChunks) {
        const embedding = await ctx.runAction(internal.chat.llm.generateEmbeddingAction, {
          text: chunk.text,
          workspaceId: project.workspaceId,
        });
        chunks.push({
          content: chunk.text,
          embedding,
          metadata: {
            section: chunk.section ?? page.title ?? undefined,
            headings: chunk.headings,
          },
        });
      }

      if (chunks.length > 0) {
        await ctx.runMutation(internal.crawl.embedMutations.saveChunks, {
          projectId: page.projectId,
          pageId: page._id,
          chunks,
        });
      }
    } catch (error) {
      await ctx.runMutation(internal.crawl.embedMutations.markPageEmbedFailed, {
        pageId: args.pageId,
        error: error instanceof Error ? error.message : "Embedding failed",
      });
    }
  },
});
