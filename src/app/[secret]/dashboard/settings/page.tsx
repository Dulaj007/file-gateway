import { Settings } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Phase 7 fills this in: site identity & appearance, limits, timers, and
// default expiry, all writing to the Setting row.
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Settings</h1>
      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Branding, upload limits, timers, and expiry defaults will be editable here."
      />
    </div>
  );
}
