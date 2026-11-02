import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { UserSettings } from '../types/Auth';
import { RecipeItem } from '../types/RecipeItem';
import { getUserSession } from './tokenStorage';

const FAVORITES_PREFIX = 'gastrolab_favorites_';
const SETTINGS_PREFIX = 'gastrolab_settings_';
const GLOBAL_THEME_KEY = 'gastrolab_global_theme';
const CRUD_OVERLAY_KEY = 'gastrolab_crud_overlay';

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

const readStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(key);
      if (value !== null) memoryCache[key] = value;
      return value;
    }
    if (memoryCache[key] !== undefined) {
      return memoryCache[key];
    }
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) memoryCache[key] = value;
    return value ?? null;
  } catch (err) {
    console.warn(`[preferencesStorage.ts] Fallback a memoria al leer ${key}:`, err);
    return memoryCache[key] ?? null;
  }
};

const writeStorageItem = async (key: string, value: string): Promise<void> => {
  memoryCache[key] = value;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else if (value.length <= 1950) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (err) {
    console.warn(`[preferencesStorage.ts] Fallback a memoria al guardar ${key}:`, err);
  }
};

const removeStorageItem = async (key: string): Promise<void> => {
  delete memoryCache[key];
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    console.warn(`[preferencesStorage.ts] Error eliminando ${key}:`, err);
  }
};

const getUserKeySuffix = async (): Promise<string> => {
  const session = await getUserSession();
  return session?.id ? String(session.id) : 'guest';
};

export const getFavorites = async (): Promise<number[]> => {
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
};

export const toggleFavorite = async (recipeId: number): Promise<number[]> => {
  const suffix = await getUserKeySuffix();
  const current = await getFavorites();
  const numericId = Number(recipeId);
  const exists = current.includes(numericId);
  const updated = exists
    ? current.filter((id) => id !== numericId)
    : [...current, numericId];

  await writeStorageItem(`${FAVORITES_PREFIX}${suffix}`, JSON.stringify(updated));
  return updated;
};

export const getUserSettings = async (): Promise<UserSettings> => {
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
};

export const saveUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  const suffix = await getUserKeySuffix();
  notifyThemeListeners(settings.themeMode);
  await Promise.all([
    writeStorageItem(`${SETTINGS_PREFIX}${suffix}`, JSON.stringify(settings)),
    writeStorageItem(GLOBAL_THEME_KEY, settings.themeMode),
  ]);
  return settings;
};

export const useThemeMode = (): boolean => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
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
};

export const getCrudOverlay = async (): Promise<CrudOverlayState> => {
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
};

export const saveCrudOverlay = async (overlay: CrudOverlayState): Promise<void> => {
  await writeStorageItem(CRUD_OVERLAY_KEY, JSON.stringify(overlay));
};

export const resetLocalRecipeChanges = async (): Promise<void> => {
  await removeStorageItem(CRUD_OVERLAY_KEY);
};
