import { create } from 'zustand';
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  requestVerifyToken,
  storeToken,
  verifyAccount,
  type RegisterInput,
} from '../services/api/auth';
import { ApiError } from '../services/api/client';
import type { UserRead } from '../types/api';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated' | 'error';

interface AuthState {
  status: SessionStatus;
  token: string | null;
  user: UserRead | null;
  pendingVerification: { email: string; password: string } | null;
  errorMessage: string | null;
  restoreSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  cancelVerification: () => void;
  signOut: () => Promise<void>;
  expireSession: () => void;
  clearError: () => void;
}

export function describeAuthError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.';
  switch (error.code) {
    case 'LOGIN_BAD_CREDENTIALS':
      return 'Неверный email или пароль.';
    case 'LOGIN_USER_NOT_VERIFIED':
      return 'Аккаунт ещё не подтверждён. Введите код из письма.';
    case 'REGISTER_USER_ALREADY_EXISTS':
      return 'Пользователь с таким email уже зарегистрирован.';
    case 'REGISTER_INVALID_PASSWORD':
    case 'RESET_PASSWORD_INVALID_PASSWORD':
      return error.reason ?? 'Пароль не подходит. Выберите другой.';
    case 'VERIFY_USER_BAD_TOKEN':
      return 'Код неверный или устарел. Запросите новый.';
    case 'VERIFY_USER_ALREADY_VERIFIED':
      return 'Аккаунт уже подтверждён. Войдите в систему.';
    case 'VALIDATION_ERROR':
      return 'Проверьте правильность заполнения полей.';
    default:
      return 'Что-то пошло не так. Попробуйте ещё раз.';
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'checking',
  token: null,
  user: null,
  pendingVerification: null,
  errorMessage: null,

  restoreSession: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ status: 'anonymous' });
      return;
    }
    try {
      const user = await fetchCurrentUser(token);
      set({ status: 'authenticated', token, user, errorMessage: null });
    } catch (error) {
      clearStoredToken();
      const unreachable = error instanceof ApiError && error.status === 0;
      set({
        status: unreachable ? 'error' : 'anonymous',
        token: null,
        user: null,
        errorMessage: unreachable ? describeAuthError(error) : null,
      });
    }
  },

  signIn: async (email, password) => {
    set({ errorMessage: null });
    try {
      const token = await loginRequest(email, password);
      const user = await fetchCurrentUser(token);
      storeToken(token);
      set({ status: 'authenticated', token, user, pendingVerification: null });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'LOGIN_USER_NOT_VERIFIED') {
        set({ pendingVerification: { email, password }, errorMessage: describeAuthError(error) });
        return;
      }
      set({ errorMessage: describeAuthError(error) });
    }
  },

  signUp: async (input) => {
    set({ errorMessage: null });
    try {
      await registerRequest(input);
      await requestVerifyToken(input.email);
      set({ pendingVerification: { email: input.email, password: input.password } });
    } catch (error) {
      set({ errorMessage: describeAuthError(error) });
    }
  },

  verifyEmail: async (token) => {
    const pending = get().pendingVerification;
    if (!pending) return;
    set({ errorMessage: null });
    try {
      await verifyAccount(token);
    } catch (error) {
      set({ errorMessage: describeAuthError(error) });
      return;
    }
    await get().signIn(pending.email, pending.password);
  },

  resendVerification: async () => {
    const pending = get().pendingVerification;
    if (!pending) return;
    set({ errorMessage: null });
    try {
      await requestVerifyToken(pending.email);
    } catch (error) {
      set({ errorMessage: describeAuthError(error) });
    }
  },

  cancelVerification: () => set({ pendingVerification: null, errorMessage: null }),

  signOut: async () => {
    const token = get().token;
    clearStoredToken();
    set({ status: 'anonymous', token: null, user: null, errorMessage: null, pendingVerification: null });
    if (token) await logoutRequest(token).catch(() => undefined);
  },

  expireSession: () => {
    clearStoredToken();
    set({
      status: 'anonymous',
      token: null,
      user: null,
      errorMessage: 'Сессия истекла. Войдите снова.',
    });
  },

  clearError: () => set({ errorMessage: null }),
}));
