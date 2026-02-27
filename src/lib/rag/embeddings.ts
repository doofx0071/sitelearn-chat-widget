export interface ProviderConfig {
  provider: 'openrouter' | 'custom';
  apiKey: string;
  baseURL?: string;
  model?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateEmbedding(text: string, config: ProviderConfig): Promise<number[]> {
  const results = await generateEmbeddings([text], config);
  return results[0];
}

export async function generateEmbeddings(texts: string[], config: ProviderConfig): Promise<number[][]> {
  const baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
  const model = config.model || 'openrouter/free';
  
  let retries = 0;
  const maxRetries = 3;

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
          input: texts,
        }),
      });

      if (response.status === 429) {
        const wait = Math.pow(2, retries) * 1000;
        await sleep(wait);
        retries++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Embedding request failed: ${response.statusText}`);
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
