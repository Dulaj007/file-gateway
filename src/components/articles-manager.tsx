"use client";

import { cloneElement, useEffect, useId, useState, type ReactElement } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCsrfToken } from "@/components/csrf-provider";
import { slugify } from "@/lib/slug";
import type { ArticleSiteKey } from "@/lib/articles";

type Article = {
  id: string;
  siteKey: string;
  slug: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const SITES: { key: ArticleSiteKey; label: string }[] = [
  { key: "article1", label: "Article site 1" },
  { key: "article2", label: "Article site 2" },
];

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

export function ArticlesManager({ secret }: { secret: string }) {
  const csrfToken = useCsrfToken();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  // "new:<siteKey>" to create, an article id to edit, or null to show nothing.
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchArticles() {
      setLoading(true);
      const res = await fetch(`/${secret}/api/articles`);
      const json: { articles?: Article[] } = await res.json().catch(() => ({}));
      if (!ignore) {
        setArticles(json.articles ?? []);
        setLoading(false);
      }
    }

    fetchArticles();
    return () => {
      ignore = true;
    };
  }, [secret, refreshKey]);

  async function handleDelete(article: Article) {
    if (!window.confirm(`Delete "${article.title}"? This can't be undone.`)) return;
    const res = await fetch(`/${secret}/api/articles/${article.id}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken },
    });
    if (res.ok) setRefreshKey((k) => k + 1);
  }

  async function handleToggleActive(article: Article) {
    const res = await fetch(`/${secret}/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ active: !article.active }),
    });
    if (res.ok) setRefreshKey((k) => k + 1);
  }

  function handleSaved() {
    setEditing(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {SITES.map((site) => {
        const siteArticles = articles.filter((a) => a.siteKey === site.key);
        const activeCount = siteArticles.filter((a) => a.active).length;
        const isCreatingHere = editing === `new:${site.key}`;

        return (
          <section key={site.key} className={card}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-fg">{site.label}</h2>
                <p className="text-sm text-muted">
                  {activeCount} active of {siteArticles.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(isCreatingHere ? null : `new:${site.key}`)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-bg"
              >
                <Plus size={14} />
                New article
              </button>
            </div>

            {isCreatingHere && (
              <div className="mb-4">
                <ArticleForm
                  secret={secret}
                  csrfToken={csrfToken}
                  siteKey={site.key}
                  onSaved={handleSaved}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}

            {!loading && siteArticles.length === 0 && !isCreatingHere && (
              <p className="text-sm text-muted">No articles yet.</p>
            )}

            <div className="flex flex-col divide-y divide-border">
              {siteArticles.map((article) =>
                editing === article.id ? (
                  <div key={article.id} className="py-4">
                    <ArticleForm
                      secret={secret}
                      csrfToken={csrfToken}
                      siteKey={site.key}
                      article={article}
                      onSaved={handleSaved}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                ) : (
                  <div key={article.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{article.title}</p>
                      <p className="truncate text-xs text-muted">/{article.slug}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(article)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          article.active
                            ? "bg-accent text-accent-foreground"
                            : "border border-border text-muted"
                        }`}
                      >
                        {article.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(article.id)}
                        title="Edit"
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(article)}
                        title="Delete"
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-bg hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ArticleForm({
  secret,
  csrfToken,
  siteKey,
  article,
  onSaved,
  onCancel,
}: {
  secret: string;
  csrfToken: string;
  siteKey: ArticleSiteKey;
  article?: Article;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [body, setBody] = useState(article?.body ?? "");
  const [active, setActive] = useState(article?.active ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const url = article ? `/${secret}/api/articles/${article.id}` : `/${secret}/api/articles`;
    const method = article ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ siteKey, slug, title, body, active }),
    });
    const json: { error?: string } = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      setError(json.error || "Couldn't save. Please try again.");
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input className={input} required value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </Field>
        <Field label="Slug">
          <input
            className={input}
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </Field>
      </div>

      <Field label="Body (markdown)">
        <textarea
          className={`${input} min-h-40 resize-y font-mono text-xs`}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (eligible to be shown in the flow)
      </label>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : article ? "Save changes" : "Create article"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
