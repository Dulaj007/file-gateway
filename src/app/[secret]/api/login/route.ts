import argon2 from "argon2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/ipusage";
import { checkRateLimit, createRateLimiter } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// A syntactically valid argon2 hash that no real password will ever match —
// verified against on every failed lookup so a nonexistent username takes
// the same argon2 work (and therefore the same time) as a wrong password for
// a real one. Without this, response timing alone reveals whether
// ADMIN_USERNAME's value is correct.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$kSoeGpcprgRkMHVClcXuVg$Lhma/Q2gWhnpFQ6fV10C8UsFxquUTULqgXlj8FZrnlw";

const loginRateLimiter = createRateLimiter({
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

const GENERIC_ERROR = "Invalid username or password.";

export async function POST(request: Request, context: RouteContext<"/[secret]/api/login">) {
  const { secret } = await context.params;
  const settings = await getSettings();
  if (secret !== settings.adminSecretPath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(loginRateLimiter, ip))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { username: parsed.data.username } });
  const validPassword = await argon2
    .verify(admin?.passwordHash ?? DUMMY_HASH, parsed.data.password)
    .catch(() => false);

  if (!admin || !validPassword) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const session = await createAdminSession(admin.username);
  return NextResponse.json({ ok: true, csrfToken: session.csrfToken });
}
