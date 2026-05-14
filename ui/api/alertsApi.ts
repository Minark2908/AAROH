import api from "./axios";

export const refreshAlerts = async (): Promise<{ created: number }> => {
  const response = await api.post("/dashboard/alerts/refresh");
  return response.data;
};

