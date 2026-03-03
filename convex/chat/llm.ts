import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateEmbedding as genEmbedding } from "../../src/lib/rag/embeddings";

/**
 * Internal query to get the global AI configuration.
 */
export const getGlobalAIConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("aiConfig").first();
  },
});

export const generateEmbeddingAction = internalAction({
  args: {
    text: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<number[]> => {
    const config = await ctx.runQuery(internal.chat.llm.getGlobalAIConfig);
    if (!config) throw new Error("Global AI configuration not found");
    if (!config.embeddingModel?.trim()) {
      throw new Error("Global embedding model is not configured. Set it in Admin -> AI.");
    }

    return await genEmbedding(args.text, {
      provider: config.provider as "openrouter" | "openai" | "custom",
      apiKey: config.apiKeyEncrypted,
      baseURL: config.baseURL,
      model: config.embeddingModel.trim(),
    });
  },
});

export const callLLM = internalAction({
  args: {
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<string> => {
    const config = await ctx.runQuery(internal.chat.llm.getGlobalAIConfig);
    if (!config) throw new Error("Global AI configuration not found");
    if (!config.model?.trim()) {
      throw new Error("Global chat model is not configured. Set it in Admin -> AI.");
    }

    const apiKey = config.apiKeyEncrypted;
    const baseURL = config.baseURL || "https://openrouter.ai/api/v1";

    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model.trim(),
            messages: args.messages,
          }),
        });

        if (response.status === 429) {
          const wait = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, wait));
          retries++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`LLM request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        if (retries === maxRetries) throw error;
        retries++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
    throw new Error("Failed to call LLM after retries");
  },
});
