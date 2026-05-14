import { z } from 'zod';

export const WeatherForecastSchema = z.object({
  day: z.string(),
  temp: z.string(),
  icon: z.string().optional(),
  rain: z.string()
});

export const WeatherAdvisorySchema = z.object({
  recommendation: z.string(),
  reason: z.string(),
  soil_moisture: z.number(),
  savings: z.string(),
});

export const WeatherResponseSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  wind_speed: z.number().optional(),
  rain_probability: z.number(),
  forecast_graph: z.array(WeatherForecastSchema).optional(),
  advisory: WeatherAdvisorySchema.optional()
});

export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
