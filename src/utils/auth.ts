import { API_BASE_URL } from './api';
import { LoginSuccessResponse, RegisterResponse } from '../types/Auth';
import { saveUserSession } from './tokenStorage';

const LOGIN_URL = `${API_BASE_URL}/login.php`;
const REGISTER_URL = `${API_BASE_URL}/register.php`;

export async function login(email: string, password: string): Promise<string> {
  console.log(`[auth.ts] Intentando login para: ${email} en URL: ${LOGIN_URL}`);

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data: LoginSuccessResponse = await response.json();

  if (!response.ok || data.login !== 'success' || !data.id) {
    throw new Error(data.message || data.error || 'Correo o contraseña incorrectos');
  }

  const token = `gastrolab-token-${data.id}-${Date.now()}`;
  await saveUserSession({
    id: Number(data.id),
    email: data.email || email.trim(),
    token,
  });

  console.log('[auth.ts] Login exitoso, token generado para ID:', data.id);
  return token;
}

export async function registerUser(email: string, password: string): Promise<void> {
  console.log(`[auth.ts] Registrando nuevo usuario: ${email}`);

  const response = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data: RegisterResponse = await response.json();

  if (response.status === 409) {
    throw new Error('Este correo electrónico ya está registrado.');
  }

  if (!response.ok || data.store !== 'success') {
    throw new Error(data.error || 'No se pudo completar el registro.');
  }
}
