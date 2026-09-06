import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";
import { BrandHeader } from "@/components/brand-header";
import { SiteFooter } from "@/components/site-footer";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <BrandHeader siteName={settings.siteName} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter siteName={settings.siteName} />
    </div>
  );
}
