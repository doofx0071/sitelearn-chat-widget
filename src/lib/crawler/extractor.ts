import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

export interface ExtractedContent {
  title: string;
  content: string;
  html: string;
}

/**
 * Fetches a URL and extracts its content using Readability.
 */
export async function fetchAndExtract(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const html = await response.text();
    
    const { document } = parseHTML(html);
    
    // Use Readability for main content extraction
    const reader = new Readability(document as any);
    const article = reader.parse();

    if (article) {
      return {
        title: article.title || document.title || '',
        content: article.textContent || '',
        html: article.content || html
      };
    }

    // Fallback to simple extraction
    return {
      title: document.title || '',
      content: document.body?.textContent?.trim() || '',
      html: html
    };
  } catch (error) {
    console.error(`Extraction error for ${url}:`, error);
    return {
      title: '',
      content: '',
      html: ''
    };
  }
}
