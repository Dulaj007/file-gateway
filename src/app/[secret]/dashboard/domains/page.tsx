import { DomainsForm } from "@/components/domains-form";

export default async function DomainsPage({ params }: PageProps<"/[secret]/dashboard/domains">) {
  const { secret } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-fg">Domains</h1>
      <DomainsForm secret={secret} />
    </div>
  );
}
