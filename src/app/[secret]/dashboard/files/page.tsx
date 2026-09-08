import { FilesTable } from "@/components/files-table";

export default async function FilesPage({ params }: PageProps<"/[secret]/dashboard/files">) {
  const { secret } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Files</h1>
      <FilesTable secret={secret} />
    </div>
  );
}
