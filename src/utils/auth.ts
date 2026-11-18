import { ApiError, apiRequest } from './api';
import {
  getLocalUsers,
  LocalUserRecord,
  saveLocalUsers,
} from './preferencesStorage';
import { saveUserSession } from './tokenStorage';

async function fetchUsersWithFallback(): Promise<LocalUserRecord[]> {
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

export async function login(email: string, password: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await fetchUsersWithFallback();

  const matchedUser = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!matchedUser) {
    throw new Error('Correo o contraseña incorrectos');
  }

  const token = `gastrolab-token-${matchedUser.id}-${Date.now()}`;
  await saveUserSession({
    id: matchedUser.id,
    email: matchedUser.email,
    token,
  });

  return token;
}

export async function registerUser(email: string, password: string): Promise<void> {
  const cleanEmail = email.trim();
  const normalizedEmail = cleanEmail.toLowerCase();

  try {
    const created = await apiRequest<LocalUserRecord>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const localUsers = await getLocalUsers();
    await saveLocalUsers([
      ...localUsers.filter((u) => Number(u.id) !== Number(created.id)),
      created,
    ]);
    return;
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw new Error(err.message);
    }
  }

  const users = await getLocalUsers();
  const alreadyExists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (alreadyExists) {
    throw new Error('Este correo electrónico ya está registrado.');
  }

  const nextId =
    users.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;

  users.push({
    id: nextId,
    email: cleanEmail,
    password,
  });
  await saveLocalUsers(users);
}
