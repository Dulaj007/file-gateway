import { db } from "@/lib/db";
import { isFileDownloadable } from "@/lib/flow";
import { getSettings } from "@/lib/settings";
import { GatewayCard } from "@/components/gateway-card";
import { FlowAction } from "@/components/flow-action";

export default async function StartPage({ params }: PageProps<"/d/[slug]">) {
  const { slug } = await params;
  const file = await db.fileItem.findUnique({ where: { publicSlug: slug } });

  if (!file || !isFileDownloadable(file)) {
    return (
      <GatewayCard>
        <p className="text-fg">This link is invalid or has expired.</p>
      </GatewayCard>
    );
  }

  const settings = await getSettings();

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
