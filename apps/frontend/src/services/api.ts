import axios from 'axios';

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
