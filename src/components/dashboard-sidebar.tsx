"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Files, Globe, LogOut, Newspaper, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCsrfToken } from "@/components/csrf-provider";

const NAV_ITEMS = [
  { href: "files", label: "Files", icon: Files },
  { href: "settings", label: "Settings", icon: Settings },
  { href: "articles", label: "Articles", icon: Newspaper },
  { href: "domains", label: "Domains", icon: Globe },
  { href: "stats", label: "Stats", icon: BarChart3 },
];

export function DashboardSidebar({ secret, siteName }: { secret: string; siteName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const csrfToken = useCsrfToken();

  async function handleLogout() {
    await fetch(`/${secret}/api/logout`, {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    router.push(`/${secret}/login`);
    router.refresh();
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border p-4">
      <div className="mb-6 px-2">
        <p className="text-sm font-semibold text-fg">{siteName}</p>
        <p className="text-xs text-muted">Admin</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(`/${secret}/dashboard/${href}`);
          return (
            <Link
              key={href}
              href={`/${secret}/dashboard/${href}`}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-card hover:text-fg"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-fg"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
