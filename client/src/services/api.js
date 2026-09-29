import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ACCESS_TOKEN_STORAGE_KEY = 'codespace.accessToken';

function readStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
});

// In-memory only. Never put the access token in localStorage — that's
// readable by any injected script (XSS) and would defeat the httpOnly
// refresh cookie's whole purpose.
let accessToken = readStoredAccessToken();

export function setAccessToken(token) {
  accessToken = token;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (token) {
      window.sessionStorage.setItem(
        ACCESS_TOKEN_STORAGE_KEY,
        token
      );
    } else {
      window.sessionStorage.removeItem(
        ACCESS_TOKEN_STORAGE_KEY
      );
    }
  } catch {
    // Ignore storage failures and keep the in-memory token current.
  }
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthEndpoint = config?.url?.includes('/auth/');
    if (response?.status !== 401 || isAuthEndpoint || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;

    // Coalesce concurrent 401s into a single refresh call.
    refreshPromise =
      refreshPromise ||
      api.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });

    try {
      const { data } = await refreshPromise;
      setAccessToken(data.data.accessToken);
      config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(config);
    } catch (refreshErr) {
      setAccessToken(null);
      return Promise.reject(refreshErr);
    }
  }
);
