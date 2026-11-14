import { UpdateCredentialsResponse, UserProfileResponse } from '../types/Auth';
import { getLocalUsers, saveLocalUsers } from '../utils/preferencesStorage';
import { getToken } from '../utils/tokenStorage';

export async function getUserProfile(userId: number): Promise<UserProfileResponse> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sesión no encontrada. Por favor inicia sesión nuevamente.');
  }

  const users = await getLocalUsers();
  const found = users.find((u) => Number(u.id) === Number(userId));

  if (!found) {
    throw new Error('Usuario no encontrado.');
  }

  return {
    id: found.id,
    email: found.email,
  };
}

export async function verifyEmail(
  currentEmail: string
): Promise<UpdateCredentialsResponse> {
  const normalized = currentEmail.trim().toLowerCase();
  console.log('[user.ts] Verificando correo:', normalized);

  const users = await getLocalUsers();
  const found = users.find((u) => u.email.toLowerCase() === normalized);

  if (found) {
    return {
      status: 'success',
      exists: true,
      id: found.id,
    };
  }

  return {
    status: 'success',
    exists: false,
    message: 'Email no encontrado',
  };
}

export async function verifyPassword(
  userId: number,
  currentPassword: string
): Promise<UpdateCredentialsResponse> {
  console.log('[user.ts] Verificando contraseña actual para ID:', userId);

  const users = await getLocalUsers();
  const found = users.find((u) => Number(u.id) === Number(userId));

  if (!found) {
    throw new Error('Usuario no encontrado.');
  }

  const valid = found.password === currentPassword;
  return {
    status: 'success',
    valid,
    message: valid ? 'Contraseña válida' : 'Contraseña incorrecta',
  };
}

export async function updateCredentials(
  userId: number,
  newEmail: string,
  newPassword: string
): Promise<UpdateCredentialsResponse> {
  const cleanEmail = newEmail.trim();
  const normalizedEmail = cleanEmail.toLowerCase();
  console.log('[user.ts] Actualizando credenciales para ID:', userId);

  const users = await getLocalUsers();
  const userIndex = users.findIndex((u) => Number(u.id) === Number(userId));

  if (userIndex === -1) {
    throw new Error('Usuario no encontrado.');
  }

  const emailTakenByOther = users.some(
    (u) => u.id !== Number(userId) && u.email.toLowerCase() === normalizedEmail
  );
  if (emailTakenByOther) {
    throw new Error('Ese correo electrónico ya está en uso por otra cuenta.');
  }

  users[userIndex] = {
    ...users[userIndex],
    email: cleanEmail,
    password: newPassword,
  };

  await saveLocalUsers(users);

  return {
    status: 'success',
    message: 'Credenciales actualizadas correctamente',
    affected_rows: 1,
  };
}

export const verifyUserEmail = verifyEmail;
export const verifyUserPassword = verifyPassword;
export const updateUserCredentials = updateCredentials;
