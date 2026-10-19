import { getToken } from './tokenStorage';

export const API_BASE_URL = 'http://apifake.mywebcommunity.org';
const REQUEST_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new ApiError('Sesión no encontrada. Por favor inicia sesión nuevamente.', 401);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[api.ts] ${options.method || 'GET'} -> ${url}`);

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'text/plain;charset=UTF-8';
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsedData: any = null;

    if (rawText && rawText.trim().length > 0) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        throw new ApiError('Respuesta inválida del servidor.', response.status);
      }
    }

    if (!response.ok) {
      const serverMessage =
        parsedData?.message || parsedData?.error || `Error HTTP: ${response.status}`;
      throw new ApiError(serverMessage, response.status);
    }

    if (
      parsedData &&
      typeof parsedData === 'object' &&
      !Array.isArray(parsedData) &&
      parsedData.error
    ) {
      throw new ApiError(parsedData.error, 400);
    }

    return parsedData as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Tiempo de espera agotado al conectar con el servidor.', 408);
    }
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
