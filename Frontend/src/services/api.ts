/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser/Axios set multipart boundaries for FormData uploads.
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract error messages, handle 401 / 403
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (status === 401) {
      // Clear token & stored user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch unauthorized event so AuthContext can clean up cleanly
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message } }));
    }

    if (status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: { message } }));
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

export const resolveApiFileUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const root = BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};
