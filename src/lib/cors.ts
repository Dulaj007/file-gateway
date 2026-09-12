import { NextResponse } from "next/server";

// Strict single-origin CORS for the handful of API routes that must accept
// cross-origin requests from one of our own standalone sites (e.g. the
// middle/gateway site calling flow/start, or an article site calling
// gate/check) — deliberately never open to arbitrary origins ("*"), per the
// SDD's "CORS locked to article domains" requirement. Returns the exact
// origin to echo back (required for a non-wildcard Access-Control-Allow-Origin)
// or null if the request's Origin doesn't match the configured domain.
export function matchOrigin(request: Request, allowedDomain: string): string | null {
  if (!allowedDomain) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    return new URL(origin).host === allowedDomain ? origin : null;
  } catch {
    return null;
  }
}

export function withCors(response: NextResponse, allowedOrigin: string | null): NextResponse {
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

// Handles the preflight OPTIONS request a browser sends before a
// cross-origin POST with a JSON body (not a CORS "simple request").
export function corsPreflight(allowedOrigin: string | null): NextResponse {
  const response = new NextResponse(null, { status: allowedOrigin ? 204 : 403 });
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Vary", "Origin");
  }
  return response;
}
