import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { NextResponse } from "next/server";
import { randomSlug } from "@/lib/slug";
import { getSettings } from "@/lib/settings";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export type AdminSessionData = {
  isAdmin: boolean;
  username: string;
  csrfToken: string;
};

const sessionOptions: SessionOptions = {
  cookieName: "fg_admin_session",
  password: requireEnv("SESSION_SECRET"),
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

// Works from both Server Components (read-only — never call save()/destroy()
// there, Next disallows writing cookies outside Route Handlers/Server
// Actions) and Route Handlers (where save()/destroy() are fine).
export async function getSession(): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(await cookies(), sessionOptions);
}

export async function createAdminSession(username: string): Promise<IronSession<AdminSessionData>> {
  const session = await getSession();
  session.isAdmin = true;
  session.username = username;
  session.csrfToken = randomSlug(24);
  await session.save();
  return session;
}

// Double-submit-style CSRF check for admin mutations: the token minted at
// login and stored server-side in the session must match what the client
// sends back in a header. A forged cross-site request can ride the session
// cookie automatically, but it cannot know this value.
export function verifyCsrf(session: IronSession<AdminSessionData>, headerToken: string | null): boolean {
  return Boolean(session.csrfToken) && headerToken === session.csrfToken;
}

export type AdminApiGuard =
  | { ok: true; session: IronSession<AdminSessionData> }
  | { ok: false; response: NextResponse };

// Shared boilerplate for every /[secret]/api/* route: wrong secret path
// looks exactly like a route that doesn't exist (404, not 403 — this must
// not confirm to a prober that a secret path is merely wrong-but-close),
// unauthenticated requests get a plain 401 (there's no sensible "redirect to
// login" for an API route), and `requireCsrf` additionally checks the
// double-submit token for mutating requests (see verifyCsrf above).
export async function requireAdminApi(
  secret: string,
  request?: Request,
  requireCsrf = false
): Promise<AdminApiGuard> {
  const settings = await getSettings();
  if (secret !== settings.adminSecretPath) {
    return { ok: false, response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  }

  const session = await getSession();
  if (!session.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (requireCsrf && !verifyCsrf(session, request?.headers.get("x-csrf-token") ?? null)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid CSRF token." }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
