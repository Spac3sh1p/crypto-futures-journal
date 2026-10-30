import { redirect } from "next/navigation";
import { isAuthenticated, isAuthConfigured } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/dashboard/performance");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <LoginForm configured={isAuthConfigured()} />
    </main>
  );
}
