import { z } from 'zod';

export const HistoryReportSchema = z.object({
  id: z.number(),
  report_name: z.string(),
  category: z.string(),
  date: z.string().nullable().optional(),
  file_size_bytes: z.number().nullable().optional(),
  detection_id: z.number().nullable().optional(),
});

export const HistoryResponseSchema = z.object({
  history: z.array(HistoryReportSchema),
}).passthrough();

export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;
