import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <ProsePage title="Terms of Service">
      <p>
        By uploading to or downloading from {settings.siteName}, you agree to the following
        terms.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Don&apos;t upload content you don&apos;t have the right to share, or content that is
        illegal, abusive, or infringes on someone else&apos;s rights. Uploads that violate this
        may be removed without notice.
      </p>
      <h2>No guarantees</h2>
      <p>
        Files are hosted on a best-effort basis. Availability, download speed, and retention
        beyond the stated expiry are not guaranteed.
      </p>
      <h2>Limits</h2>
      <p>
        Uploads are subject to file size, type, and per-IP limits, which may change at any time.
      </p>
      <h2>Changes</h2>
      <p>These terms may be updated at any time; continued use constitutes acceptance.</p>
    </ProsePage>
  );
}
