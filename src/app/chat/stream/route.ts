import { NextRequest } from "next/server";

function splitIntoTypingChunks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  return trimmed.match(/\S+\s*/g) ?? [trimmed];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  const baseUrl = request.nextUrl.origin;

  const body = await request.text();
  const apiKey = request.headers.get("x-api-key");
  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SiteLearn-Client": request.headers.get("x-sitelearn-client") || "widget/1.0",
      ...(origin ? { Origin: origin } : {}),
      ...(apiKey ? { "x-api-key": apiKey } : {}),
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
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const run = async () => {
        const chunks = splitIntoTypingChunks(result.content || "");

        if (chunks.length === 0) {
          const frame = JSON.stringify({ delta: "", done: true });
          controller.enqueue(encoder.encode(`data: ${frame}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        await wait(420);

        for (let i = 0; i < chunks.length; i += 1) {
          const chunk = chunks[i];
          const done = i === chunks.length - 1;
          const frame = JSON.stringify({ delta: chunk, done });
          controller.enqueue(encoder.encode(`data: ${frame}\n\n`));

          if (!done) {
            const pauseMs = /[.!?]\s*$/.test(chunk) ? 120 : /[,;:]\s*$/.test(chunk) ? 80 : 28;
            await wait(pauseMs);
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };

      void run();
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
