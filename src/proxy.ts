import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";
import { siteRoleForHost } from "@/lib/site";

// Next.js 16 renamed `middleware.ts`/`export function middleware` to
// `proxy.ts`/`export function proxy` — see CLAUDE.md's framework-version
// note. Same host-based routing behavior the SDD describes for `middleware.ts`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes are shared logic, not tied to a "site" identity — the
  // browser calls them same-origin from whichever domain it's currently on
  // (MAIN, ARTICLE_1, or ARTICLE_2), so they must never be host-blocked.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
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
    return NextResponse.rewrite(rewriteUrl);
  }

  const isArticlePath = pathname.startsWith("/article/");

  if ((role === "article1" || role === "article2") && !isArticlePath) {
    return NextResponse.rewrite(new URL("/route-not-available", request.url));
  }

  if (role === "main" && isArticlePath) {
    return NextResponse.rewrite(new URL("/route-not-available", request.url));
  }

  // role === "unknown" (e.g. a misconfigured/unexpected Host) falls through
  // and is treated like MAIN — the safer default for a self-hosted deploy
  // that should only ever receive traffic Caddy was told to forward.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
