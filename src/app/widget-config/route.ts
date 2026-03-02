import { NextRequest, NextResponse } from "next/server";

function corsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

  if (!convexSiteUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CONVEX_SITE_URL" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  const botId = request.nextUrl.searchParams.get("botId");
  if (!botId) {
    return NextResponse.json({ error: "botId is required" }, { status: 400, headers: corsHeaders(origin) });
  }

  const response = await fetch(`${convexSiteUrl}/api/widget/config?botId=${encodeURIComponent(botId)}`, {
    method: "GET",
    headers: {
      ...(origin ? { Origin: origin } : {}),
    },
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}
