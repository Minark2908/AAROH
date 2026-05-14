import { useMutation, useQuery } from '@tanstack/react-query';
import { getAdvisorHistory, sendAdvisorImage, sendAdvisorMessage } from '../api/advisorApi';
import type { AdvisorRequest } from '../schemas/advisorSchema';

export const useAdvisor = () => {
  return useMutation({
    mutationFn: (payload: AdvisorRequest) => sendAdvisorMessage(payload),
  });
};

export const advisorHistoryQueryKey = ["advisor-history"] as const;

export function useAdvisorHistory() {
  return useQuery({
    queryKey: advisorHistoryQueryKey,
    queryFn: getAdvisorHistory,
    staleTime: 15_000,
  });
}

export function useAdvisorImage() {
  return useMutation({
    mutationFn: sendAdvisorImage,
  });
}
