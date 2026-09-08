import { Globe } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Phase 7 fills this in: MAIN/ARTICLE_1/ARTICLE_2/DISPLAY domains and the
// admin secret path, with a warning that changing the secret path changes
// the login URL.
export default function DomainsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Domains</h1>
      <EmptyState
        icon={Globe}
        title="Domain configuration coming soon"
        description="MAIN, ARTICLE_1, ARTICLE_2, DISPLAY, and the admin secret path will be editable here."
      />
    </div>
  );
}
