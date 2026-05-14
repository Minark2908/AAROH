import api from "./axios";
import { DetectionsResponseSchema, type DetectionsResponse } from "@/schemas/detectionsSchema";

export async function getDetections(): Promise<DetectionsResponse> {
  const response = await api.get("/dashboard/detections");
  return DetectionsResponseSchema.parse(response.data);
}

export async function updateDetectionStatus(id: number, status: "Pending" | "Treated"): Promise<{ message: string }> {
  const response = await api.patch(`/dashboard/detections/${id}`, { status });
  return response.data;
}

