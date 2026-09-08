import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";

// proxy.ts rewrites DISPLAY-domain requests here rather than redirecting
// directly from the proxy — see the comment there for why.
export default async function DisplayRedirectPage({
  searchParams,
}: PageProps<"/display-redirect">) {
  const { path } = await searchParams;
  const settings = await getSettings();
  const protocol =
    (await headers()).get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  const target = typeof path === "string" ? path : "/";
  redirect(`${protocol}://${settings.mainDomain}/d${target}`);
}
