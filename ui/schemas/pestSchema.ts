import { z } from 'zod';

export const AIAdvisorySchema = z.object({
  explanation: z.string().optional(),
  chemical_treatment: z.object({
    name: z.string(),
    image: z.string().optional(),
  }).optional(),
  organic_treatment: z.object({
    name: z.string(),
    image: z.string().optional(),
  }).optional(),
  preventive_treatment: z.object({
    name: z.string(),
    image: z.string().optional(),
  }).optional(),
  application_steps: z.array(z.string()).optional(),
  preventive_measures: z.array(z.string()).optional(),
  video_tutorials: z.array(z.object({
    title: z.string(),
    url: z.string()
  })).optional(),
});

export const PestDetectionResponseSchema = z.object({
  pest: z.string().optional(),
  pest_name: z.string().optional(),
  confidence: z.number(),
  severity: z.string(),
  risk_index: z.number().optional(), // legacy (kept for backward compatibility)
  risk_level: z.string().optional(), // legacy
  upri: z.object({
    score: z.number(),
    level: z.enum(["Low Risk", "Moderate Risk", "High Risk"]).or(z.string()),
    drivers: z.array(z.object({
      key: z.string(),
      impact: z.enum(["low", "medium", "high"]).or(z.string()),
      reason: z.string()
    })).optional(),
  }).optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  soil_moisture: z.number().optional(),
  light_intensity: z.number().optional(),
  conditions: z.string().optional(),
  heatmap: z.string().optional(),
  image_url: z.string().optional(),
  detection_id: z.number().optional(),
  timestamp: z.string().optional(),
  context: z.object({
    crop_type: z.string().nullable().optional(),
    growth_stage: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    coordinates: z.object({ lat: z.number(), lon: z.number() }).nullable().optional(),
  }).optional(),
  insights: z.object({
    spread_probability: z.number().optional(),
    urgency_level: z.enum(["Low", "Medium", "High"]).or(z.string()).optional(),
    nearby_risk: z.enum(["Low", "Medium", "High"]).or(z.string()).optional(),
    rationale: z.array(z.string()).optional(),
  }).optional(),
  why: z.object({
    summary: z.string().optional(),
    signals: z.array(z.object({
      feature: z.enum(["color", "texture", "patterns", "localized_damage"]).or(z.string()),
      evidence: z.string(),
      strength: z.enum(["low", "medium", "high"]).or(z.string()),
    })).optional(),
    heatmap_available: z.boolean().optional(),
  }).optional(),
  history: z.object({
    recent: z.array(z.object({
      id: z.number(),
      pest_name: z.string(),
      confidence: z.number(),
      risk_index: z.number().optional(),
      timestamp: z.string().nullable().optional(),
      image_url: z.string().nullable().optional(),
      severity: z.string().optional(),
    })).optional(),
    trend: z.enum(["increasing", "decreasing", "stable"]).or(z.string()).optional(),
  }).optional(),
  treatment_override: z.string().nullable().optional(),
  ai_advisory: AIAdvisorySchema.optional(),
}).transform((data) => ({
  ...data,
  pest: data.pest || data.pest_name || "Unknown Pest",
}));

export type AIAdvisory = z.infer<typeof AIAdvisorySchema>;
export type PestDetectionResponse = z.infer<typeof PestDetectionResponseSchema>;
