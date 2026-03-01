import { exposeApi } from "convex-firecrawl-scrape";

import { components } from "./_generated/api";

export const { scrape, getCached, getStatus, getContent, invalidate } = exposeApi(
  components.firecrawlScrape,
  {
    auth: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        throw new Error("Missing FIRECRAWL_API_KEY");
      }
      return apiKey;
    },
  }
);
