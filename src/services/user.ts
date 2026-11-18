import { UpdateCredentialsResponse, UserProfileResponse } from '../types/Auth';
import { ApiError, apiRequest } from '../utils/api';
import {
  getLocalUsers,
  LocalUserRecord,
  saveLocalUsers,
} from '../utils/preferencesStorage';
import { getToken } from '../utils/tokenStorage';

async function loadUsersList(): Promise<LocalUserRecord[]> {
  try {
    const serverUsers = await apiRequest<LocalUserRecord[]>('/api/users');
    if (Array.isArray(serverUsers) && serverUsers.length > 0) {
      await saveLocalUsers(serverUsers);
      return serverUsers;
    }
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw err;
    }
  }
  return await getLocalUsers();
}

export async function getUserProfile(userId: number): Promise<UserProfileResponse> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sesión no encontrada. Por favor inicia sesión nuevamente.');
  }

  try {
    const user = await apiRequest<LocalUserRecord>(`/api/users/${Number(userId)}`);
    return { id: user.id, email: user.email };
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw new Error(err.message);
    }
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
  const users = await loadUsersList();
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
  const users = await loadUsersList();
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
  const numericId = Number(userId);

  try {
    const updated = await apiRequest<LocalUserRecord>(`/api/users/${numericId}`, {
      method: 'PUT',
      body: JSON.stringify({ email: cleanEmail, password: newPassword }),
    });

    const localUsers = await getLocalUsers();
    const existsLocally = localUsers.some((u) => Number(u.id) === numericId);
    const nextUsers = existsLocally
      ? localUsers.map((u) => (Number(u.id) === numericId ? updated : u))
      : [...localUsers, updated];
    await saveLocalUsers(nextUsers);

    return {
      status: 'success',
      message: 'Credenciales actualizadas correctamente',
      affected_rows: 1,
    };
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw new Error(err.message);
    }
  }

  // Fallback offline si server.js no está activo
  const users = await getLocalUsers();
  const userIndex = users.findIndex((u) => Number(u.id) === numericId);
  if (userIndex === -1) {
    throw new Error('Usuario no encontrado.');
  }

  const emailTakenByOther = users.some(
    (u) => Number(u.id) !== numericId && u.email.toLowerCase() === normalizedEmail
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
