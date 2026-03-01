import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config.js";
import firecrawlScrape from "convex-firecrawl-scrape/convex.config.js";

const app = defineApp();
app.use(betterAuth);
app.use(firecrawlScrape);

export default app;
