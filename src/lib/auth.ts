import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { randomSlug } from "@/lib/slug";

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
