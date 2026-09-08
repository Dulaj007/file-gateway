import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { CsrfProvider } from "@/components/csrf-provider";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[secret]/dashboard">) {
  const { secret } = await params;
  const session = await getSession();

  if (!session.isAdmin || !session.csrfToken) {
    redirect(`/${secret}/login`);
  }

  const settings = await getSettings();

  return (
    <CsrfProvider token={session.csrfToken}>
      <div className="flex min-h-full flex-1">
        <DashboardSidebar secret={secret} siteName={settings.siteName} />
        <main className="flex-1 overflow-x-auto p-8">{children}</main>
      </div>
    </CsrfProvider>
  );
}
