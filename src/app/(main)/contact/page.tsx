import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <ProsePage title="Contact">
      <p>
        For DMCA notices, privacy questions, or anything else related to {settings.siteName},
        reach out at:
      </p>
      <p>
        <strong>contact@{settings.mainDomain || "example.com"}</strong>
      </p>
      <p>We aim to respond to valid requests within a few business days.</p>
    </ProsePage>
  );
}
