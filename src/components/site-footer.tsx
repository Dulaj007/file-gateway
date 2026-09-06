import Link from "next/link";

const LINKS = [
  { href: "/dmca", label: "DMCA" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} {siteName}
        </span>
        <nav className="flex gap-4">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
