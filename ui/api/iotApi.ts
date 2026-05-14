import api from './axios';
import { IoTResponseSchema, type IoTResponse } from '../schemas/iotSchema';

export const getIoTData = async (sensorId?: string): Promise<IoTResponse> => {
  const response = await api.get('/iot-data', {
    params: sensorId ? { sensor_id: sensorId, include_history: true, hours: 24, include_alerts: true } : { include_history: true, hours: 24, include_alerts: true },
  });

  return IoTResponseSchema.parse(response.data);
};
