import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { authComponent, createAuth } from "./auth";
import { isLikelyJailbreak, safeRefusal, sanitizeUserInput } from "./chat/safety";
import { detectJailbreakPatterns } from "./chat/safety";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

function parseOrigin(origin: string | null): URL | null {
  if (!origin) return null;
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isAllowedOrigin(origin: string | null, domain: string): boolean {
  const parsedOrigin = parseOrigin(origin);
  if (!parsedOrigin) return false;

  const hostname = parsedOrigin.hostname.toLowerCase();
  const protocol = parsedOrigin.protocol;

  if (domain === "*") {
    return isLocalhost(hostname);
  }

  if (protocol !== "https:" && !isLocalhost(hostname)) {
    return false;
  }

  const targetDomain = domain.toLowerCase();
  return hostname === targetDomain || hostname.endsWith(`.${targetDomain}`);
}

function corsHeaders(allowedOrigin: string | null, methods: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, X-SiteLearn-Client, x-api-key",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  return headers;
}

function jsonResponse(status: number, body: unknown, allowedOrigin: string | null, methods: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(allowedOrigin, methods),
  });
}

function invalidCredentialResponse() {
  return new Response(JSON.stringify({ error: "Invalid credentials" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function logSecurityEventSafe(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  args: {
    projectId?: Id<"projects">;
    eventType: "jailbreak_attempt" | "prompt_leak_blocked" | "origin_violation" | "invalid_credentials" | "rate_limited";
    severity: "low" | "medium" | "high" | "critical";
    sessionId?: string;
    ip?: string;
    patternsMatched?: string[];
    confidenceScore?: number;
    contentLength?: number;
    endpoint: string;
    blocked: boolean;
  }
) {
  try {
    await ctx.runMutation(internal.security.logSecurityEvent, {
      projectId: args.projectId,
      eventType: args.eventType,
      severity: args.severity,
      sessionId: args.sessionId,
      ip: args.ip,
      patternsMatched: args.patternsMatched ?? [],
      confidenceScore: args.confidenceScore ?? 0,
      contentLength: args.contentLength ?? 0,
      endpoint: args.endpoint,
      blocked: args.blocked,
    });
  } catch {
    // best-effort logging; never block primary request
  }
}

function isLikelyConvexId(value: string): boolean {
  return /^[a-zA-Z0-9]{12,64}$/.test(value);
}

http.route({
  path: "/api/widget/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("Origin");

    const requestBody = await request.json();
    const { message, conversationId, externalUserId, sessionId, botId } = requestBody as {
      message?: string;
      conversationId?: Id<"conversations">;
      externalUserId?: string;
      sessionId?: string;
      botId?: string;
    };

    const trimmedMessage = sanitizeUserInput(message ?? "");
    if (!trimmedMessage) {
      return jsonResponse(400, { error: "Message is required" }, null, "POST, OPTIONS");
    }
    if (trimmedMessage.length > 4000) {
      return jsonResponse(400, { error: "Message is too long" }, null, "POST, OPTIONS");
    }

    const apiKey = request.headers.get("x-api-key")?.trim();
    if (!apiKey && (!botId || !isLikelyConvexId(botId))) {
      await logSecurityEventSafe(ctx, {
        eventType: "invalid_credentials",
        severity: "medium",
        endpoint: "/api/widget/chat",
        blocked: true,
      });
      return invalidCredentialResponse();
    }

    let project = null;
    let allowedOrigin: string | null = null;

    if (apiKey) {
      project = await ctx.runQuery(internal.widget.auth.validateBotKey, { keyHash: apiKey });
      const parsedOrigin = parseOrigin(origin);
      if (parsedOrigin && (parsedOrigin.protocol === "https:" || isLocalhost(parsedOrigin.hostname))) {
        allowedOrigin = parsedOrigin.origin;
      }
    } else if (botId) {
      project = await ctx.runQuery(internal.widget.auth.getProjectById, {
        projectId: botId as Id<"projects">,
      });
    }

    if (!project) {
      await logSecurityEventSafe(ctx, {
        eventType: "invalid_credentials",
        severity: "medium",
        endpoint: "/api/widget/chat",
        blocked: true,
      });
      return invalidCredentialResponse();
    }

    if (!apiKey) {
      if (!isAllowedOrigin(origin, project.domain)) {
        await logSecurityEventSafe(ctx, {
          projectId: project._id,
          eventType: "origin_violation",
          severity: "high",
          sessionId: externalUserId || sessionId,
          endpoint: "/api/widget/chat",
          blocked: true,
        });
        return invalidCredentialResponse();
      }

      const parsedOrigin = parseOrigin(origin);
      allowedOrigin = parsedOrigin?.origin ?? null;
    }

    if (isLikelyJailbreak(trimmedMessage)) {
      await logSecurityEventSafe(ctx, {
        projectId: project._id,
        eventType: "jailbreak_attempt",
        severity: "high",
        sessionId: externalUserId || sessionId,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        patternsMatched: detectJailbreakPatterns(trimmedMessage),
        confidenceScore: 0.95,
        contentLength: trimmedMessage.length,
        endpoint: "/api/widget/chat",
        blocked: true,
      });

      return jsonResponse(200, {
        content: safeRefusal(),
        citations: [],
        timestamp: new Date().toISOString(),
        conversationId,
      }, allowedOrigin, "POST, OPTIONS");
    }

    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await ctx.runMutation(internal.widget.auth.checkRateLimit, {
      key: `chat:${project._id}:${ip}`,
      limit: 30,
      windowMs: 60000,
    });

    if (!rateLimit.allowed) {
      await logSecurityEventSafe(ctx, {
        projectId: project._id,
        eventType: "rate_limited",
        severity: "medium",
        sessionId: externalUserId || sessionId,
        ip,
        contentLength: trimmedMessage.length,
        endpoint: "/api/widget/chat",
        blocked: true,
      });
      return jsonResponse(429, { error: "Rate limit exceeded" }, allowedOrigin, "POST, OPTIONS");
    }

    let effectiveConversationId = conversationId;
    if (!effectiveConversationId) {
      effectiveConversationId = await ctx.runMutation(internal.chat.rag.createConversationInternal, {
        projectId: project._id,
        sessionId: externalUserId || sessionId || "anonymous",
      });
    }

    await ctx.runMutation(internal.chat.rag.addMessagePublicInternal, {
      conversationId: effectiveConversationId,
      role: "user",
      content: trimmedMessage,
    });

    const startedAt = Date.now();
    let assistantMessage:
      | {
          _id: Id<"messages">;
          content: string;
          createdAt: number;
          sources?: Array<{ url: string; title?: string; snippet: string }>;
        }
      | null = null;

    while (Date.now() - startedAt < 12000) {
      const messages = await ctx.runQuery(internal.chat.rag.getConversationMessages, {
        conversationId: effectiveConversationId,
      });

      assistantMessage =
        messages
          .filter((entry) => entry.role === "assistant")
          .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

      if (assistantMessage?.content?.trim()) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return jsonResponse(200, {
      id: assistantMessage?._id,
      content: assistantMessage?.content ?? "I am still learning. Please try again in a moment.",
      citations: assistantMessage?.sources ?? [],
      timestamp: new Date().toISOString(),
      conversationId: effectiveConversationId,
    }, allowedOrigin, "POST, OPTIONS");
  }),
});

http.route({
  path: "/api/widget/config",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);
    const botId = url.searchParams.get("botId")?.trim();

    if (!botId || !isLikelyConvexId(botId)) {
      await logSecurityEventSafe(ctx, {
        eventType: "invalid_credentials",
        severity: "low",
        endpoint: "/api/widget/config",
        blocked: true,
      });
      return jsonResponse(400, { error: "Invalid request" }, null, "GET, OPTIONS");
    }

    const project = await ctx.runQuery(internal.widget.auth.getProjectById, {
      projectId: botId as Id<"projects">,
    });
    if (!project) {
      await logSecurityEventSafe(ctx, {
        eventType: "invalid_credentials",
        severity: "low",
        endpoint: "/api/widget/config",
        blocked: true,
      });
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (!isAllowedOrigin(origin, project.domain)) {
      await logSecurityEventSafe(ctx, {
        projectId: project._id,
        eventType: "origin_violation",
        severity: "high",
        endpoint: "/api/widget/config",
        blocked: true,
      });
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const parsedOrigin = parseOrigin(origin);
    const allowedOrigin = parsedOrigin?.origin ?? null;

    return jsonResponse(
      200,
      {
        botConfig: {
          name: project.botConfig.name,
          welcomeMessage: project.botConfig.welcomeMessage,
          primaryColor: project.botConfig.primaryColor,
          position: project.botConfig.position,
          headerFont: project.botConfig.headerFont,
          avatarStyle: project.botConfig.avatarStyle,
        },
      },
      allowedOrigin,
      "GET, OPTIONS"
    );
  }),
});

export default http;
