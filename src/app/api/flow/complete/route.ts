import { NextResponse } from "next/server";
import { z } from "zod";
import { corsPreflight, matchOrigin, withCors } from "@/lib/cors";
import { completeSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ token: z.string().min(1) });

const rateLimiter = createRateLimiter({ points: 30, duration: 60, blockDuration: 60 });

// Called cross-origin by the middle/gateway site's final page — CORS locked
// to exactly that domain, same as flow/start.
export async function OPTIONS(request: Request) {
  const settings = await getSettings();
  return corsPreflight(matchOrigin(request, settings.middleDomain || settings.mainDomain));
}

export async function POST(request: Request) {
  const settings = await getSettings();
  const allowedOrigin = matchOrigin(request, settings.middleDomain || settings.mainDomain);

  if (!(await checkRateLimit(rateLimiter, getClientIp(request)))) {
    return withCors(NextResponse.json({ error: "Too many requests." }, { status: 429 }), allowedOrigin);
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return withCors(NextResponse.json({ error: "Invalid request." }, { status: 400 }), allowedOrigin);
  }

  const result = await completeSession(inferProtocol(request), parsed.data.token);
  if (!result.ok) {
    return withCors(NextResponse.json({ error: result.reason }, { status: 403 }), allowedOrigin);
  }
  return withCors(NextResponse.json({ downloadUrl: result.downloadUrl }), allowedOrigin);
}
