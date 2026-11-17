import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import defaultUsersRaw from '@/data/users.json';
import { UserSettings } from '@/types/Auth';
import { RecipeItem } from '@/types/RecipeItem';
import { getUserSession } from './tokenStorage';

const FAVORITES_PREFIX = 'gastrolab_favorites_';
const SETTINGS_PREFIX = 'gastrolab_settings_';
const GLOBAL_THEME_KEY = 'gastrolab_global_theme';
const CRUD_OVERLAY_KEY = 'gastrolab_crud_overlay';
const USERS_STORAGE_KEY = 'gastrolab_local_users';

export interface LocalUserRecord {
  id: number;
  email: string;
  password: string;
}

const DEFAULT_LOCAL_USERS: LocalUserRecord[] = defaultUsersRaw as unknown as LocalUserRecord[];

export interface CrudOverlayState {
  createdRecipes: RecipeItem[];
  updatedRecipesById: Record<string, RecipeItem>;
  deletedRecipeIds: number[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  itemsPerPage: 10,
  themeMode: 'light',
  defaultCategory: 'Todas',
  compactCards: false,
};

const memoryCache: Record<string, string> = {};
let cachedThemeMode: 'light' | 'dark' = 'light';
let themeInitialized = false;
const themeListeners = new Set<(mode: 'light' | 'dark') => void>();

function isWebStorageAvailable(): boolean {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

const notifyThemeListeners = (mode: 'light' | 'dark') => {
  cachedThemeMode = mode;
  themeInitialized = true;
  themeListeners.forEach((listener) => {
    try {
      listener(mode);
    } catch (err) {
      console.warn('[preferencesStorage.ts] Error en listener de tema:', err);
    }
  });
};

const CHUNK_SIZE = 1800;

async function readStorageItem(key: string): Promise<string | null> {
  try {
    if (isWebStorageAvailable()) {
      const value = localStorage.getItem(key);
      if (value !== null) memoryCache[key] = value;
      return value;
    }
    if (memoryCache[key] !== undefined) {
      return memoryCache[key];
    }
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}__chunks`);
    if (chunkCountRaw) {
      const count = Number(chunkCountRaw);
      if (Number.isFinite(count) && count > 0) {
        const parts: string[] = [];
        for (let i = 0; i < count; i++) {
          const part = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
          if (part !== null) parts.push(part);
        }
        const joined = parts.join('');
        memoryCache[key] = joined;
        return joined;
      }
    }
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) memoryCache[key] = value;
    return value ?? null;
  } catch (err) {
    console.warn(`[preferencesStorage.ts] Fallback a memoria al leer ${key}:`, err);
    return memoryCache[key] ?? null;
  }
}

async function writeStorageItem(key: string, value: string): Promise<void> {
  memoryCache[key] = value;
  try {
    if (isWebStorageAvailable()) {
      localStorage.setItem(key, value);
      return;
    }
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}__chunks`);
      await SecureStore.setItemAsync(key, value);
    } else {
      const chunks = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < chunks; i++) {
        const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}__chunk_${i}`, slice);
      }
      await SecureStore.setItemAsync(`${key}__chunks`, String(chunks));
    }
  } catch (err) {
    console.warn(`[preferencesStorage.ts] Fallback a memoria al guardar ${key}:`, err);
  }
}

async function removeStorageItem(key: string): Promise<void> {
  delete memoryCache[key];
  try {
    if (isWebStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      const chunkCountRaw = await SecureStore.getItemAsync(`${key}__chunks`);
      if (chunkCountRaw) {
        const count = Number(chunkCountRaw);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}__chunks`);
      }
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    console.warn(`[preferencesStorage.ts] Error eliminando ${key}:`, err);
  }
}

async function getUserKeySuffix(): Promise<string> {
  const session = await getUserSession();
  return session?.id ? String(session.id) : 'guest';
}

