import { NextResponse } from "next/server";
import { z } from "zod";
import { completeSession } from "@/lib/flow";
import { inferProtocol } from "@/lib/url";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await completeSession(inferProtocol(request), parsed.data.token);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({ downloadUrl: result.downloadUrl });
}
