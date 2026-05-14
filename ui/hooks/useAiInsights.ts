import { useQuery } from "@tanstack/react-query";
import { getAiInsights, type AiInsight } from "@/api/aiApi";

export function useAiInsights() {
  return useQuery<AiInsight[]>({
    queryKey: ["ai-insights"],
    queryFn: getAiInsights,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
  });
}

