"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ secret }: { secret: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/${secret}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setPending(false);
        return;
      }

      router.push(`/${secret}/dashboard`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="username" className="text-sm font-medium text-fg">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none focus-visible:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor="password" className="text-sm font-medium text-fg">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none focus-visible:border-accent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
