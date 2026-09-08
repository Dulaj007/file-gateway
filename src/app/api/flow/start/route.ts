import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ publicSlug: z.string().min(1) });

const rateLimiter = createRateLimiter({ points: 20, duration: 60, blockDuration: 60 });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(rateLimiter, ip))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await startSession(inferProtocol(request), parsed.data.publicSlug, ip);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({ nextUrl: result.nextUrl });
}
