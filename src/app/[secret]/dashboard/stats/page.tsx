import { formatBytes } from "@/lib/format";
import { getStats } from "@/lib/stats";

const card = "rounded-2xl border border-border bg-card p-6";

export default async function StatsPage() {
  const stats = await getStats();
  const usedFraction =
    stats.storageCapBytes > 0 ? Math.min(1, stats.storageUsedBytes / stats.storageCapBytes) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Stats</h1>

      <section className={card}>
        <h2 className="mb-1 text-lg font-semibold text-fg">Storage</h2>
        <p className="mb-4 text-sm text-muted">
          {formatBytes(stats.storageUsedBytes)} used of {formatBytes(stats.storageCapBytes)} (
          {formatBytes(stats.storageFreeBytes)} free)
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${usedFraction * 100}%` }}
          />
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold text-fg">Files</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox label="Total" value={stats.totalFiles} />
          <StatBox label="Active" value={stats.activeFiles} />
          <StatBox label="Disabled" value={stats.disabledFiles} />
          <StatBox label="Expired" value={stats.expiredFiles} />
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
      <span className="text-2xl font-semibold text-fg">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
