import { getToken } from './tokenStorage';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchWithAuth<T>(
  action: () => Promise<T> | T
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new ApiError(
      'Sesión no encontrada. Por favor inicia sesión nuevamente.',
      401
    );
  }
  return await action();
}
