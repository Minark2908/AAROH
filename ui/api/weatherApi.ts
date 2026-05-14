import api from './axios';
import { WeatherResponseSchema, type WeatherResponse } from '../schemas/weatherSchema';

export const getWeather = async (lat?: number, lon?: number): Promise<WeatherResponse> => {
  const params = lat && lon ? { lat, lon } : undefined;
  const response = await api.get('/weather', { params });
  try {
    return WeatherResponseSchema.parse(response.data);
  } catch (error) {
    console.error("Weather response validation failed:", error);
    return response.data; // Fallback to raw data if validation fails but request succeeds
  }
};
