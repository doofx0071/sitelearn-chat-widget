import { components } from "./_generated/api";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

/**
 * Normalize URL by removing trailing slash
 */
function normalizeOrigin(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Parse comma-separated origins string into array of normalized origins
 */
function parseOriginsList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin) => origin.length > 0);
}

/**
 * Build trusted origins from multiple environment sources
 */
function buildTrustedOrigins(): string[] {
  const origins = new Set<string>();

  // Primary site URL resolution (prefer explicit Better Auth URL)
  const siteUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const normalizedSiteUrl = normalizeOrigin(siteUrl);
  origins.add(normalizedSiteUrl);

  // Add individual env vars if present
  if (process.env.SITE_URL) origins.add(normalizeOrigin(process.env.SITE_URL));
  if (process.env.BETTER_AUTH_URL) origins.add(normalizeOrigin(process.env.BETTER_AUTH_URL));
  if (process.env.NEXT_PUBLIC_SITE_URL) origins.add(normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL));

  // Add comma-separated origin lists
  parseOriginsList(process.env.ALLOWED_ORIGINS).forEach((o) => origins.add(o));
  parseOriginsList(process.env.TRUSTED_ORIGINS).forEach((o) => origins.add(o));
  parseOriginsList(process.env.BETTER_AUTH_TRUSTED_ORIGINS).forEach((o) => origins.add(o));

  return Array.from(origins);
}

const siteUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";
const normalizedSiteUrl = normalizeOrigin(siteUrl);
const trustedOrigins = buildTrustedOrigins();

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: normalizedSiteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      },
    },
    plugins: [
      convex({ authConfig }),
    ],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
