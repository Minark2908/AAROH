import { useQuery } from '@tanstack/react-query';
import { getWeather } from '../api/weatherApi';

export const useWeather = (lat?: number, lon?: number) => {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => getWeather(lat, lon),
  });
};
