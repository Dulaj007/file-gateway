"use client";

import { cloneElement, useEffect, useId, useState, type ReactElement } from "react";
import { useCsrfToken } from "@/components/csrf-provider";
import type { SerializedSettings } from "@/lib/settings";

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

type IdentityFields = Pick<
  SerializedSettings,
  | "siteName"
  | "siteTagline"
  | "metaTitle"
  | "metaDescription"
  | "ogImageUrl"
  | "faviconUrl"
  | "themeDefault"
  | "accentColor"
>;

type LimitsFields = Pick<
  SerializedSettings,
  | "storageCapBytes"
  | "imageMaxBytes"
  | "videoMaxBytes"
  | "zipMaxBytes"
  | "ipDailyMaxUploads"
  | "ipDailyMaxBytes"
  | "bandwidthLimitKBps"
  | "timerStartSeconds"
  | "timerArticleSeconds"
  | "timerFinalSeconds"
  | "defaultExpiry"
  | "articleHops"
>;

const label = "text-sm font-medium text-fg";
const input =
  "rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none focus-visible:border-accent";
const field = "flex flex-col gap-1.5";
const card = "rounded-2xl border border-border bg-card p-6";

// Gives every field's label a real htmlFor/id pairing (accessibility, and
// what lets tests/screen readers target inputs by label) without repeating
// useId()/id wiring at every call site.
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

export function SettingsForm({ secret }: { secret: string }) {
  const csrfToken = useCsrfToken();
  const [settings, setSettings] = useState<SerializedSettings | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchSettings() {
      const res = await fetch(`/${secret}/api/settings`);
      const json: { settings?: SerializedSettings } = await res.json().catch(() => ({}));
      if (!ignore && json.settings) setSettings(json.settings);
    }

    fetchSettings();
    return () => {
      ignore = true;
    };
  }, [secret]);

  if (!settings) {
    return <div className={card}>Loading settings…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <IdentitySection secret={secret} csrfToken={csrfToken} initial={settings} />
      <LimitsSection secret={secret} csrfToken={csrfToken} initial={settings} />
    </div>
  );
}

function SaveBar({
  dirty,
  pending,
  savedAt,
  error,
  onSave,
}: {
  dirty: boolean;
  pending: boolean;
  savedAt: number | null;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={!dirty || pending}
        onClick={onSave}
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
  );
}

