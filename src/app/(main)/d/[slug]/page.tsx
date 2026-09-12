import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isFileDownloadable } from "@/lib/flow";
import { getSettings } from "@/lib/settings";
import { GatewayCard } from "@/components/gateway-card";
import { FlowAction } from "@/components/flow-action";

export default async function StartPage({ params }: PageProps<"/d/[slug]">) {
  const { slug } = await params;
  const settings = await getSettings();

  // Once a middle/gateway site (e.g. upTimer) is configured, MAIN is no
  // longer part of the visible flow at all — it just forwards the visitor
  // there. A real redirect() so the address bar actually changes, not a
  // same-page rewrite. Falls back to rendering the flow here directly when
  // no middle domain is configured yet, so MAIN keeps working standalone.
  if (settings.middleDomain) {
    const protocol =
      (await headers()).get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");
    redirect(`${protocol}://${settings.middleDomain}/d/${slug}`);
  }

  const file = await db.fileItem.findUnique({ where: { publicSlug: slug } });

  if (!file || !isFileDownloadable(file)) {
    return (
      <GatewayCard>
        <p className="text-fg">This link is invalid or has expired.</p>
      </GatewayCard>
    );
  }

  return (
    <GatewayCard>
      <p className="text-sm text-muted">You&apos;re about to download</p>
      <h1 className="break-all text-lg font-semibold text-fg">{file.originalName}</h1>
      <FlowAction
        seconds={settings.timerStartSeconds}
        label="Continue"
        endpoint="/api/flow/start"
        body={{ publicSlug: slug }}
        redirectKey="nextUrl"
      />
    </GatewayCard>
  );
}
