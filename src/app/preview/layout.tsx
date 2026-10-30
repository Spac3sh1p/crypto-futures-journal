import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TradeNavigationGuard } from "@/components/dashboard/TradeNavigationGuard";
import { SidebarV2 } from "@/components/v2/shell/SidebarV2";
import { TopBarV2 } from "@/components/v2/shell/TopBarV2";
import { getExchanges } from "@/lib/dashboard/queries";
import { isAuthenticated } from "@/lib/auth";
import { normalizePalette, PREVIEW_PALETTE_COOKIE } from "@/lib/dashboard/preview-routing";

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  // 与正式页面同一门禁：未登录跳转登录页。
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const palette = normalizePalette(cookieStore.get(PREVIEW_PALETTE_COOKIE)?.value);
  const exchanges = await getExchanges();

  return (
    <TradeNavigationGuard>
      <div data-ui="v2" data-palette={palette} className="flex h-full bg-canvas text-ink">
        <Suspense>
          <SidebarV2 exchanges={exchanges} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Suspense>
            <TopBarV2 palette={palette} />
          </Suspense>
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </main>
        </div>
      </div>
    </TradeNavigationGuard>
  );
}
