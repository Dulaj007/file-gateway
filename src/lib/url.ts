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

// The public gateway-start URL for a file: uses DISPLAY if configured, else
// MAIN directly (SDD §8's displayLink). Used both by the upload response and
// the admin files table's "copy link" action.
export function buildDisplayLink(
  request: Request,
  settings: { displayDomain: string | null; mainDomain: string },
  publicSlug: string
): string {
  const protocol = inferProtocol(request);
  const domain = settings.displayDomain || settings.mainDomain;
  return `${protocol}://${domain}/d/${publicSlug}`;
}
