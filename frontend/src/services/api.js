import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/properties`,
});

// Existing
export const getTrendingProperties = () => api.get("/trending");
export const searchProperties = (filters) => api.get("/search", { params: filters });

// NEW: fetch by city with exact filters attached
export const getCityProperties = (city, filters = {}) => api.get("/search", { params: { city, ...filters } });

export default api;
