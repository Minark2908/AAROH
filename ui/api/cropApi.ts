import api from "./axios";

export const getFields = async () => {
  const { data } = await api.get("/api/crop/fields");
  return data;
};

export const getNDVIHistory = async (fieldId: number, days: number = 30) => {
  const { data } = await api.get(`/api/crop/ndvi-history?field_id=${fieldId}&days=${days}`);
  return data;
};

export const getCropHealthSummary = async () => {
    const { data } = await api.get("/api/crop/crop-health");
    return data;
}
