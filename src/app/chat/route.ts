import { NextRequest, NextResponse } from "next/server";

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
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

  if (!convexSiteUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_CONVEX_SITE_URL" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  const body = await request.text();
  const response = await fetch(`${convexSiteUrl}/api/widget/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SiteLearn-Client": request.headers.get("x-sitelearn-client") || "widget/1.0",
      ...(origin ? { Origin: origin } : {}),
    },
    body,
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
