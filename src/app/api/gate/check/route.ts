import { NextResponse } from "next/server";
import { z } from "zod";
import { corsPreflight, matchOrigin, withCors } from "@/lib/cors";
import { peekSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";

const bodySchema = z.object({ token: z.string().min(1) });

const rateLimiter = createRateLimiter({ points: 30, duration: 60, blockDuration: 60 });

// Called cross-origin by whichever article site the token is currently for
// — CORS is locked to the two configured article domains, never a wildcard.
export async function OPTIONS(request: Request) {
  const settings = await getSettings();
  return corsPreflight(matchOrigin(request, [settings.article1Domain, settings.article2Domain]));
}

// Deliberately never returns an error status — an invalid/missing token
// (or a rate-limited request) just means "don't show the gate," so the
// article looks like an ordinary post rather than announcing that
// something was checked and failed.
export async function POST(request: Request) {
  const settings = await getSettings();
  const allowedOrigin = matchOrigin(request, [settings.article1Domain, settings.article2Domain]);

  if (!(await checkRateLimit(rateLimiter, getClientIp(request)))) {
    return withCors(NextResponse.json({ show: false }), allowedOrigin);
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return withCors(NextResponse.json({ show: false }), allowedOrigin);
  }

  const peek = await peekSession(parsed.data.token);
  if (!peek.ok) {
    return withCors(NextResponse.json({ show: false }), allowedOrigin);
  }

  return withCors(
    NextResponse.json({ show: true, timerSeconds: settings.timerArticleSeconds }),
    allowedOrigin
  );
}
