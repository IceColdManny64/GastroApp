import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserSession } from '../types/Auth';

const TOKEN_KEY = 'gastrolab_auth_token';
const SESSION_KEY = 'gastrolab_user_session';

let tokenInMemory: string | null = null;
let sessionInMemory: UserSession | null = null;

export const saveToken = async (token: string): Promise<void> => {
  tokenInMemory = token;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
    console.log('[tokenStorage.ts] Token guardado:', token);
  } catch (err) {
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar token:', err);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) tokenInMemory = stored;
    } else {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) tokenInMemory = stored;
    }
  } catch (err) {
    console.warn('[tokenStorage.ts] Usando token en memoria:', err);
  }
  console.log('[tokenStorage.ts] Obteniendo token:', tokenInMemory);
  return tokenInMemory;
};

export const saveUserSession = async (session: UserSession): Promise<void> => {
  sessionInMemory = session;
  tokenInMemory = session.token;
  const serialized = JSON.stringify(session);
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_KEY, serialized);
      localStorage.setItem(TOKEN_KEY, session.token);
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, serialized);
      await SecureStore.setItemAsync(TOKEN_KEY, session.token);
    }
    console.log('[tokenStorage.ts] Sesión de usuario guardada:', session.email);
  } catch (err) {
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar sesión:', err);
  }
};

export const getUserSession = async (): Promise<UserSession | null> => {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
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
};

export const deleteToken = async (): Promise<void> => {
  tokenInMemory = null;
  sessionInMemory = null;
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
    console.log('[tokenStorage.ts] Token eliminado (Logout exitoso)');
  } catch (err) {
    console.warn('[tokenStorage.ts] Error limpiando storage:', err);
  }
};

export const removeToken = deleteToken;
