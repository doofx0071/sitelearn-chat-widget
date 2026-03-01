export interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

export class RobotsParser {
  private rules: RobotsRule[] = [];
  private sitemaps: string[] = [];

  constructor(content: string) {
    this.parse(content);
  }

  private parse(content: string) {
    const lines = content.split(/\r?\n/);
    let currentRule: RobotsRule | null = null;

    for (let line of lines) {
      line = line.split('#')[0].trim();
      if (!line) continue;

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'user-agent') {
        if (currentRule && currentRule.userAgent !== value) {
          this.rules.push(currentRule);
        }
        currentRule = { userAgent: value, allow: [], disallow: [] };
      } else if (currentRule) {
        if (lowerKey === 'allow') currentRule.allow.push(value);
        else if (lowerKey === 'disallow') currentRule.disallow.push(value);
        else if (lowerKey === 'crawl-delay') currentRule.crawlDelay = parseFloat(value);
      }

      if (lowerKey === 'sitemap') {
        this.sitemaps.push(value);
      }
    }
    if (currentRule) this.rules.push(currentRule);
  }

  isAllowed(url: string, userAgent: string = '*'): boolean {
    let path = '/';
    try {
      path = new URL(url).pathname;
    } catch {
      return false;
    }
    const rule = this.rules.find(r => r.userAgent === userAgent) || this.rules.find(r => r.userAgent === '*');
    
    if (!rule) return true;

    // Check disallow first
    for (const pattern of rule.disallow) {
      if (pattern && path.startsWith(pattern)) {
        // Check if there's a more specific allow
        const allowed = rule.allow.some(a => a && path.startsWith(a) && a.length >= pattern.length);
        if (!allowed) return false;
      }
    }
    return true;
  }

  getCrawlDelay(userAgent: string = '*'): number {
    const rule = this.rules.find(r => r.userAgent === userAgent) || this.rules.find(r => r.userAgent === '*');
    return rule?.crawlDelay || 0;
  }

  getSitemaps(): string[] {
    return this.sitemaps;
  }
}

export async function fetchAndParseRobotsTxt(baseUrl: string): Promise<RobotsParser> {
  try {
    const url = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(url);
    const content = response.ok ? await response.text() : '';
    return new RobotsParser(content);
  } catch {
    return new RobotsParser('');
  }
}
