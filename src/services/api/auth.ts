import { TOKEN_STORAGE_KEY } from '../../config';
import type { UserRead } from '../../types/api';
import { apiRequest } from './client';
import { parseUser } from './parsers';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  name: string;
}

export async function login(email: string, password: string): Promise<string> {
  const payload = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    form: { username: email, password },
  });
  if (typeof payload !== 'object' || payload === null || !('access_token' in payload)) {
    throw new Error('Unexpected login response');
  }
  const token = (payload as { access_token: unknown }).access_token;
  if (typeof token !== 'string') throw new Error('Unexpected login response');
  return token;
}

export async function register(input: RegisterInput): Promise<UserRead> {
  const payload = await apiRequest('/api/v1/auth/register', { method: 'POST', body: input });
  return parseUser(payload);
}

export async function requestVerifyToken(email: string): Promise<void> {
  await apiRequest('/api/v1/auth/request-verify-token', { method: 'POST', body: { email } });
}

export async function verifyAccount(token: string): Promise<void> {
  await apiRequest('/api/v1/auth/verify', { method: 'POST', body: { token } });
}

export async function fetchCurrentUser(token: string): Promise<UserRead> {
  const payload = await apiRequest('/api/v1/users/me', { token });
  return parseUser(payload);
}

export async function logout(token: string): Promise<void> {
  await apiRequest('/api/v1/auth/logout', { method: 'POST', token });
}
