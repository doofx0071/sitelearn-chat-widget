import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/api/widget/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("Origin");

    const withCors = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-SiteLearn-Client, x-api-key",
          Vary: "Origin",
        },
      });

    const body = await request.json();
    const { message, conversationId, externalUserId, sessionId, botId } = body as {
      message?: string;
      conversationId?: Id<"conversations">;
      externalUserId?: string;
      sessionId?: string;
      botId?: string;
    };

    if (!message?.trim()) {
      return withCors(400, { error: "Message is required" });
    }

    let project = null;
    const apiKey = request.headers.get("x-api-key");

    if (apiKey) {
      project = await ctx.runQuery(internal.widget.auth.validateBotKey, { keyHash: apiKey });
    } else if (botId) {
      project = await ctx.runQuery(internal.widget.auth.getProjectById, {
        projectId: botId as Id<"projects">,
      });
    }

    if (!project) {
      return withCors(401, { error: "Invalid bot or API key" });
    }

    const isLocalOrigin = Boolean(origin && /https?:\/\/localhost(?::\d+)?$/i.test(origin));
    if (project.domain !== "*" && origin && !origin.includes(project.domain) && !isLocalOrigin) {
      return withCors(403, { error: "Unauthorized origin" });
    }

    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await ctx.runMutation(internal.widget.auth.checkRateLimit, {
      key: `chat:${project._id}:${ip}`,
      limit: 10, // 10 requests
      windowMs: 60000, // per minute
    });

    if (!rateLimit.allowed) {
      return withCors(429, { error: "Rate limit exceeded" });
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
      content: message,
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

    return withCors(200, {
      id: assistantMessage?._id,
      content: assistantMessage?.content ?? "I am still learning. Please try again in a moment.",
      citations: assistantMessage?.sources ?? [],
      timestamp: new Date().toISOString(),
      conversationId: effectiveConversationId,
    });
  }),
});

http.route({
  path: "/api/widget/config",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);
    const botId = url.searchParams.get("botId");

    const withCors = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          Vary: "Origin",
        },
      });

    if (!botId) {
      return withCors(400, { error: "botId is required" });
    }

    const project = await ctx.runQuery(internal.widget.auth.getProjectById, {
      projectId: botId as Id<"projects">,
    });
    if (!project) {
      return withCors(404, { error: "Project not found" });
    }

    const isLocalOrigin = Boolean(origin && /https?:\/\/localhost(?::\d+)?$/i.test(origin));
    if (project.domain !== "*" && origin && !origin.includes(project.domain) && !isLocalOrigin) {
      return withCors(403, { error: "Unauthorized origin" });
    }

    return withCors(200, {
      botConfig: project.botConfig,
    });
  }),
});

export default http;
