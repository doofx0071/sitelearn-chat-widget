export interface ProviderConfig {
  provider: 'openrouter' | 'openai' | 'custom';
  apiKey: string;
  baseURL?: string;
  model?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeEmbeddingText(text: string): string {
  // Remove control characters and trim size to avoid provider 400s.
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!cleaned) return "(empty)";
  // Conservative cap to avoid token-limit 400 errors on long blocks.
  return cleaned.length > 12000 ? cleaned.slice(0, 12000) : cleaned;
}

export async function generateEmbedding(text: string, config: ProviderConfig): Promise<number[]> {
  const results = await generateEmbeddings([text], config);
  return results[0];
}

export async function generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
  if (!config.model) {
    throw new Error("Embedding model is required. Configure the embedding model in Admin AI settings.");
  }

  const baseURL =
    config.baseURL ||
    (config.provider === 'openai'
      ? 'https://api.openai.com/v1'
      : 'https://openrouter.ai/api/v1');

  const model = config.model;
  
  let retries = 0;
  const maxRetries = 3;

  const sanitizedTexts = texts.map(sanitizeEmbeddingText);

  while (retries <= maxRetries) {
    try {
      const response = await fetch(`${baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: sanitizedTexts,
          encoding_format: "float",
        }),
      });

      if (response.status === 429) {
        const wait = Math.pow(2, retries) * 1000;
        await sleep(wait);
        retries++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      if (retries === maxRetries) throw error;
      retries++;
      await sleep(Math.pow(2, retries) * 1000);
    }
  }
  
  throw new Error("Failed to generate embeddings after retries");
}
