import { useMutation } from '@tanstack/react-query';
import { predictPest } from '../api/pestApi';

export const usePestDetection = (opts?: { language?: "en" | "hi" | "gu" }) => {
  return useMutation({
    mutationFn: (imageFile: File) => predictPest(imageFile, opts),
  });
};