export async function getFavorites(): Promise<number[]> {
  const suffix = await getUserKeySuffix();
  const raw = await readStorageItem(`${FAVORITES_PREFIX}${suffix}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    }
  } catch (err) {
    console.warn('[preferencesStorage.ts] Error parseando favoritos:', err);
  }
  return [];
}

export async function toggleFavorite(recipeId: number): Promise<number[]> {
  const suffix = await getUserKeySuffix();
  const current = await getFavorites();
  const numericId = Number(recipeId);
  const exists = current.includes(numericId);
  const updated = exists
    ? current.filter((id) => id !== numericId)
    : [...current, numericId];

  await writeStorageItem(`${FAVORITES_PREFIX}${suffix}`, JSON.stringify(updated));
  return updated;
}

export async function getUserSettings(): Promise<UserSettings> {
  const suffix = await getUserKeySuffix();
  const [raw, globalTheme] = await Promise.all([
    readStorageItem(`${SETTINGS_PREFIX}${suffix}`),
    readStorageItem(GLOBAL_THEME_KEY),
  ]);

  const fallbackTheme: 'light' | 'dark' =
    globalTheme === 'dark' ? 'dark' : 'light';

  if (!raw) {
    const defaults: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      themeMode: fallbackTheme,
    };
    notifyThemeListeners(defaults.themeMode);
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    const validPageSize =
      parsed.itemsPerPage === 10 || parsed.itemsPerPage === 20 || parsed.itemsPerPage === 30
        ? parsed.itemsPerPage
        : DEFAULT_USER_SETTINGS.itemsPerPage;
    const resolvedTheme: 'light' | 'dark' =
      parsed.themeMode === 'dark'
        ? 'dark'
        : parsed.themeMode === 'light'
          ? 'light'
          : fallbackTheme;

    const settings: UserSettings = {
      itemsPerPage: validPageSize,
      themeMode: resolvedTheme,
      defaultCategory: parsed.defaultCategory || 'Todas',
      compactCards: Boolean(parsed.compactCards),
    };
    notifyThemeListeners(settings.themeMode);
    return settings;
  } catch (err) {
    console.warn('[preferencesStorage.ts] Error parseando settings:', err);
    return { ...DEFAULT_USER_SETTINGS, themeMode: fallbackTheme };
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<UserSettings> {
  const suffix = await getUserKeySuffix();
  notifyThemeListeners(settings.themeMode);
  await Promise.all([
    writeStorageItem(`${SETTINGS_PREFIX}${suffix}`, JSON.stringify(settings)),
    writeStorageItem(GLOBAL_THEME_KEY, settings.themeMode),
  ]);
  return settings;
}

export function useThemeMode(): boolean {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (isWebStorageAvailable()) {
      const storedGlobal = localStorage.getItem(GLOBAL_THEME_KEY);
      if (storedGlobal === 'dark' || storedGlobal === 'light') {
        cachedThemeMode = storedGlobal;
        return storedGlobal;
      }
    }
    return cachedThemeMode;
  });

  useEffect(() => {
    const listener = (nextMode: 'light' | 'dark') => {
      setMode(nextMode);
    };
    themeListeners.add(listener);

    if (!themeInitialized) {
      getUserSettings().catch(() => {});
    } else {
      setMode(cachedThemeMode);
    }

    return () => {
      themeListeners.delete(listener);
    };
  }, []);

  return mode === 'dark';
}

export async function getCrudOverlay(): Promise<CrudOverlayState> {
  const raw = await readStorageItem(CRUD_OVERLAY_KEY);
  if (!raw) {
    return {
      createdRecipes: [],
      updatedRecipesById: {},
      deletedRecipeIds: [],
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CrudOverlayState>;
    return {
      createdRecipes: Array.isArray(parsed.createdRecipes) ? parsed.createdRecipes : [],
      updatedRecipesById:
        parsed.updatedRecipesById && typeof parsed.updatedRecipesById === 'object'
          ? parsed.updatedRecipesById
          : {},
      deletedRecipeIds: Array.isArray(parsed.deletedRecipeIds)
        ? parsed.deletedRecipeIds.map((id) => Number(id))
        : [],
    };
  } catch (err) {
    console.warn('[preferencesStorage.ts] Error parseando overlay CRUD:', err);
    return {
      createdRecipes: [],
      updatedRecipesById: {},
      deletedRecipeIds: [],
    };
  }
}

export async function saveCrudOverlay(overlay: CrudOverlayState): Promise<void> {
  await writeStorageItem(CRUD_OVERLAY_KEY, JSON.stringify(overlay));
}

export async function resetLocalRecipeChanges(): Promise<void> {
  await removeStorageItem(CRUD_OVERLAY_KEY);
}

export async function getLocalUsers(): Promise<LocalUserRecord[]> {
  const raw = await readStorageItem(USERS_STORAGE_KEY);
  if (!raw) {
    await writeStorageItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_LOCAL_USERS));
    return [...DEFAULT_LOCAL_USERS];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((u) => ({
        id: Number(u.id),
        email: String(u.email || '').trim(),
        password: String(u.password || ''),
      }));
    }
  } catch (err) {
    console.warn('[preferencesStorage.ts] Error parseando usuarios locales:', err);
  }
  return [...DEFAULT_LOCAL_USERS];
}

export async function saveLocalUsers(users: LocalUserRecord[]): Promise<void> {
  await writeStorageItem(USERS_STORAGE_KEY, JSON.stringify(users));
}
