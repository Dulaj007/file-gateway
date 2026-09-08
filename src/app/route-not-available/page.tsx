import { notFound } from "next/navigation";

// proxy.ts rewrites here for any path that doesn't belong on the current
// domain (e.g. /article/* requested on MAIN, or anything else requested on
// an article domain) so it renders the app's own styled not-found page
// instead of a route that doesn't otherwise exist.
export default function RouteNotAvailable() {
  notFound();
}
