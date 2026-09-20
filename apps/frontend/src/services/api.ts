import axios from 'axios';
import { clearAuthToken, getAuthToken } from './auth-storage.js';

/**
 * Capa de servicios HTTP.
 * Usa VITE_API_URL para no hardcodear el backend.
 */
const baseURL = import.meta.env.VITE_API_URL as string | undefined;

export const api = axios.create({
  baseURL: baseURL ? `${baseURL.replace(/\/$/, '')}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) clearAuthToken();
    return Promise.reject(error);
  },
);
