import { NextRequest } from "next/server";

function corsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-SiteLearn-Client, x-api-key",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const baseUrl = request.nextUrl.origin;

  const body = await request.text();
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SiteLearn-Client": request.headers.get("x-sitelearn-client") || "widget/1.0",
    },
    body,
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    return new Response(errorPayload, {
      status: response.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
      },
    });
  }

  const result = (await response.json()) as {
    content?: string;
    citations?: Array<{ url: string; title?: string; snippet: string }>;
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const frame = JSON.stringify({
        delta: result.content || "",
        citations: result.citations || [],
        done: true,
      });

      controller.enqueue(encoder.encode(`data: ${frame}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
