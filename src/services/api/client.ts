import { API_BASE_URL } from '../../config';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly reason: string | null;

  constructor(status: number, code: string, reason: string | null = null) {
    super(code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.reason = reason;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: Record<string, string>;
  token?: string | null;
}

function extractCode(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object' && detail !== null && 'code' in detail) {
      const code = (detail as { code: unknown }).code;
      if (typeof code === 'string') return code;
    }
  }
  return status === 422 ? 'VALIDATION_ERROR' : 'UNKNOWN_ERROR';
}

function extractReason(payload: unknown): string | null {
  if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'object' && detail !== null && 'reason' in detail) {
      const reason = (detail as { reason: unknown }).reason;
      if (typeof reason === 'string') return reason;
    }
  }
  return null;
}

export async function apiRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;
  let formBody: string | undefined;

  if (options.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    formBody = new URLSearchParams(options.form).toString();
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formBody ?? body,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR');
  }
  const status = response.status;
  const payload = parseJsonSafely(await response.text());

  if (status < 200 || status >= 300) {
    throw new ApiError(status, extractCode(payload, status), extractReason(payload));
  }
  return payload;
}

function parseJsonSafely(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
