import api from './axios';
import { AdvisorHistorySchema, AdvisorRequestSchema, AdvisorResponseSchema, type AdvisorHistory, type AdvisorRequest, type AdvisorResponse } from '../schemas/advisorSchema';

export const getAdvisorHistory = async (): Promise<AdvisorHistory> => {
  const response = await api.get('/ai/history');
  return AdvisorHistorySchema.parse(response.data);
};

export const sendAdvisorMessage = async (payload: AdvisorRequest): Promise<AdvisorResponse> => {
  const parsedPayload = AdvisorRequestSchema.parse(payload);
  const response = await api.post('/ai/chat', parsedPayload);
  return AdvisorResponseSchema.parse(response.data);
};

export const sendAdvisorImage = async (payload: { message?: string; language?: AdvisorRequest["language"]; file: File }): Promise<AdvisorResponse> => {
  const form = new FormData();
  if (payload.message) form.append("message", payload.message);
  if (payload.language) form.append("language", payload.language);
  form.append("file", payload.file);
  // Note: Do NOT set Content-Type header with FormData - axios will handle it automatically
  const response = await api.post("/ai/chat-image", form);
  return AdvisorResponseSchema.parse(response.data);
};
