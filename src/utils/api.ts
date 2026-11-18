import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from './tokenStorage';

const SERVER_PORT = 3001;
const REQUEST_TIMEOUT_MS = 2500;

export function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:${SERVER_PORT}`;
    }
    return `http://localhost:${SERVER_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:${SERVER_PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${SERVER_PORT}`;
  }

  return `http://localhost:${SERVER_PORT}`;
}

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;

  constructor(message: string, status: number = 400, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      const errorMessage =
        parsed?.error || parsed?.message || `Error del servidor (${res.status})`;
      throw new ApiError(errorMessage, res.status, false);
    }

    return parsed as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const msg =
      err instanceof Error
        ? err.message
        : 'No se pudo conectar con el servidor local.';
    throw new ApiError(msg, 0, true);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithAuth<T>(
  action: () => Promise<T> | T
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new ApiError(
      'Sesión no encontrada. Por favor inicia sesión nuevamente.',
      401,
      false
    );
  }
  return await action();
}
