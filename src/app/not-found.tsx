import Link from "next/link";
import { GatewayCard } from "@/components/gateway-card";

export default function NotFound() {
  return (
    <GatewayCard>
      <p className="text-lg font-semibold text-fg">Page not found</p>
      <p className="text-sm text-muted">
        This page doesn&apos;t exist, or isn&apos;t available on this site.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Go home
      </Link>
    </GatewayCard>
  );
}
