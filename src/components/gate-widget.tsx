"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlowAction } from "@/components/flow-action";

type CheckState = "checking" | "hidden" | "visible";

function GateWidgetInner() {
  const token = useSearchParams().get("g");
  const [state, setState] = useState<CheckState>(token ? "checking" : "hidden");
  const [timerSeconds, setTimerSeconds] = useState(8);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch("/api/gate/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((json: { show?: boolean; timerSeconds?: number }) => {
        if (cancelled) return;
        if (json.show) {
          setTimerSeconds(json.timerSeconds ?? 8);
          setState("visible");
        } else {
          setState("hidden");
        }
      })
      .catch(() => {
        if (!cancelled) setState("hidden");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // No token, or the token didn't check out: render nothing at all. The
  // page must look like a completely ordinary post with no trace of a gate.
  if (state !== "visible" || !token) return null;

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
      <p className="mb-4 text-sm text-muted">Continue to your download</p>
      <FlowAction
        seconds={timerSeconds}
        label="Continue"
        endpoint="/api/gate/continue"
        body={{ token }}
        redirectKey="nextUrl"
      />
    </div>
  );
}

export function GateWidget() {
  // useSearchParams() requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <GateWidgetInner />
    </Suspense>
  );
}
