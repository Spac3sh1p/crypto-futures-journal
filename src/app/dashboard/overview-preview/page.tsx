import { OverviewDashboard } from "@/components/overview/OverviewDashboard";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function OverviewPreviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <OverviewDashboard
      params={params}
      basePath="/dashboard/performance"
      showPreviewBadge
    />
  );
}
