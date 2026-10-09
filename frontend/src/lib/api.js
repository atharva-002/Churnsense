import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  // Render free tier can take ~30-50s to wake up a sleeping dyno.
  timeout: 65000,
});

export const WAKING_EVENT = "churnsense:waking";
function emitWaking(detail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WAKING_EVENT, { detail }));
  }
}

const MAX_RETRIES = 6;

api.interceptors.response.use(
  (res) => {
    emitWaking({ waking: false });
    return res;
  },
  async (err) => {
    const cfg = err.config || {};
    cfg._retry = (cfg._retry || 0) + 1;

    const status = err.response?.status;
    const noResponse = !err.response;
    const transient =
      noResponse || status === 502 || status === 503 || status === 504 || status === 408;

    if (transient && cfg._retry <= MAX_RETRIES) {
      emitWaking({ waking: true, attempt: cfg._retry, max: MAX_RETRIES });
      // 1s, 2s, 4s, 6s, 8s, 10s — spans ~30s of wake time
      const delays = [1000, 2000, 4000, 6000, 8000, 10000];
      await new Promise((r) => setTimeout(r, delays[cfg._retry - 1] || 10000));
      return api(cfg);
    }

    emitWaking({ waking: false });
    return Promise.reject(err);
  }
);

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
