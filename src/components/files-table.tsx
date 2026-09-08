"use client";

import { useEffect, useState } from "react";
import { Ban, Check, Copy, Download, Play, Trash2 } from "lucide-react";
import { computeExpiresAt } from "@/lib/expiry";
import { formatBytes } from "@/lib/format";
import { useCsrfToken } from "@/components/csrf-provider";
import type { SerializedFile } from "@/lib/files";

type FileRowData = SerializedFile & { displayLink: string };

const CATEGORY_OPTIONS = ["image", "video", "zip"] as const;
const STATUS_OPTIONS = ["active", "disabled", "expired"] as const;
const EXPIRY_PRESETS = [
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "never", label: "Never" },
  { value: "custom", label: "Custom…" },
];

function fileStatus(file: FileRowData): { label: string; className: string } {
  if (file.expiresAt && new Date(file.expiresAt).getTime() < Date.now()) {
    return { label: "Expired", className: "text-red-500" };
  }
  if (!file.downloadEnabled) {
    return { label: "Disabled", className: "text-muted" };
  }
  return { label: "Active", className: "text-accent" };
}

export function FilesTable({ secret }: { secret: string }) {
  const csrfToken = useCsrfToken();
  const [files, setFiles] = useState<FileRowData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Bumped after a mutation to trigger a refetch, since nothing about
  // query/category/status/page necessarily changes when a file is deleted,
  // disabled, etc.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Race-condition guard: if the user changes filters again before this
    // request lands, its (now-stale) result must not overwrite the newer one.
    let ignore = false;

    async function fetchFiles() {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (query) params.set("query", query);
      if (category) params.set("category", category);
      if (status) params.set("status", status);

      const res = await fetch(`/${secret}/api/files?${params}`);
      const json: { files?: FileRowData[]; total?: number; pageSize?: number } = await res
        .json()
        .catch(() => ({}));

      if (!ignore) {
        setFiles(json.files ?? []);
        setTotal(json.total ?? 0);
        setPageSize(json.pageSize ?? 20);
        setLoading(false);
      }
    }

    fetchFiles();
    return () => {
      ignore = true;
    };
  }, [secret, page, query, category, status, refreshKey]);

  // Changing a filter resets to page 1 as part of the same state update
  // that changes it, rather than a separate effect reacting to the change
  // afterward — simpler, and avoids a spurious extra render.
  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }
  function updateCategory(value: string) {
    setCategory(value);
    setPage(1);
  }
  function updateStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  async function mutateFile(id: string, suffix: string, method: string, body?: unknown) {
    const res = await fetch(`/${secret}/api/files/${id}${suffix}`, {
      method,
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.ok) setRefreshKey((k) => k + 1);
    return res.ok;
  }

  async function handleToggle(file: FileRowData) {
    await mutateFile(file.id, file.downloadEnabled ? "/disable" : "/enable", "POST");
  }

  async function handleDelete(file: FileRowData) {
    if (!window.confirm(`Delete "${file.originalName}"? This can't be undone.`)) return;
    await mutateFile(file.id, "", "DELETE");
  }

  async function handleExpiryPreset(file: FileRowData, preset: string) {
    // computeExpiresAt only returns null for "never", already handled above.
    const expiresAt = preset === "never" ? null : computeExpiresAt(preset)!.toISOString();
    await mutateFile(file.id, "", "PATCH", { expiresAt });
  }

  async function handleCustomExpiry(file: FileRowData, dateValue: string) {
    if (!dateValue) return;
    await mutateFile(file.id, "", "PATCH", { expiresAt: new Date(dateValue).toISOString() });
  }

  async function handleCopy(file: FileRowData) {
    await navigator.clipboard.writeText(file.displayLink);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId((current) => (current === file.id ? null : current)), 2000);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-fg outline-none focus-visible:border-accent"
        />
        <select
          value={category}
          onChange={(e) => updateCategory(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-fg outline-none"
        >
          <option value="">All types</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => updateStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-fg outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Downloads</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                secret={secret}
                copied={copiedId === file.id}
                onCopy={() => handleCopy(file)}
                onToggle={() => handleToggle(file)}
                onDelete={() => handleDelete(file)}
                onExpiryPreset={(preset) => handleExpiryPreset(file, preset)}
                onCustomExpiry={(date) => handleCustomExpiry(file, date)}
              />
            ))}
          </tbody>
        </table>

        {!loading && files.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">No files match these filters.</div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {total} file{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function FileRow({
  file,
  secret,
  copied,
  onCopy,
  onToggle,
  onDelete,
  onExpiryPreset,
  onCustomExpiry,
}: {
  file: FileRowData;
  secret: string;
  copied: boolean;
  onCopy: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onExpiryPreset: (preset: string) => void;
  onCustomExpiry: (date: string) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const status = fileStatus(file);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="max-w-[220px] truncate px-4 py-3 text-fg" title={file.originalName}>
        {file.originalName}
      </td>
      <td className="px-4 py-3 text-muted">{file.category}</td>
      <td className="px-4 py-3 text-muted">{formatBytes(file.sizeBytes)}</td>
      <td className="px-4 py-3 text-muted">{new Date(file.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-muted">{file.downloadCount}</td>
      <td className="px-4 py-3">
        {showCustom ? (
          <input
            type="date"
            autoFocus
            onBlur={() => setShowCustom(false)}
            onChange={(e) => {
              onCustomExpiry(e.target.value);
              setShowCustom(false);
            }}
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-fg"
          />
        ) : (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value === "custom") setShowCustom(true);
              else onExpiryPreset(e.target.value);
            }}
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted"
          >
            <option value="" disabled>
              {file.expiresAt ? new Date(file.expiresAt).toLocaleDateString() : "Never"}
            </option>
            {EXPIRY_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className={`px-4 py-3 text-xs font-medium ${status.className}`}>{status.label}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onCopy}
            title="Copy link"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <a
            href={`/${secret}/api/files/${file.id}/download`}
            title="Quick download"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg"
          >
            <Download size={14} />
          </a>
          <button
            type="button"
            onClick={onToggle}
            title={file.downloadEnabled ? "Stop download" : "Resume download"}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg"
          >
            {file.downloadEnabled ? <Ban size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-bg hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
