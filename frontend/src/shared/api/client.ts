import { useAuthStore } from '../../features/auth/authStore';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch (error: unknown) {
    throw new ApiError('Sin conexión. Revisa la red e intenta de nuevo.', 0, error);
  }

  if (response.status === 401 && !path.startsWith('/auth/login')) {
    useAuthStore.getState().clear();
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const message =
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: string }).error)
        : `HTTP ${response.status} en ${path}`;
    throw new ApiError(message, response.status, body);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}

/** Fetch con Bearer para respuestas binarias (export Excel, etc.). */
export async function apiFetchRaw(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch (error: unknown) {
    throw new ApiError('Sin conexión. Revisa la red e intenta de nuevo.', 0, error);
  }

  if (response.status === 401) {
    useAuthStore.getState().clear();
  }

  return response;
}
