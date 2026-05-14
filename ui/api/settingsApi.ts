import api from './axios';

export interface UserSettingsData {
  user: {
    name: string;
    phone: string;
    email: string;
    preferred_language: string;
  };
  farm: {
    land_area: number;
    primary_crop: string;
    secondary_crop: string | null;
    irrigation_type: string | null;
    farm_location?: string | null;
    crop_growth_stage?: string | null;
  } | null;
}

export const getSettings = async (): Promise<UserSettingsData> => {
  const response = await api.get('/dashboard/settings');
  return response.data;
};

export const updateSettings = async (data: any): Promise<any> => {
  const response = await api.put('/dashboard/settings', data);
  return response.data;
};
