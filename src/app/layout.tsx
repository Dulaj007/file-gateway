import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const THEME_OPTIONS = new Set(["light", "dark", "system"]);
const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Every page reads live branding/settings via getSettings() (siteName,
// accent color, theme default, meta tags…), which admins can edit at any
// time from the dashboard. Without this, Next prerenders pages that don't
// use a request-time API (cookies/headers) as fully static at build time,
// so a settings change would only show up after the next `next build` —
// not "on the next page load" as required. Cascades to every nested page.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.metaTitle || settings.siteName;
  const description = settings.metaDescription || settings.siteTagline || undefined;
  const images = settings.ogImageUrl ? [settings.ogImageUrl] : undefined;

  return {
    title: {
      default: title,
      template: `%s · ${settings.siteName}`,
    },
    description,
    openGraph: { title, description, siteName: settings.siteName, images },
    twitter: { card: "summary_large_image", title, description, images },
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const defaultTheme = THEME_OPTIONS.has(settings.themeDefault) ? settings.themeDefault : "system";
  const accentColor = HEX_COLOR_RE.test(settings.accentColor) ? settings.accentColor : "#6366f1";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ "--accent": accentColor } as CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
