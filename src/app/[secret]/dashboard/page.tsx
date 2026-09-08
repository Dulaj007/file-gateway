import { redirect } from "next/navigation";

export default async function DashboardIndex({ params }: PageProps<"/[secret]/dashboard">) {
  const { secret } = await params;
  redirect(`/${secret}/dashboard/files`);
}
