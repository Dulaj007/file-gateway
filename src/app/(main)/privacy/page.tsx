import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <ProsePage title="Privacy Policy">
      <p>
        This policy explains what {settings.siteName} collects when you upload or download a
        file, and why.
      </p>
      <h2>What we collect</h2>
      <p>
        When you upload a file, we store the file itself, its size and type, the upload time,
        and the IP address of the uploader. The IP address is used only for abuse prevention
        (per-IP rate and size limits) and is not shared with third parties.
      </p>
      <h2>How long files are kept</h2>
      <p>
        Files are kept until their configured expiry, or until removed by the site owner,
        whichever comes first.
      </p>
      <h2>Cookies</h2>
      <p>
        We use a single cookie to remember your light/dark theme preference. No tracking or
        advertising cookies are used.
      </p>
      <h2>Contact</h2>
      <p>Questions about this policy can be sent via the Contact page.</p>
    </ProsePage>
  );
}
