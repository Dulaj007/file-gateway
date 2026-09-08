import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage({ params }: PageProps<"/[secret]/dashboard/settings">) {
  const { secret } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Settings</h1>
      <SettingsForm secret={secret} />
    </div>
  );
}
