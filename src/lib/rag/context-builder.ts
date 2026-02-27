export interface ChunkResult {
  content: string;
  url: string;
  pageTitle?: string;
  score?: number;
  section?: string;
}

export interface Citation {
  content: string;
  url: string;
  title: string;
}

/**
 * Builds a context string for the LLM from retrieved chunks.
 */
export function buildRagContext(query: string, chunks: ChunkResult[]): string {
  if (chunks.length === 0) return "";

  const contextParts = chunks.map((chunk, index) => {
    const header = `[Source ${index + 1}]: ${chunk.pageTitle || chunk.url}${chunk.section ? ` - ${chunk.section}` : ""}`;
    return `${header}\n${chunk.content}`;
  });

  return `Use the following context to answer the user's question: "${query}"\n\n${contextParts.join("\n\n")}`;
}

/**
 * Formats chunks into citation objects.
 */
export function formatCitations(chunks: ChunkResult[]): Citation[] {
  return chunks.map(chunk => ({
    content: chunk.content,
    url: chunk.url,
    title: chunk.pageTitle || chunk.url
  }));
}

/**
 * Simple keyword-based relevance score as a fallback/supplement to vector search.
 */
export function calculateRelevanceScore(query: string, chunk: ChunkResult): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  const content = chunk.content.toLowerCase();
  
  if (queryTerms.length === 0) return 0;
  
  let matches = 0;
  for (const term of queryTerms) {
    if (content.includes(term)) {
      matches++;
    }
  }
  
  return matches / queryTerms.length;
}
