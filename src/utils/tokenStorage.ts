import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserSession } from '@/types/Auth';

const TOKEN_KEY = 'auth_token';
const SESSION_KEY = 'gastrolab_user_session';

let tokenInMemory: string | null = null;
let sessionInMemory: UserSession | null = null;

function isWebStorageAvailable(): boolean {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

export async function saveToken(token: string): Promise<void> {
  tokenInMemory = token;
  try {
    if (isWebStorageAvailable()) {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar token:', err);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (isWebStorageAvailable()) {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) tokenInMemory = stored;
      return stored ?? tokenInMemory;
    }

    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored) tokenInMemory = stored;
    return stored ?? tokenInMemory;
  } catch (err) {
    console.warn('[tokenStorage.ts] Usando token en memoria:', err);
    return tokenInMemory;
  }
}

export async function saveUserSession(session: UserSession): Promise<void> {
  sessionInMemory = session;
  tokenInMemory = session.token;
  const serialized = JSON.stringify(session);
  try {
    if (isWebStorageAvailable()) {
      localStorage.setItem(SESSION_KEY, serialized);
      localStorage.setItem(TOKEN_KEY, session.token);
      return;
    }

    await SecureStore.setItemAsync(SESSION_KEY, serialized);
    await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  } catch (err) {
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar sesión:', err);
  }
}

export async function getUserSession(): Promise<UserSession | null> {
  try {
    let raw: string | null = null;
    if (isWebStorageAvailable()) {
      raw = localStorage.getItem(SESSION_KEY);
    } else {
      raw = await SecureStore.getItemAsync(SESSION_KEY);
    }
    if (raw) {
      sessionInMemory = JSON.parse(raw) as UserSession;
      return sessionInMemory;
    }
  } catch (err) {
    console.warn('[tokenStorage.ts] Usando sesión en memoria:', err);
  }

  if (sessionInMemory) {
    return sessionInMemory;
  }

  const token = await getToken();
  if (token) {
    const match = /^gastrolab-token-(\d+)-/.exec(token);
    if (match && match[1]) {
      sessionInMemory = {
        id: Number(match[1]),
        email: '',
        token,
      };
      return sessionInMemory;
    }
  }

  return null;
}

export async function deleteToken(): Promise<void> {
  tokenInMemory = null;
  sessionInMemory = null;
  try {
    if (isWebStorageAvailable()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (err) {
    console.warn('[tokenStorage.ts] Error limpiando storage:', err);
  }
}

export const removeToken = deleteToken;
