import { ThemeToggle } from "@/components/theme-toggle";

// Phase 0 placeholder — Phase 2 replaces this with the real upload hero
// (drop zone, result-link screen) per SDD §4.1 and Phase 2 acceptance criteria.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          Phase 0 · Scaffold
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">
          FileGateway
        </h1>
        <p className="max-w-sm text-balance text-muted">
          The upload hero, gateway flow, and admin dashboard land in the
          phases ahead. This screen only proves out the design system: theme
          tokens, typography, and the light / dark toggle.
        </p>
        <ThemeToggle />
      </div>
    </div>
  );
}
