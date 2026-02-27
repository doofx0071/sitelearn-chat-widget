export interface Chunk {
  text: string;
  tokenCount: number;
  headings?: string[];
  section?: string;
}

export interface ChunkOptions {
  maxTokens: number;
  overlap: number;
}

/**
 * Estimates token count. 
 * Simple approximation: ~4 characters per token for English text.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunks text by headings, paragraphs, and sentences.
 */
export function chunkText(content: string, options: ChunkOptions): Chunk[] {
  const { maxTokens, overlap } = options;
  const chunks: Chunk[] = [];
  
  // Split by headings (Markdown style)
  const sections = content.split(/(?=^#+ )/m);
  
  let currentHeadings: string[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^#+ (.*)$/m);
    if (headingMatch) {
      currentHeadings = [headingMatch[1]];
    }

    const paragraphs = section.split(/\n\n+/);
    let currentChunkText = "";

    for (const para of paragraphs) {
      const paraTokens = estimateTokenCount(para);

      if (estimateTokenCount(currentChunkText + para) <= maxTokens) {
        currentChunkText += (currentChunkText ? "\n\n" : "") + para;
      } else {
        // If paragraph itself is too big, split into sentences
        if (paraTokens > maxTokens) {
          const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
          for (const sentence of sentences) {
            if (estimateTokenCount(currentChunkText + sentence) <= maxTokens) {
              currentChunkText += (currentChunkText ? " " : "") + sentence;
            } else {
              if (currentChunkText) {
                chunks.push({
                  text: currentChunkText,
                  tokenCount: estimateTokenCount(currentChunkText),
                  headings: [...currentHeadings],
                });
                // Handle overlap
                const words = currentChunkText.split(/\s+/);
                currentChunkText = words.slice(-Math.floor(overlap / 2)).join(" ") + " " + sentence;
              } else {
                // Sentence itself is too long, just force it
                currentChunkText = sentence;
              }
            }
          }
        } else {
          chunks.push({
            text: currentChunkText,
            tokenCount: estimateTokenCount(currentChunkText),
            headings: [...currentHeadings],
          });
          // Simple overlap: take last few words
          const words = currentChunkText.split(/\s+/);
          currentChunkText = words.slice(-Math.floor(overlap / 2)).join(" ") + "\n\n" + para;
        }
      }
    }

    if (currentChunkText) {
      chunks.push({
        text: currentChunkText,
        tokenCount: estimateTokenCount(currentChunkText),
        headings: [...currentHeadings],
      });
    }
  }

  return chunks;
}
