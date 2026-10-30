import { normalizeDashboardParams } from "@/lib/dashboard/trade-history-routing";
import { OverviewV2 } from "@/components/v2/overview/OverviewV2";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function PreviewOverviewPage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);
  return <OverviewV2 params={params} />;
}
