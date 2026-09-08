"use client";

import { useRef, useState } from "react";
import { Check, Copy, UploadCloud } from "lucide-react";

type UploadResult = { displayLink: string; expiresAt: string | null };
type State = "idle" | "uploading" | "done" | "error";

export function UploadForm() {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function upload(file: File) {
    setState("uploading");
    setProgress(0);
    setError(null);

    const formData = new FormData();
    // Honeypot: real visitors never see or fill this field (see the CSS
    // below — off-screen, not display:none/hidden, since some bots
    // specifically skip those to avoid detection). A filled value means
    // whatever submitted this wasn't a human using the page as designed.
    formData.append("website", honeypotRef.current?.value ?? "");
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let body: { displayLink?: string; expiresAt?: string | null; error?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.displayLink) {
        setResult({ displayLink: body.displayLink, expiresAt: body.expiresAt ?? null });
        setState("done");
      } else {
        setError(body?.error || "Upload failed.");
        setState("error");
      }
    };

    xhr.onerror = () => {
      setError("Upload failed. Check your connection and try again.");
      setState("error");
    };

    xhr.onabort = () => setState("idle");

    xhr.send(formData);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) upload(file);
  }

  function cancelUpload() {
    xhrRef.current?.abort();
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.displayLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setState("idle");
    setResult(null);
    setError(null);
    setProgress(0);
  }

  if (state === "done" && result) {
    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted">
          Your link is ready — copy it now, it won&apos;t be shown again.
        </p>
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3">
          <code className="flex-1 truncate text-left text-sm text-fg">{result.displayLink}</code>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link"
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-accent-foreground transition-opacity hover:opacity-90"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        {result.expiresAt && (
          <p className="text-xs text-muted">
            Expires {new Date(result.expiresAt).toLocaleString()}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Upload another file
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => state !== "uploading" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Choose a file to upload"
        className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          state === "uploading" ? "cursor-default" : "cursor-pointer"
        } ${dragActive ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/50"}`}
      >
        <UploadCloud size={32} className="text-muted" aria-hidden="true" />
        <p className="text-fg">
          <span className="font-medium text-accent">Choose a file</span> or drag it here
        </p>
        <p className="text-xs text-muted">Image, video, or zip</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,application/zip"
          className="hidden"
          disabled={state === "uploading"}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
      </div>

      {state === "uploading" && (
        <div className="w-full space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Uploading… {progress}%</span>
            <button type="button" onClick={cancelUpload} className="hover:text-fg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {state === "error" && error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
