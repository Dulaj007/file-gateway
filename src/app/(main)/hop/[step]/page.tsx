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

// TEMPORARY placeholder for the "article" hops (Phase 4 replaces this with
// real themed article pages on ARTICLE_1/ARTICLE_2 plus a hidden GateWidget —
// see SDD Phase 4). The flow machinery underneath is already final.
export default async function HopPage({
  params,
  searchParams,
}: PageProps<"/hop/[step]">) {
  const { step } = await params;
  const { g: token } = await searchParams;
  const stepNumber = Number(step);

  if (typeof token !== "string" || !Number.isInteger(stepNumber)) {
    return <InvalidLink />;
  }

  const peek = await peekSession(token, stepNumber);
  if (!peek.ok) {
    return <InvalidLink />;
  }

  const settings = await getSettings();

  return (
    <GatewayCard>
      <p className="text-sm text-muted">Placeholder article hop — Phase 4 themes this</p>
      <h1 className="text-lg font-semibold text-fg">Continue to your download</h1>
      <FlowAction
        seconds={settings.timerArticleSeconds}
        label="Continue"
        endpoint="/api/flow/advance"
        body={{ token }}
        redirectKey="nextUrl"
      />
    </GatewayCard>
  );
}
