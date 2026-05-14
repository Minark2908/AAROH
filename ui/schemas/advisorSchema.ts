import { z } from 'zod';

export const AdvisorRequestSchema = z.object({
  message: z.string(),
  language: z.enum(["en", "hi", "gu"]).optional(),
});

export const AdvisorResponseSchema = z.object({
  reply: z.string(),
  message_id: z.number(),
});

export const AdvisorHistorySchema = z.object({
  messages: z.array(
    z.object({
      id: z.number(),
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
      created_at: z.string().nullable().optional(),
      meta: z.record(z.string(), z.any()).nullable().optional(),
    })
  ),
});

export type AdvisorRequest = z.infer<typeof AdvisorRequestSchema>;
export type AdvisorResponse = z.infer<typeof AdvisorResponseSchema>;
export type AdvisorHistory = z.infer<typeof AdvisorHistorySchema>;
