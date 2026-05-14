import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateReport, listReports } from "@/api/reportsApi";

export function useReports() {
  const qc = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const q = useQuery({
    queryKey: ["reports"],
    queryFn: listReports,
  });

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await generateReport(30);
      await qc.invalidateQueries({ queryKey: ["reports"] });
    } finally {
      setIsRefreshing(false);
    }
  }, [qc]);

  return {
    items: q.data?.items ?? [],
    isLoading: q.isLoading,
    error: q.error,
    refresh,
    isRefreshing,
  };
}

