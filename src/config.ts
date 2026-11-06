const env = import.meta.env;

export const API_BASE_URL: string = env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export const TOKEN_STORAGE_KEY = 'gibbonchat.access_token';

export function toWsBase(httpBase: string): string {
  return httpBase.replace(/^http/, 'ws');
}
