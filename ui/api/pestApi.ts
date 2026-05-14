import api from './axios';
import { PestDetectionResponseSchema, type PestDetectionResponse } from '../schemas/pestSchema';

export const predictPest = async (imageFile: File, opts?: { language?: "en" | "hi" | "gu" }): Promise<PestDetectionResponse> => {
  const formData = new FormData();
  formData.append('file', imageFile);
  if (opts?.language) formData.append("language", opts.language);

  try {
    const response = await api.post('/predict', formData);
    console.log("Prediction success:", response.data);
    return PestDetectionResponseSchema.parse(response.data);
  } catch (error: any) {
    console.error("Error in predictPest:", error);
    if (error.code === 'ERR_NETWORK') {
      throw new Error("Unable to connect to the AI model. Please ensure the backend service is running.");
    }
    throw error;
  }
};
