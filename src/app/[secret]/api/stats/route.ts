import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { getStats } from "@/lib/stats";

export async function GET(request: Request, context: RouteContext<"/[secret]/api/stats">) {
  const { secret } = await context.params;
  const guard = await requireAdminApi(secret);
  if (!guard.ok) return guard.response;

  return NextResponse.json(await getStats());
}
