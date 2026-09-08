import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { GatewayCard } from "@/components/gateway-card";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ params }: PageProps<"/[secret]/login">) {
  const { secret } = await params;
  const session = await getSession();

  if (session.isAdmin) {
    redirect(`/${secret}/dashboard`);
  }

  return (
    <GatewayCard>
      <h1 className="text-lg font-semibold text-fg">Sign in</h1>
      <LoginForm secret={secret} />
    </GatewayCard>
  );
}
