import { NextRequest, NextResponse } from "next/server";

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-SiteLearn-Client",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      handoffId: `handoff_${Date.now()}`,
      message: "A human agent is not available yet. Please leave your details and we will contact you.",
    },
    {
      status: 200,
      headers: corsHeaders(request.headers.get("origin")),
    }
  );
}
