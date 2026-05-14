import api from "./axios";

export type InsightLevel = "info" | "warning" | "alert";

export interface AiInsight {
  id: string;
  title: string;
  message: string;
  level: InsightLevel;
  source?: string;
  created_at?: string | null;
}

export async function getAiInsights(): Promise<AiInsight[]> {
  const response = await api.get("/ai/insights");
  return Array.isArray(response.data) ? response.data : response.data?.items || [];
}

