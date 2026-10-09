import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const fetchEDA = () => api.get("/eda").then((r) => r.data);
export const fetchModels = () => api.get("/models").then((r) => r.data);
export const fetchFeatures = () => api.get("/features").then((r) => r.data);
export const predict = (payload) => api.post("/predict", payload).then((r) => r.data);
export const predictBatch = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api
    .post("/predict/batch", fd, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
export const sampleCsvUrl = `${API}/predict/sample-csv`;
