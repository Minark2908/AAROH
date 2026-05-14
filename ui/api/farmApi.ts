import api from "./axios";

export interface Farm {
  id: number;
  location?: string | null;
  land_area?: number | null;
  crops: string[];
  growth_stage?: string | null;
  irrigation_type?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface UpdateFarmRequest {
  location?: string | null;
  land_area?: number | null;
  crops?: string[];
  growth_stage?: string | null;
  irrigation_type?: string | null;
}

export async function getFarm(): Promise<Farm> {
  const res = await api.get("/farm");
  return res.data;
}

export async function updateFarm(payload: UpdateFarmRequest): Promise<Farm> {
  const res = await api.put("/farm", payload);
  return res.data;
}

