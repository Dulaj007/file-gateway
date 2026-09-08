import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <Icon size={24} className="text-muted" aria-hidden="true" />
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-xs text-sm text-muted">{description}</p>
    </div>
  );
}
