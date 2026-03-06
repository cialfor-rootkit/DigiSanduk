import axios from 'axios';
import { getToken, clearSession } from './auth';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

if (!rawBaseUrl) {
  console.warn('VITE_API_BASE_URL is not set. API calls will use the current origin.');
}

const api = axios.create({
  baseURL: baseURL || undefined,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authErrorHandler = null;

export const setAuthErrorHandler = (handler) => {
  authErrorHandler = handler;
};

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearSession();
      if (authErrorHandler) {
        authErrorHandler();
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  return fallback;
};

export default api;
