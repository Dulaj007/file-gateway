import { NextResponse } from "next/server";
import { z } from "zod";
import { corsPreflight, matchOrigin, withCors } from "@/lib/cors";
import { advanceSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ token: z.string().min(1) });

const rateLimiter = createRateLimiter({ points: 30, duration: 60, blockDuration: 60 });

// Called cross-origin by whichever article site the token is currently for
// — CORS locked to the two configured article domains, same as gate/check.
export async function OPTIONS(request: Request) {
  const settings = await getSettings();
  return corsPreflight(matchOrigin(request, [settings.article1Domain, settings.article2Domain]));
}

// Functionally identical to /api/flow/advance — kept as a separate route to
// match the SDD's article-site-facing API group, which can carry different
// CORS/rate-limit treatment later without needing to split it out then.
export async function POST(request: Request) {
  const settings = await getSettings();
  const allowedOrigin = matchOrigin(request, [settings.article1Domain, settings.article2Domain]);

  if (!(await checkRateLimit(rateLimiter, getClientIp(request)))) {
    return withCors(NextResponse.json({ error: "Too many requests." }, { status: 429 }), allowedOrigin);
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return withCors(NextResponse.json({ error: "Invalid request." }, { status: 400 }), allowedOrigin);
  }

  const result = await advanceSession(inferProtocol(request), parsed.data.token);
  if (!result.ok) {
    return withCors(NextResponse.json({ error: result.reason }, { status: 403 }), allowedOrigin);
  }
  return withCors(NextResponse.json({ nextUrl: result.nextUrl }), allowedOrigin);
}
