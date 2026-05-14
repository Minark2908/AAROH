import api from "./axios";
import { DashboardResponseSchema, type DashboardResponse } from "@/schemas/dashboardSchema";

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get("/dashboard");
  try {
    return DashboardResponseSchema.parse(response.data);
  } catch (error) {
    console.error("Dashboard response validation failed:", error);
    return response.data;
  }
}

