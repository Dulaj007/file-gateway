import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";

// Every route under /[secret]/* (login + the whole dashboard) is mounted at
// settings.adminSecretPath. Checked once here so /login and /dashboard/*
// don't each need their own copy — anything else 404s, same as a route that
// genuinely doesn't exist (SDD Phase 5 acceptance: "wrong secret path -> 404").
export default async function SecretLayout({
  children,
  params,
}: LayoutProps<"/[secret]">) {
  const { secret } = await params;
  const settings = await getSettings();

  if (secret !== settings.adminSecretPath) {
    notFound();
  }

  return children;
}
