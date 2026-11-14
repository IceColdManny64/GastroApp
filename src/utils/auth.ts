import { getLocalUsers, saveLocalUsers } from './preferencesStorage';
import { saveUserSession } from './tokenStorage';

export async function login(email: string, password: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[auth.ts] Intentando login local para: ${normalizedEmail}`);

  const users = await getLocalUsers();
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

  console.log('[auth.ts] Login exitoso para ID:', matchedUser.id);
  return token;
}

export async function registerUser(email: string, password: string): Promise<void> {
  const cleanEmail = email.trim();
  const normalizedEmail = cleanEmail.toLowerCase();
  console.log(`[auth.ts] Registrando nuevo usuario local: ${cleanEmail}`);

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
  console.log('[auth.ts] Usuario registrado con ID:', nextId);
}
