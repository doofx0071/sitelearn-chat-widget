import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

export interface ExtractedContent {
  title: string;
  content: string;
  html: string;
  links: string[];
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

    // Extract links for discovery
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => (a as any).getAttribute('href'))
      .filter(Boolean) as string[];
    
    // Use Readability for main content extraction
    const reader = new Readability(document as any);
    const article = reader.parse();

    if (article) {
      return {
        title: article.title || document.title || '',
        content: article.textContent || '',
        html: article.content || html,
        links
      };
    }

    // Fallback to simple extraction
    return {
      title: document.title || '',
      content: document.body?.textContent?.trim() || '',
      html: html,
      links
    };
  } catch (error) {
    console.error(`Extraction error for ${url}:`, error);
    return {
      title: '',
      content: '',
      html: '',
      links: []
    };
  }
}
