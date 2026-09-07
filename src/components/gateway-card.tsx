import type { ReactNode } from "react";

// Shared shell for every step of the gateway flow (start / hop / final) so
// the whole journey feels visually cohesive (SDD §4.1).
export function GatewayCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        {children}
      </div>
    </div>
  );
}
