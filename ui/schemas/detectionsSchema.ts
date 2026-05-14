import { z } from "zod";

export const DetectionItemSchema = z.object({
  id: z.number(),
  image_url: z.string().nullable().optional(),
  pest_name: z.string(),
  confidence: z.number(),
  severity: z.string(),
  risk_index: z.number().optional(),
  risk_level: z.string().optional(),
  timestamp: z.string().nullable().optional(),
  status: z.string(),
});

export const DetectionsResponseSchema = z.object({
  items: z.array(DetectionItemSchema),
});

export type DetectionItem = z.infer<typeof DetectionItemSchema>;
export type DetectionsResponse = z.infer<typeof DetectionsResponseSchema>;

