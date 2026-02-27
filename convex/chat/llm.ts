import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateEmbedding as genEmbedding } from "../../src/lib/rag/embeddings";

export const generateEmbeddingAction = internalAction({
  args: {
    text: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<number[]> => {
    const providerKey = await ctx.runQuery(internal.chat.rag.getProviderKey, { workspaceId: args.workspaceId });
    if (!providerKey) throw new Error("No provider key found");

    // In a real app, you'd decrypt the key here
    const apiKey = providerKey.encryptedKey; 

    return await genEmbedding(args.text, {
      provider: providerKey.provider as any,
      apiKey,
    });
  },
});

export const callLLM = internalAction({
  args: {
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<string> => {
    const providerKey = await ctx.runQuery(internal.chat.rag.getProviderKey, { workspaceId: args.workspaceId });
    if (!providerKey) throw new Error("No provider key found");

    const apiKey = providerKey.encryptedKey;
    const baseURL = providerKey.provider === "openai" 
      ? "https://api.openai.com/v1" 
      : "https://openrouter.ai/api/v1";

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
            model: providerKey.provider === "openai" ? "gpt-4-turbo" : "openrouter/auto",
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
