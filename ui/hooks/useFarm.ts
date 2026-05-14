import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFarm, updateFarm, type Farm } from "@/api/farmApi";

export const farmQueryKey = ["farm"] as const;

export function useFarm() {
  return useQuery<Farm>({
    queryKey: farmQueryKey,
    queryFn: getFarm,
    staleTime: 60_000,
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateFarm,
    onSuccess: (data) => {
      qc.setQueryData(farmQueryKey, data);
    },
  });
}

