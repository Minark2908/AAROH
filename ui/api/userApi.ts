import api from "./axios";

export type SupportedLanguage = "en" | "hi" | "gu";

export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  preferred_language: SupportedLanguage | string;
  avatar_url?: string | null;
}

export interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
  language?: SupportedLanguage | string;
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await api.get("/user/profile");
  return res.data;
}

export async function updateUserProfile(payload: UpdateUserProfileRequest): Promise<UserProfile> {
  const res = await api.put("/user/profile", payload);
  return res.data;
}

export async function changePassword(payload: { old_password: string; new_password: string }): Promise<{ message: string }> {
  const res = await api.put("/user/change-password", payload);
  return res.data;
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string; storage: "cloudinary" | "local" }> {
  const form = new FormData();
  form.append("file", file);
  // Note: Do NOT set Content-Type header with FormData - axios will handle it automatically
  const res = await api.post("/user/avatar", form);
  return res.data;
}

