export const DEFAULT_EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/login",
  "/logout",
  "/register",
  "/signup",
  "/signin",
  "/account",
  "/profile",
  "/settings",
  "/checkout",
  "/cart",
  "/payment",
  "/order",
  "/billing",
  "/private",
  "/internal",
  "/api",
  "/wp-admin",
  "/wp-login.php",
  "/_next",
];

function normalizePathPrefix(prefix: string): string | null {
  const trimmed = prefix.trim().toLowerCase();
  if (!trimmed) return null;

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/+$/, "") || "/";
}

export function mergeExcludedPathPrefixes(customPrefixes?: string[]): string[] {
  const merged = new Set<string>();

  for (const prefix of DEFAULT_EXCLUDED_PATH_PREFIXES) {
    const normalized = normalizePathPrefix(prefix);
    if (normalized) merged.add(normalized);
  }

  for (const prefix of customPrefixes ?? []) {
    const normalized = normalizePathPrefix(prefix);
    if (normalized) merged.add(normalized);
  }

  return Array.from(merged);
}

export function isExcludedPath(url: string, customPrefixes?: string[]): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();

    const exclusions = mergeExcludedPathPrefixes(customPrefixes);

    return exclusions.some((prefix) =>
      path === prefix || path.startsWith(`${prefix}/`)
    );
  } catch {
    return true;
  }
}
