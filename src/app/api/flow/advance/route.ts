import { NextResponse } from "next/server";
import { z } from "zod";
import { advanceSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ token: z.string().min(1) });

const rateLimiter = createRateLimiter({ points: 30, duration: 60, blockDuration: 60 });

export async function POST(request: Request) {
  if (!(await checkRateLimit(rateLimiter, getClientIp(request)))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await advanceSession(inferProtocol(request), parsed.data.token);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({ nextUrl: result.nextUrl });
}
