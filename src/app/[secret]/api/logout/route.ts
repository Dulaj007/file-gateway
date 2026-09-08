import { NextResponse } from "next/server";
import { getSession, verifyCsrf } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request, context: RouteContext<"/[secret]/api/logout">) {
  const { secret } = await context.params;
  const settings = await getSettings();
  if (secret !== settings.adminSecretPath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const session = await getSession();
  if (session.isAdmin && !verifyCsrf(session, request.headers.get("x-csrf-token"))) {
    return NextResponse.json({ error: "Invalid CSRF token." }, { status: 403 });
  }

  session.destroy();
  return NextResponse.json({ ok: true });
}
