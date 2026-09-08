import { NextResponse } from "next/server";
import { z } from "zod";
import { peekSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";

const bodySchema = z.object({ token: z.string().min(1) });

const rateLimiter = createRateLimiter({ points: 30, duration: 60, blockDuration: 60 });

// Deliberately never returns an error status — an invalid/missing token
// (or a rate-limited request) just means "don't show the gate," so the
// article looks like an ordinary post rather than announcing that
// something was checked and failed.
export async function POST(request: Request) {
  if (!(await checkRateLimit(rateLimiter, getClientIp(request)))) {
    return NextResponse.json({ show: false });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ show: false });
  }

  const peek = await peekSession(parsed.data.token);
  if (!peek.ok) {
    return NextResponse.json({ show: false });
  }

  const settings = await getSettings();
  return NextResponse.json({ show: true, timerSeconds: settings.timerArticleSeconds });
}
