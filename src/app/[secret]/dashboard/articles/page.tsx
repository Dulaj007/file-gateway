import { Newspaper } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Phase 7 fills this in: article CRUD per siteKey, active toggle, live
// count of active articles per site.
export default function ArticlesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Articles</h1>
      <EmptyState
        icon={Newspaper}
        title="No articles managed here yet"
        description="Create, edit, and toggle the article1/article2 gate content from this section."
      />
    </div>
  );
}
