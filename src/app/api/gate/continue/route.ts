import { NextResponse } from "next/server";
import { z } from "zod";
import { advanceSession } from "@/lib/flow";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ token: z.string().min(1) });

// Functionally identical to /api/flow/advance — kept as a separate route to
// match the SDD's article-site-facing API group, which can carry different
// CORS/rate-limit treatment later without needing to split it out then.
export async function POST(request: Request) {
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
