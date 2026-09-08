import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Filled in alongside the storage/cleanup work: storage used/free, file
// counts, per-day upload counts (SDD §8's GET /{secret}/api/stats).
export default function StatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Stats</h1>
      <EmptyState
        icon={BarChart3}
        title="No stats yet"
        description="Storage usage, file counts, and upload activity will be summarized here."
      />
    </div>
  );
}
