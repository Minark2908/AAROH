import { useQuery } from '@tanstack/react-query';
import { getIoTData } from '../api/iotApi';

export const useIoTData = (sensorId?: string) => {
  return useQuery({
    queryKey: ['iot-data', sensorId ?? 'default'],
    queryFn: () => getIoTData(sensorId),
    refetchInterval: 8000, // 8 seconds (real-time-ish)
  });
};
