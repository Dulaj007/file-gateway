"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GateTimer({
  seconds,
  label,
  onContinue,
}: {
  seconds: number;
  label: string;
  onContinue: () => Promise<void>;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const ready = remaining <= 0;

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      await onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r={RADIUS} strokeWidth="4" className="fill-none stroke-border" />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            strokeWidth="4"
            strokeLinecap="round"
            className="fill-none stroke-accent transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (remaining / seconds)}
          />
        </svg>
        <span className="text-lg font-semibold text-fg">{ready ? "" : remaining}</span>
      </div>

      <button
        type="button"
        disabled={!ready || pending}
        onClick={handleClick}
        className="w-full rounded-xl bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="mx-auto animate-spin" size={20} aria-label="Loading" /> : label}
      </button>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
