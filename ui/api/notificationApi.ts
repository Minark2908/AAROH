import api from './axios';

export interface Notification {
  id: number;
  type: string;
  message: string;
  level?: string;
  is_read: boolean;
  created_at: string;
  meta?: any;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id: number): Promise<any> => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const createNotification = async (payload: { type: string; message: string; level?: string; meta?: any }): Promise<Notification> => {
  const response = await api.post('/notifications', payload);
  return response.data;
};
