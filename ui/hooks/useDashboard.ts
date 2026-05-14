import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/api/dashboardApi";
import type { DashboardResponse } from "@/schemas/dashboardSchema";

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });
}

