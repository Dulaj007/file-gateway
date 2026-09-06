import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function BrandHeader({ siteName }: { siteName: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-fg">
          {siteName}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
