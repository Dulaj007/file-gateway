"use client";

import { cloneElement, useEffect, useId, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { useCsrfToken } from "@/components/csrf-provider";
import type { SerializedSettings } from "@/lib/settings";

type DomainFields = Pick<
  SerializedSettings,
  "mainDomain" | "article1Domain" | "article2Domain" | "displayDomain" | "adminSecretPath"
>;

const label = "text-sm font-medium text-fg";
const input =
  "rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none focus-visible:border-accent";
const field = "flex flex-col gap-1.5";
const card = "rounded-2xl border border-border bg-card p-6";

function Field({
  label: text,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div className={className ?? field}>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

export function DomainsForm({ secret }: { secret: string }) {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const [form, setForm] = useState<DomainFields | null>(null);
  const [saved, setSaved] = useState<DomainFields | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchSettings() {
      const res = await fetch(`/${secret}/api/settings`);
      const json: { settings?: SerializedSettings } = await res.json().catch(() => ({}));
      if (!ignore && json.settings) {
        setForm(json.settings);
        setSaved(json.settings);
      }
    }

    fetchSettings();
    return () => {
      ignore = true;
    };
  }, [secret]);

  if (!form || !saved) {
    return <div className={card}>Loading domains…</div>;
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const secretPathChanged = form.adminSecretPath !== saved.adminSecretPath;

  function set<K extends keyof DomainFields>(key: K, value: DomainFields[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave() {
    if (!form) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/${secret}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify(form),
    });
    const json: { error?: string; settings?: SerializedSettings } = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok || !json.settings) {
      setError(json.error || "Couldn't save. Please try again.");
      return;
    }
    setSaved(json.settings);
    setSavedAt(Date.now());

    // The secret path IS the login URL segment — the current URL 404s the
    // instant it no longer matches Setting.adminSecretPath, so follow the
    // change immediately rather than leaving the admin on a dead link.
    if (json.settings.adminSecretPath !== secret) {
      router.push(`/${json.settings.adminSecretPath}/dashboard/domains`);
      router.refresh();
    }
  }

  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-semibold text-fg">Domains</h2>
      <p className="mb-6 text-sm text-muted">
        Which host each part of the flow answers on, and the admin login path.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Main domain">
          <input
            className={input}
            value={form.mainDomain}
            onChange={(e) => set("mainDomain", e.target.value)}
            placeholder="example.com"
          />
        </Field>
        <Field label="Article 1 domain">
          <input
            className={input}
            value={form.article1Domain}
            onChange={(e) => set("article1Domain", e.target.value)}
            placeholder="blog-one.example"
          />
        </Field>
        <Field label="Article 2 domain">
          <input
            className={input}
            value={form.article2Domain}
            onChange={(e) => set("article2Domain", e.target.value)}
            placeholder="blog-two.example"
          />
        </Field>
        <Field label="Display domain (optional)">
          <input
            className={input}
            value={form.displayDomain ?? ""}
            onChange={(e) => set("displayDomain", e.target.value || null)}
            placeholder="Shown in generated links, defaults to main domain"
          />
        </Field>
        <Field label="Admin secret path" className={`${field} sm:col-span-2`}>
          <input
            className={input}
            value={form.adminSecretPath}
            onChange={(e) => set("adminSecretPath", e.target.value)}
          />
        </Field>
        {secretPathChanged && (
          <p className="-mt-2 flex items-start gap-2 text-sm text-amber-500 sm:col-span-2">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            This is your login URL. Saving will move the dashboard to
            <code className="mx-1 rounded bg-bg px-1.5 py-0.5 text-xs">/{form.adminSecretPath}/dashboard</code>
            and you&rsquo;ll be redirected there automatically.
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={handleSave}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {!dirty && savedAt && <span className="text-sm text-muted">Saved</span>}
        {error && (
          <span className="text-sm text-red-500" role="alert">
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
