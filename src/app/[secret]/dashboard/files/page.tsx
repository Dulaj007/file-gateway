import { Files } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Phase 6 fills this in: the files table, quick-download, delete,
// disable/enable, and expiry controls.
export default function FilesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Files</h1>
      <EmptyState
        icon={Files}
        title="No files yet"
        description="Uploaded files will show up here with their status, size, and download count."
      />
    </div>
  );
}
