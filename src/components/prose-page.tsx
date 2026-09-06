import type { ReactNode } from "react";

export function ProsePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-fg [&_strong]:text-fg">
        {children}
      </div>
    </div>
  );
}
