import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/api/widget/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("Origin");
    
    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        },
      });
    }

    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return new Response("Missing API Key", { status: 401 });
    }

    // Validate API Key and get Project
    const project = await ctx.runQuery(internal.widget.auth.validateBotKey, { keyHash: apiKey });
    if (!project) {
      return new Response("Invalid API Key", { status: 401 });
    }

    // Origin Validation (Simple check)
    if (project.domain !== "*" && origin && !origin.includes(project.domain)) {
      return new Response("Unauthorized Origin", { status: 403 });
    }

    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await ctx.runMutation(internal.widget.auth.checkRateLimit, {
      key: `chat:${project._id}:${ip}`,
      limit: 10, // 10 requests
      windowMs: 60000, // per minute
    });

    if (!rateLimit.allowed) {
      return new Response("Rate limit exceeded", { status: 429 });
    }

    const body = await request.json();
    const { message, conversationId, externalUserId } = body;

    let effectiveConversationId = conversationId;
    if (!effectiveConversationId) {
      effectiveConversationId = await ctx.runMutation(internal.chat.rag.createConversationInternal, {
        projectId: project._id,
        sessionId: externalUserId || "anonymous",
      });
    }

    await ctx.runMutation(internal.chat.rag.addMessagePublicInternal, {
      conversationId: effectiveConversationId,
      role: "user",
      content: message,
    });

    return new Response(JSON.stringify({ conversationId: effectiveConversationId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin || "*",
      },
    });
  }),
});

export default http;
