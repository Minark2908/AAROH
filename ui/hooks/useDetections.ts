import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDetections, updateDetectionStatus } from "@/api/detectionsApi";

export function useDetections() {
  return useQuery({
    queryKey: ["detections"],
    queryFn: getDetections,
  });
}

export function useUpdateDetectionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "Pending" | "Treated" }) =>
      updateDetectionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["detections"] });
    },
  });
}

