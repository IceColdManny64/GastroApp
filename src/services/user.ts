import { UpdateCredentialsResponse, UserProfileResponse } from '../types/Auth';
import { API_BASE_URL, fetchWithAuth } from '../utils/api';

const UPDATE_CREDENTIALS_URL = `${API_BASE_URL}/updateCredentials.php`;

export async function getUserProfile(userId: number): Promise<UserProfileResponse> {
  return fetchWithAuth<UserProfileResponse>(`/users.php?id=${userId}`);
}

export async function verifyPassword(
  userId: number,
  currentPassword: string
): Promise<UpdateCredentialsResponse> {
  console.log('[user.ts] Verificando contraseña actual para ID:', userId);

  const response = await fetch(UPDATE_CREDENTIALS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      action: 'verify_password',
      id: Number(userId),
      current_password: currentPassword,
    }),
  });

  const data: UpdateCredentialsResponse = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || data.error || 'Error al verificar la contraseña actual.');
  }

  return data;
}

export async function updateCredentials(
  userId: number,
  newEmail: string,
  newPassword: string
): Promise<UpdateCredentialsResponse> {
  console.log('[user.ts] Actualizando credenciales para ID:', userId);

  const response = await fetch(UPDATE_CREDENTIALS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      action: 'update_credentials',
      id: Number(userId),
      new_email: newEmail.trim(),
      new_password: newPassword,
    }),
  });

  const data: UpdateCredentialsResponse = await response.json();

  if (!response.ok || data.status !== 'success') {
    throw new Error(
      data.message || data.error || 'No se pudieron actualizar las credenciales.'
    );
  }

  return data;
}

export const verifyUserPassword = verifyPassword;
export const updateUserCredentials = updateCredentials;
