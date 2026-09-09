import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";
import { siteRoleForHost } from "@/lib/site";

// A fresh nonce per request lets script-src stay strict (no 'unsafe-inline')
// while still allowing Next's own framework/page scripts and next-themes'
// inline no-flash script — both read this automatically once it's threaded
// through (see withSecurityHeaders below, and ThemeProvider's `nonce` prop
// in layout.tsx). 'strict-dynamic' is Next's own documented recommendation
// for this pattern: browsers that support it then trust any script the
// nonce'd scripts themselves load (e.g. Next's route-chunk loading).
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' https: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

// style-src keeps 'unsafe-inline': this app sets a handful of dynamic inline
// `style` attributes (accent-color swatches, progress bars) rather than
// `<style>` tags — CSP nonces only cover the latter, so there's no nonce
// equivalent for inline style *attributes* without much heavier machinery.
// img-src allows any https:/data: source since ogImageUrl/faviconUrl are
// admin-configured external URLs (Setting row), not public user input.
function withSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

// Next.js 16 renamed `middleware.ts`/`export function middleware` to
// `proxy.ts`/`export function proxy`. Same host-based routing behavior the
// SDD describes for `middleware.ts`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const nextInit = { request: { headers: requestHeaders } };

  // API routes are shared logic, not tied to a "site" identity — the
  // browser calls them same-origin from whichever domain it's currently on
  // (MAIN, ARTICLE_1, or ARTICLE_2), so they must never be host-blocked.
  if (pathname.startsWith("/api/")) {
    return withSecurityHeaders(NextResponse.next(nextInit), nonce);
  }

  const host = request.headers.get("host") ?? "";
  const settings = await getSettings();
  const role = siteRoleForHost(host, settings);

  if (role === "display") {
    // NextResponse.redirect() (and even a raw Response with a Location
    // header) gets its Location silently relativized by Next's own proxy
    // response handling when the target shares an apex with the request
    // host (confirmed open upstream bug: vercel/next.js#75173/#44482) —
    // display.*/main.* share "localhost:3000" here, and would share the
    // real apex domain in most production setups too. Routing through an
    // actual page's redirect() (next/navigation) sidesteps it, since that
    // goes through Next's normal render pipeline instead of the proxy's.
    const rewriteUrl = new URL("/display-redirect", request.url);
    rewriteUrl.searchParams.set("path", pathname);
    return withSecurityHeaders(NextResponse.rewrite(rewriteUrl, nextInit), nonce);
  }

  const isArticlePath = pathname.startsWith("/article/");

  if ((role === "article1" || role === "article2") && !isArticlePath) {
    return withSecurityHeaders(
      NextResponse.rewrite(new URL("/route-not-available", request.url), nextInit),
      nonce
    );
  }

  if (role === "main" && isArticlePath) {
    return withSecurityHeaders(
      NextResponse.rewrite(new URL("/route-not-available", request.url), nextInit),
      nonce
    );
  }

  // role === "unknown" (e.g. a misconfigured/unexpected Host) falls through
  // and is treated like MAIN — the safer default for a self-hosted deploy
  // that should only ever receive traffic Caddy was told to forward.
  return withSecurityHeaders(NextResponse.next(nextInit), nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
