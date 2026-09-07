import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession } from "@/lib/flow";
import { getClientIp } from "@/lib/ipusage";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ publicSlug: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await startSession(
    inferProtocol(request),
    parsed.data.publicSlug,
    getClientIp(request)
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({ nextUrl: result.nextUrl });
}
