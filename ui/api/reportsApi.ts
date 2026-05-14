import api from "./axios";
import { ReportsListResponseSchema, type ReportsListResponse } from "@/schemas/reportsSchema";

export async function listReports(): Promise<ReportsListResponse> {
  const res = await api.get("/reports");
  return ReportsListResponseSchema.parse(res.data);
}

export async function generateReport(days: number = 30): Promise<ReportsListResponse> {
  const res = await api.get("/reports", { params: { refresh: true, days } });
  return ReportsListResponseSchema.parse(res.data);
}

export async function exportReport(reportId: number, format: "csv" | "pdf") {
  const res = await api.get("/reports/export", {
    params: { report_id: reportId, format },
    responseType: "blob",
  });
  return res;
}