function IdentitySection({
  secret,
  csrfToken,
  initial,
}: {
  secret: string;
  csrfToken: string;
  initial: SerializedSettings;
}) {
  const [form, setForm] = useState<IdentityFields>(initial);
  const [saved, setSaved] = useState<IdentityFields>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  function set<K extends keyof IdentityFields>(key: K, value: IdentityFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    const res = await fetch(`/${secret}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify(form),
    });
    const json: { error?: string } = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(json.error || "Couldn't save. Please try again.");
      return;
    }
    setSaved(form);
    setSavedAt(Date.now());
  }

  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-semibold text-fg">Site identity & appearance</h2>
      <p className="mb-6 text-sm text-muted">
        Shown on every public page — header, browser tab, and social share previews.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name">
            <input className={input} value={form.siteName} onChange={(e) => set("siteName", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <input
              className={input}
              value={form.siteTagline}
              onChange={(e) => set("siteTagline", e.target.value)}
            />
          </Field>
          <Field label="Meta title">
            <input
              className={input}
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder={form.siteName}
            />
          </Field>
          <Field label="Theme default">
            <select
              className={input}
              value={form.themeDefault}
              onChange={(e) => set("themeDefault", e.target.value as IdentityFields["themeDefault"])}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
          <Field label="Meta description" className={`${field} sm:col-span-2`}>
            <textarea
              className={`${input} min-h-20 resize-y`}
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              placeholder={form.siteTagline}
            />
          </Field>
          <Field label="OG image URL">
            <input
              className={input}
              value={form.ogImageUrl}
              onChange={(e) => set("ogImageUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Favicon URL">
            <input
              className={input}
              value={form.faviconUrl}
              onChange={(e) => set("faviconUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="flex items-end gap-2">
            <Field label="Accent color" className={`${field} flex-1`}>
              <input
                className={input}
                value={form.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
              />
            </Field>
            <input
              type="color"
              aria-label="Pick accent color"
              value={/^#[0-9a-f]{6}$/i.test(form.accentColor) ? form.accentColor : "#000000"}
              onChange={(e) => set("accentColor", e.target.value)}
              className="h-10.5 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-bg p-1"
            />
          </div>
        </div>

        <LivePreview form={form} />
      </div>

      <div className="mt-6">
        <SaveBar dirty={dirty} pending={pending} savedAt={savedAt} error={error} onSave={handleSave} />
      </div>
    </section>
  );
}

function LivePreview({ form }: { form: IdentityFields }) {
  const accent = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(form.accentColor) ? form.accentColor : "#888888";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Header preview</p>
        <div className="rounded-xl border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold tracking-tight text-fg">
              {form.siteName || "Site name"}
            </span>
            <span className="h-6 w-6 rounded-full border border-border" style={{ background: accent }} />
          </div>
          {form.siteTagline && <p className="mt-1 text-xs text-muted">{form.siteTagline}</p>}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Share card preview</p>
        <div className="overflow-hidden rounded-xl border border-border bg-bg">
          <div className="flex h-28 items-center justify-center bg-card text-xs text-muted">
            {form.ogImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.ogImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              "No OG image set"
            )}
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-medium text-fg">{form.metaTitle || form.siteName}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
              {form.metaDescription || form.siteTagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitsSection({
  secret,
  csrfToken,
  initial,
}: {
  secret: string;
  csrfToken: string;
  initial: SerializedSettings;
}) {
  const [form, setForm] = useState<LimitsFields>(initial);
  const [saved, setSaved] = useState<LimitsFields>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  function set<K extends keyof LimitsFields>(key: K, value: LimitsFields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    const res = await fetch(`/${secret}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify(form),
    });
    const json: { error?: string } = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(json.error || "Couldn't save. Please try again.");
      return;
    }
    setSaved(form);
    setSavedAt(Date.now());
  }

  return (
    <section className={card}>
      <h2 className="mb-1 text-lg font-semibold text-fg">Limits, timers & expiry</h2>
      <p className="mb-6 text-sm text-muted">
        Applied to the next upload and the next flow — no restart needed.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Storage cap (GB)">
          <input
            type="number"
            min={1}
            className={input}
            value={Math.round((form.storageCapBytes / GB) * 100) / 100}
            onChange={(e) => set("storageCapBytes", Math.round(Number(e.target.value) * GB))}
          />
        </Field>
        <Field label="Image max size (MB)">
          <input
            type="number"
            min={1}
            className={input}
            value={Math.round((form.imageMaxBytes / MB) * 100) / 100}
            onChange={(e) => set("imageMaxBytes", Math.round(Number(e.target.value) * MB))}
          />
        </Field>
        <Field label="Video max size (MB)">
          <input
            type="number"
            min={1}
            className={input}
            value={Math.round((form.videoMaxBytes / MB) * 100) / 100}
            onChange={(e) => set("videoMaxBytes", Math.round(Number(e.target.value) * MB))}
          />
        </Field>
        <Field label="Zip max size (MB)">
          <input
            type="number"
            min={1}
            className={input}
            value={Math.round((form.zipMaxBytes / MB) * 100) / 100}
            onChange={(e) => set("zipMaxBytes", Math.round(Number(e.target.value) * MB))}
          />
        </Field>
        <Field label="Max uploads per IP / day">
          <input
            type="number"
            min={1}
            className={input}
            value={form.ipDailyMaxUploads}
            onChange={(e) => set("ipDailyMaxUploads", Math.round(Number(e.target.value)))}
          />
        </Field>
        <Field label="Max bytes per IP / day (MB)">
          <input
            type="number"
            min={1}
            className={input}
            value={Math.round((form.ipDailyMaxBytes / MB) * 100) / 100}
            onChange={(e) => set("ipDailyMaxBytes", Math.round(Number(e.target.value) * MB))}
          />
        </Field>
        <Field label="Upload/download speed limit (KB/s, 0 = unlimited)">
          <input
            type="number"
            min={0}
            className={input}
            value={form.bandwidthLimitKBps}
            onChange={(e) => set("bandwidthLimitKBps", Math.max(0, Math.round(Number(e.target.value))))}
          />
        </Field>
        <Field label="Start-page timer (s)">
          <input
            type="number"
            min={0}
            className={input}
            value={form.timerStartSeconds}
            onChange={(e) => set("timerStartSeconds", Math.round(Number(e.target.value)))}
          />
        </Field>
        <Field label="Article-hop timer (s)">
          <input
            type="number"
            min={0}
            className={input}
            value={form.timerArticleSeconds}
            onChange={(e) => set("timerArticleSeconds", Math.round(Number(e.target.value)))}
          />
        </Field>
        <Field label="Final-page timer (s)">
          <input
            type="number"
            min={0}
            className={input}
            value={form.timerFinalSeconds}
            onChange={(e) => set("timerFinalSeconds", Math.round(Number(e.target.value)))}
          />
        </Field>
        <Field label="Default expiry">
          <select
            className={input}
            value={form.defaultExpiry}
            onChange={(e) => set("defaultExpiry", e.target.value as LimitsFields["defaultExpiry"])}
          >
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="never">Never</option>
          </select>
        </Field>
        <Field label="Article hops">
          <select
            className={input}
            value={form.articleHops}
            onChange={(e) => set("articleHops", Number(e.target.value) as LimitsFields["articleHops"])}
          >
            <option value={1}>1 (single article)</option>
            <option value={2}>2 (two articles)</option>
          </select>
        </Field>
      </div>

      <div className="mt-6">
        <SaveBar dirty={dirty} pending={pending} savedAt={savedAt} error={error} onSave={handleSave} />
      </div>
    </section>
  );
}
