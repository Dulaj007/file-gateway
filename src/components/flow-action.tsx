"use client";

import { GateTimer } from "@/components/gate-timer";

export function FlowAction({
  seconds,
  label,
  endpoint,
  body,
  redirectKey,
}: {
  seconds: number;
  label: string;
  endpoint: string;
  body: Record<string, string>;
  redirectKey: "nextUrl" | "downloadUrl";
}) {
  async function onContinue() {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: Record<string, string> | null = await res.json().catch(() => null);
    const redirectTo = json?.[redirectKey];
    if (!res.ok || !redirectTo) {
      throw new Error(json?.error || "Failed to continue.");
    }
    window.location.href = redirectTo;
  }

  return <GateTimer seconds={seconds} label={label} onContinue={onContinue} />;
}
