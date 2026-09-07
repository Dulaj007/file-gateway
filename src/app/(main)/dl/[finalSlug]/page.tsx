import { db } from "@/lib/db";
import { peekSession } from "@/lib/flow";
import { getSettings } from "@/lib/settings";
import { GatewayCard } from "@/components/gateway-card";
import { FlowAction } from "@/components/flow-action";

function InvalidLink() {
  return (
    <GatewayCard>
      <p className="text-fg">This link is invalid or has expired.</p>
    </GatewayCard>
  );
}

export default async function FinalPage({
  params,
  searchParams,
}: PageProps<"/dl/[finalSlug]">) {
  const { finalSlug } = await params;
  const { g: token } = await searchParams;

  if (typeof token !== "string") {
    return <InvalidLink />;
  }

  const settings = await getSettings();
  const totalSteps = 2 + settings.articleHops;

  const file = await db.fileItem.findUnique({ where: { finalSlug } });
  const peek = await peekSession(token, totalSteps);

  if (!file || !peek.ok || peek.session.fileId !== file.id) {
    return <InvalidLink />;
  }

  return (
    <GatewayCard>
      <p className="text-sm text-muted">Your file is ready</p>
      <h1 className="break-all text-lg font-semibold text-fg">{file.originalName}</h1>
      <FlowAction
        seconds={settings.timerFinalSeconds}
        label="Download"
        endpoint="/api/flow/complete"
        body={{ token }}
        redirectKey="downloadUrl"
      />
    </GatewayCard>
  );
}
