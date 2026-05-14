import api from './axios';
import { HistoryResponseSchema, type HistoryResponse } from '../schemas/historySchema';

export const getHistory = async (): Promise<HistoryResponse> => {
  const response = await api.get('/dashboard/history');
  return HistoryResponseSchema.parse(response.data);
};
