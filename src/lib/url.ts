// Next.js's Request has no built-in "what's my public origin" concept —
// self-hosted behind Caddy, x-forwarded-proto is the correct source (same
// reasoning as getClientIp in ipusage.ts: no first-party replacement since
// NextRequest.ip/geo were removed and their replacement is Vercel-only).
export function inferProtocol(request: Request): string {
  return (
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http")
  );
}
