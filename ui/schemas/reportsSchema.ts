import { z } from "zod";

export const ReportListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  date: z.string().nullable().optional(),
  file_size_bytes: z.number().nullable().optional(),
  format: z.string().optional(),
});

export const ReportsListResponseSchema = z.object({
  items: z.array(ReportListItemSchema),
});

export type ReportListItem = z.infer<typeof ReportListItemSchema>;
export type ReportsListResponse = z.infer<typeof ReportsListResponseSchema>;

