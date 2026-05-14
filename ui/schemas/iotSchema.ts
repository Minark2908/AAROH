import { z } from 'zod';

export const IoTHistoryPointSchema = z.object({
  timestamp: z.string().nullable().optional(),
  temperature: z.number(),
  humidity: z.number(),
  soil_moisture: z.number(),
  light_intensity: z.number(),
  status: z.string().optional(),
});

export const IoTAlertSchema = z.object({
  id: z.number(),
  sensor_id: z.string(),
  type: z.string(),
  level: z.string(),
  message: z.string(),
  meta: z.any().optional(),
  created_at: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const SmartIrrigationSchema = z
  .object({
    should_irrigate: z.boolean(),
    urgency: z.enum(['medium', 'high']),
    reason: z.string(),
    suggested_volume_liters_per_acre: z.number(),
    notes: z.string().optional(),
    context: z.any().optional(),
  })
  .nullable()
  .optional();

export const IoTResponseSchema = z.object({
  sensor_id: z.string(),
  soil_moisture: z.number(),
  temperature: z.number(),
  humidity: z.number(),
  light_intensity: z.number(),
  status: z.enum(['online', 'offline', 'warning']).or(z.string()),
  timestamp: z.string().nullable().optional(),
  history: z.array(IoTHistoryPointSchema).optional(),
  alerts: z.array(IoTAlertSchema).optional(),
  sensors: z.array(z.string()).optional(),
  summary: z
    .object({
      total: z.number(),
      online: z.number(),
      warning: z.number(),
      offline: z.number(),
    })
    .optional(),
  smart_irrigation: SmartIrrigationSchema,
});

export type IoTHistoryPoint = z.infer<typeof IoTHistoryPointSchema>;
export type IoTAlert = z.infer<typeof IoTAlertSchema>;
export type IoTResponse = z.infer<typeof IoTResponseSchema>;
