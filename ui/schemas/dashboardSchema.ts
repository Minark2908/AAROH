import { z } from "zod";

export const DashboardMetricSchema = z.object({
  crop_health_pct: z.number().nullable().optional(),
  soil_moisture_pct: z.number().nullable().optional(),
  active_alerts: z.number().nullable().optional(),
  next_rain: z
    .object({
      day: z.string().nullable().optional(),
      probability_pct: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const DashboardPerformancePointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  crop_health_pct: z.number().nullable().optional(),
  soil_moisture_pct: z.number().nullable().optional(),
});

export const DashboardResponseSchema = z.object({
  metrics: DashboardMetricSchema,
  performance_30d: z.array(DashboardPerformancePointSchema),
  last_updated_utc: z.string().nullable().optional(),
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

