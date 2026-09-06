import { UploadForm } from "@/components/upload-form";
import { getSettings } from "@/lib/settings";

export default async function Home() {
  const settings = await getSettings();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{settings.siteName}</h1>
        {settings.siteTagline && <p className="max-w-md text-muted">{settings.siteTagline}</p>}
      </div>
      <UploadForm />
    </div>
  );
}
