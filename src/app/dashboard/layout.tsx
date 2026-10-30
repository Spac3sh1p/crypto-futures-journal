import { TradeNavigationGuard } from "@/components/dashboard/TradeNavigationGuard";
import { Suspense } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { getExchanges } from "@/lib/dashboard/queries";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 统一门禁：所有 /dashboard/* 页面先过会话校验，未登录跳转登录页。
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const exchanges = await getExchanges();

  return (
    <TradeNavigationGuard>
    <div className="flex h-full bg-bg-primary">
      <Suspense>
        <Sidebar exchanges={exchanges} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense>
          <TopBar />
        </Suspense>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5">
          <div className="mx-auto w-full max-w-[1640px]">{children}</div>
        </main>
      </div>
    </div>
    </TradeNavigationGuard>
  );
}
