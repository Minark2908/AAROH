import api from "./axios";

// ── User Management ────────────────────────────────────────────────────────

export const fetchUsers = async () => {
  const response = await api.get("/api/admin/users");
  return response.data;
};

export const deleteUser = async (userId: number) => {
  const response = await api.delete(`/api/admin/user/${userId}`);
  return response.data;
};

export const promoteUser = async (userId: number) => {
  const response = await api.patch(`/api/admin/user/${userId}/promote`);
  return response.data;
};

export const demoteUser = async (userId: number) => {
  const response = await api.patch(`/api/admin/user/${userId}/demote`);
  return response.data;
};

export const disableUser = async (userId: number) => {
  const response = await api.patch(`/api/admin/user/${userId}/disable`);
  return response.data;
};

export const enableUser = async (userId: number) => {
  const response = await api.patch(`/api/admin/user/${userId}/enable`);
  return response.data;
};

export const flagUser = async (userId: number, note: string) => {
  const response = await api.patch(`/api/admin/user/${userId}/flag`, { note });
  return response.data;
};

export const fetchUserHistory = async (userId: number) => {
  const response = await api.get(`/api/admin/user/${userId}/history`);
  return response.data;
};

// ── Predictions ────────────────────────────────────────────────────────────

export const fetchAllPredictions = async () => {
  const response = await api.get("/api/admin/predictions");
  return response.data;
};

export const overrideTreatment = async (
  predictionId: number,
  treatmentOverride: string
) => {
  const response = await api.post(`/api/admin/treatment/${predictionId}`, {
    treatment_override: treatmentOverride,
  });
  return response.data;
};

// ── Stats ──────────────────────────────────────────────────────────────────

export const fetchAdminStats = async () => {
  const response = await api.get("/api/admin/stats");
  return response.data;
};

// ── Logs & Settings ────────────────────────────────────────────────────────

export const fetchLogs = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
} = {}) => {
  const response = await api.get("/api/admin/logs", { params });
  return response.data;
};

export const fetchSettings = async () => {
  const response = await api.get("/api/admin/settings");
  return response.data;
};

export const updateSettings = async (updates: { key: string; value: string }[]) => {
  const response = await api.put("/api/admin/settings", updates);
  return response.data;
};

// ── Activity Timeline ──────────────────────────────────────────────────────

export const fetchActivity = async () => {
  const response = await api.get("/api/admin/activity");
  return response.data;
};

// ── Master Admin Login ─────────────────────────────────────────────────────

export const adminLogin = async (username: string, password: string) => {
  const response = await api.post("/auth/admin-login", { username, password });
  return response.data;
};
