import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "DMCA Policy" };

export default async function DmcaPage() {
  const settings = await getSettings();

  return (
    <ProsePage title="DMCA Policy">
      <p>
        {settings.siteName} responds to notices of alleged copyright infringement that comply
        with the U.S. Digital Millennium Copyright Act (&ldquo;DMCA&rdquo;). If you believe
        content hosted on this site infringes your copyright, you may submit a takedown notice.
      </p>
      <h2>What to include</h2>
      <p>
        A valid notice should identify the copyrighted work, the material you claim is
        infringing (including the download link), your contact information, a statement of good
        faith belief that the use is unauthorized, and a statement made under penalty of perjury
        that the notice is accurate and you are authorized to act on the copyright owner&apos;s
        behalf.
      </p>
      <h2>How to submit a notice</h2>
      <p>
        Send your notice via the contact details on the <strong>Contact</strong> page. Valid
        notices are acted on promptly; the file in question will be disabled or removed.
      </p>
      <h2>Counter-notices</h2>
      <p>
        If your content was removed in error, you may submit a counter-notice through the same
        contact channel.
      </p>
    </ProsePage>
  );
}
