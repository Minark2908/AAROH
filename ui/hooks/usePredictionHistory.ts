import { useQuery } from '@tanstack/react-query';
import { getHistory } from '../api/historyApi';

export const usePredictionHistory = () => {
  return useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
  });
};
