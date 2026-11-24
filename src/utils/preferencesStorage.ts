import * as SecureStore from 'expo-secure-store'; // Almacenamiento cifrado nativo en Android e iOS
import { useEffect, useState } from 'react'; // Hooks React para construir el hook reactivo de tema oscuro
import { Platform } from 'react-native'; // Identifica plataforma Web vs Móvil
import { UserSettings } from '@/types/Auth'; // Interfaz de configuración del usuario
import { RecipeItem } from '@/types/RecipeItem'; // Modelo de receta guardado en caché local
import { getUserSession } from './tokenStorage'; // Obtiene ID de usuario para aislar favoritos y ajustes por cuenta

const FAVORITES_PREFIX = 'gastrolab_favorites_'; // Prefijo por usuario para lista de IDs favoritos
const SETTINGS_PREFIX = 'gastrolab_settings_'; // Prefijo por usuario para preferencias personalizadas
const GLOBAL_THEME_KEY = 'gastrolab_global_theme'; // Clave global compartida para recordar claro/oscuro desde el arranque
const LOCAL_RECIPES_KEY = 'gastrolab_local_recipes'; // Clave de caché local de recetas (respaldo sin server.js)
const USERS_STORAGE_KEY = 'gastrolab_local_users'; // Clave de respaldo local de usuarios sin conexión

export interface LocalUserRecord { // Estructura interna de cada cuenta almacenada
  id: number; // ID numérico único de usuario
  email: string; // Correo registrado
  password: string; // Contraseña de la cuenta
} // Fin de interfaz LocalUserRecord

export const DEFAULT_LOCAL_USERS: LocalUserRecord[] = [ // Usuario administrador inicial para respaldo offline
  { // Objeto cuenta por defecto
    id: 1, // ID inicial 1
    email: 'admin@gastrolab.com', // Correo predeterminado de acceso
    password: '1234', // Contraseña predeterminada de acceso
  }, // Fin de usuario por defecto
]; // Fin de DEFAULT_LOCAL_USERS

export const DEFAULT_USER_SETTINGS: UserSettings = { // Preferencias iniciales antes de personalizar en Ajustes
  itemsPerPage: 10, // Muestra 10 recetas por página por defecto
  themeMode: 'light', // Inicia en Modo Claro por defecto
  defaultCategory: 'Todas', // Inicia mostrando todas las categorías
  compactCards: false, // Tarjetas completas por defecto
}; // Fin de DEFAULT_USER_SETTINGS

const memoryCache: Record<string, string> = {}; // Caché en memoria RAM para acelerar lecturas y respaldar errores de disco
let cachedThemeMode: 'light' | 'dark' = 'light'; // Último tema conocido compartido en memoria entre todas las pantallas
let themeInitialized = false; // Evita leer settings desde disco repetidamente en cada componente montado
const themeListeners = new Set<(mode: 'light' | 'dark') => void>(); // Suscriptores activos de useThemeMode() para repintado en vivo

function isWebStorageAvailable(): boolean { // Verifica si corre en navegador Web con localStorage utilizable
  return Platform.OS === 'web' && typeof localStorage !== 'undefined'; // Retorna true solo en navegador
} // Fin de isWebStorageAvailable

const notifyThemeListeners = (mode: 'light' | 'dark') => { // Emite cambio de tema claro/oscuro a toda la app al instante
  cachedThemeMode = mode; // Actualiza tema global en memoria
  themeInitialized = true; // Marca que el tema real ya fue cargado
  themeListeners.forEach((listener) => { // Recorre cada pantalla/layout suscrito con useThemeMode()
    try { // Protege contra listeners desmontados
      listener(mode); // Actualiza el estado local del componente para repintar en vivo
    } catch (err) { // Captura fallo inesperado de algún listener
      console.warn('[preferencesStorage.ts] Error en listener de tema:', err); // Advierte sin romper al resto
    } // Fin try/catch listener
  }); // Fin de forEach
}; // Fin de notifyThemeListeners

const CHUNK_SIZE = 1800; // Tamaño seguro por bloque (< 2048 bytes) para no exceder límite de SecureStore en móvil

async function readStorageItem(key: string): Promise<string | null> { // Lee un texto largo soportando chunks en móvil y localStorage en Web
  try { // Protege lectura ante fallos de plataforma
    if (isWebStorageAvailable()) { // En Web lee directamente de localStorage
      const value = localStorage.getItem(key); // Obtiene valor o null
      if (value !== null) memoryCache[key] = value; // Refresca RAM si existía valor
      return value; // Retorna lo encontrado
    } // Fin de rama Web
    if (memoryCache[key] !== undefined) { // En móvil usa memoria RAM si ya se leyó en esta sesión
      return memoryCache[key]; // Retorna inmediato sin esperar disco
    } // Fin de verificación RAM
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}__chunks`); // Comprueba si el dato se dividió en fragmentos
    if (chunkCountRaw) { // Si existe conteo de fragmentos
      const count = Number(chunkCountRaw); // Convierte cantidad de bloques a número
      if (Number.isFinite(count) && count > 0) { // Verifica número positivo válido
        const parts: string[] = []; // Arreglo para unir cada pedazo en orden
        for (let i = 0; i < count; i++) { // Recorre cada índice de bloque
          const part = await SecureStore.getItemAsync(`${key}__chunk_${i}`); // Lee fragmento i
          if (part !== null) parts.push(part); // Agrega fragmento si existe
        } // Fin de ciclo for chunks
        const joined = parts.join(''); // Reconstruye la cadena JSON original completa
        memoryCache[key] = joined; // Guarda en memoria RAM para futuras lecturas rápidas
        return joined; // Retorna cadena reconstruida
      } // Fin de verificación count válido
    } // Fin de verificación chunkCountRaw
    const value = await SecureStore.getItemAsync(key); // Si no estaba fragmentado, lee clave simple
    if (value !== null) memoryCache[key] = value; // Cachea en RAM
    return value ?? null; // Retorna valor o null
  } catch (err) { // Ante fallo de SecureStore/localStorage
    console.warn(`[preferencesStorage.ts] Fallback a memoria al leer ${key}:`, err); // Advierte en consola
    return memoryCache[key] ?? null; // Devuelve respaldo RAM si existiera
  } // Fin de try/catch
} // Fin de readStorageItem

async function writeStorageItem(key: string, value: string): Promise<void> { // Escribe valores dividiendo automáticamente en chunks en móvil
  memoryCache[key] = value; // Actualiza respaldo RAM al instante
  try { // Protege escritura en disco
    if (isWebStorageAvailable()) { // En Web guarda directo en localStorage
      localStorage.setItem(key, value); // Persiste clave completa
      return; // Termina flujo Web
    } // Fin de rama Web
    if (value.length <= CHUNK_SIZE) { // Si cabe en un solo bloque de SecureStore
      await SecureStore.deleteItemAsync(`${key}__chunks`); // Borra metadato viejo de fragmentos por si antes era largo
      await SecureStore.setItemAsync(key, value); // Guarda valor único en SecureStore
    } else { // Si excede 1800 caracteres (ej. lista completa de recetas en caché)
      const chunks = Math.ceil(value.length / CHUNK_SIZE); // Calcula cantidad de pedazos necesarios
      for (let i = 0; i < chunks; i++) { // Recorre bloque por bloque
        const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE); // Corta porción de 1800 caracteres
        await SecureStore.setItemAsync(`${key}__chunk_${i}`, slice); // Guarda bloque individual cifrado
      } // Fin de escritura de bloques
      await SecureStore.setItemAsync(`${key}__chunks`, String(chunks)); // Registra cuántos bloques reconstruir al leer
    } // Fin de rama chunking
  } catch (err) { // Si SecureStore falla por cuota o permisos
    console.warn(`[preferencesStorage.ts] Fallback a memoria al guardar ${key}:`, err); // Conserva dato en memoria RAM
  } // Fin de try/catch
} // Fin de writeStorageItem

async function removeStorageItem(key: string): Promise<void> { // Elimina una clave junto con todos sus chunks asociados
  delete memoryCache[key]; // Borra entrada de caché en memoria RAM
  try { // Protege borrado en disco
    if (isWebStorageAvailable()) { // En Web borra clave simple
      localStorage.removeItem(key); // Elimina entrada de localStorage
    } else { // En móvil limpia tanto chunks posibles como la clave directa
      const chunkCountRaw = await SecureStore.getItemAsync(`${key}__chunks`); // Revisa si tenía fragmentos guardados
      if (chunkCountRaw) { // Si había fragmentos previos
        const count = Number(chunkCountRaw); // Total de bloques a eliminar
        for (let i = 0; i < count; i++) { // Recorre cada índice
          await SecureStore.deleteItemAsync(`${key}__chunk_${i}`); // Borra bloque individual
        } // Fin ciclo borrado chunks
        await SecureStore.deleteItemAsync(`${key}__chunks`); // Borra contador de bloques
      } // Fin de limpieza chunks
      await SecureStore.deleteItemAsync(key); // Borra clave principal
    } // Fin de rama móvil
  } catch (err) { // Ante error eliminando
    console.warn(`[preferencesStorage.ts] Error eliminando ${key}:`, err); // Registra advertencia en consola
  } // Fin de try/catch
} // Fin de removeStorageItem

async function getUserKeySuffix(): Promise<string> { // Obtiene el ID del usuario actual para separar sus datos
  const session = await getUserSession(); // Consulta sesión activa
  return session?.id ? String(session.id) : 'guest'; // Usa su ID numérico o 'guest' si aún no hay sesión
} // Fin de getUserKeySuffix

export async function getFavorites(): Promise<number[]> { // Obtiene el arreglo de IDs marcados como favoritos ♥
  const suffix = await getUserKeySuffix(); // Determina sufijo del usuario activo
  const raw = await readStorageItem(`${FAVORITES_PREFIX}${suffix}`); // Lee lista guardada para esa cuenta
  if (!raw) return []; // Si nunca guardó favoritos devuelve arreglo vacío
  try { // Parsea arreglo JSON de IDs
    const parsed = JSON.parse(raw); // Convierte texto JSON a estructura JS
    if (Array.isArray(parsed)) { // Verifica que sea arreglo válido
      return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id)); // Normaliza a números finitos válidos
    } // Fin validación array
  } catch (err) { // Si JSON estuviera corrupto
    console.warn('[preferencesStorage.ts] Error parseando favoritos:', err); // Advierte sin romper la app
  } // Fin try/catch
  return []; // Respaldo vacío
} // Fin de getFavorites

export async function toggleFavorite(recipeId: number): Promise<number[]> { // Agrega o quita un ID de favoritos ♥
  const suffix = await getUserKeySuffix(); // Obtiene identificador de cuenta activa
  const current = await getFavorites(); // Lee lista actual de favoritos
  const numericId = Number(recipeId); // Normaliza ID a tipo número
  const exists = current.includes(numericId); // Comprueba si ya estaba marcado
  const updated = exists // Construye lista nueva agregando o removiendo
    ? current.filter((id) => id !== numericId) // Si existía lo remueve del arreglo
    : [...current, numericId]; // Si no existía lo añade al final

  await writeStorageItem(`${FAVORITES_PREFIX}${suffix}`, JSON.stringify(updated)); // Persiste lista actualizada
  return updated; // Devuelve nueva lista para actualizar icono al instante
} // Fin de toggleFavorite

export async function removeFavorite(recipeId: number): Promise<void> { // Quita un ID específico de favoritos tras eliminar receta
  const suffix = await getUserKeySuffix(); // Cuenta activa
  const current = await getFavorites(); // Lista actual de favoritos
  const numericId = Number(recipeId); // ID numérico eliminado
  if (!current.includes(numericId)) return; // Si no estaba en favoritos no hace escritura innecesaria
  const updated = current.filter((id) => id !== numericId); // Filtra excluyendo la receta borrada
  await writeStorageItem(`${FAVORITES_PREFIX}${suffix}`, JSON.stringify(updated)); // Guarda lista limpia
} // Fin de removeFavorite

export async function getUserSettings(): Promise<UserSettings> { // Lee ajustes de paginación, tema, categoría y compactación
  const suffix = await getUserKeySuffix(); // Sufijo por usuario
  const [raw, globalTheme] = await Promise.all([ // Lee en paralelo ajustes del usuario y tema global
    readStorageItem(`${SETTINGS_PREFIX}${suffix}`), // Preferencias de la cuenta actual
    readStorageItem(GLOBAL_THEME_KEY), // Último tema global usado (claro/oscuro)
  ]); // Fin de lectura paralela

  const fallbackTheme: 'light' | 'dark' = // Determina tema de respaldo si la cuenta aún no guardó ajustes
    globalTheme === 'dark' ? 'dark' : 'light'; // Oscuro si globalTheme es 'dark', si no claro

  if (!raw) { // Si el usuario nunca ha entrado a Ajustes todavía
    const defaults: UserSettings = { // Arma objeto con valores por defecto
      ...DEFAULT_USER_SETTINGS, // Copia tamaño 10, categoría Todas y compactCards false
      themeMode: fallbackTheme, // Hereda tema global activo
    }; // Fin defaults
    notifyThemeListeners(defaults.themeMode); // Sincroniza tema con todas las pantallas
    return defaults; // Retorna defaults
  } // Fin de verificación sin ajustes previos

  try { // Parsea ajustes guardados validando valores permitidos
    const parsed = JSON.parse(raw) as Partial<UserSettings>; // Decodifica JSON parcial
    const validPageSize = // Garantiza que itemsPerPage sea estrictamente 10, 20 o 30
      parsed.itemsPerPage === 10 || parsed.itemsPerPage === 20 || parsed.itemsPerPage === 30 // Comprueba opciones válidas
        ? parsed.itemsPerPage // Usa valor guardado si es válido
        : DEFAULT_USER_SETTINGS.itemsPerPage; // Si no, usa 10 por defecto
    const resolvedTheme: 'light' | 'dark' = // Resuelve tema válido claro u oscuro
      parsed.themeMode === 'dark' // ¿Es oscuro?
        ? 'dark' // Asigna 'dark'
        : parsed.themeMode === 'light' // ¿Es claro?
          ? 'light' // Asigna 'light'
          : fallbackTheme; // Si faltaba, usa fallback global

    const settings: UserSettings = { // Construye objeto UserSettings completo y limpio
      itemsPerPage: validPageSize, // Tamaño validado
      themeMode: resolvedTheme, // Tema resuelto
      defaultCategory: parsed.defaultCategory || 'Todas', // Categoría inicial o 'Todas'
      compactCards: Boolean(parsed.compactCards), // Booleano estricto para tarjetas compactas
    }; // Fin de objeto settings
    notifyThemeListeners(settings.themeMode); // Notifica tema actual a componentes escuchando
    return settings; // Retorna configuración final
  } catch (err) { // Si JSON estaba dañado
    console.warn('[preferencesStorage.ts] Error parseando settings:', err); // Advierte en consola
    return { ...DEFAULT_USER_SETTINGS, themeMode: fallbackTheme }; // Retorna configuración segura
  } // Fin try/catch
} // Fin de getUserSettings

export async function saveUserSettings(settings: UserSettings): Promise<UserSettings> { // Guarda preferencias y actualiza tema global en vivo
  const suffix = await getUserKeySuffix(); // Obtiene cuenta activa
  notifyThemeListeners(settings.themeMode); // Cambia el tema de TODAS las pantallas al instante antes de esperar disco
  await Promise.all([ // Guarda en paralelo ajustes por usuario y tema global
    writeStorageItem(`${SETTINGS_PREFIX}${suffix}`, JSON.stringify(settings)), // Persiste objeto UserSettings de la cuenta
    writeStorageItem(GLOBAL_THEME_KEY, settings.themeMode), // Guarda tema global para pantallas públicas (Login/Registro)
  ]); // Fin de escritura paralela
  return settings; // Devuelve settings confirmados
} // Fin de saveUserSettings

export function useThemeMode(): boolean { // Hook React que retorna true en Modo Oscuro y actualiza pantallas en tiempo real
  const [mode, setMode] = useState<'light' | 'dark'>(() => { // Inicialización síncrona en Web para evitar parpadeo blanco
    if (isWebStorageAvailable()) { // Si corre en navegador Web
      const storedGlobal = localStorage.getItem(GLOBAL_THEME_KEY); // Lee tema global al instante sin await
      if (storedGlobal === 'dark' || storedGlobal === 'light') { // Si había un valor guardado válido
        cachedThemeMode = storedGlobal; // Sincroniza variable en memoria
        return storedGlobal; // Arranca directamente en ese tema desde el primer pixel
      } // Fin de verificación tema guardado
    } // Fin de rama Web
    return cachedThemeMode; // Usa último tema conocido en memoria
  }); // Fin de estado inicial

  useEffect(() => { // Suscribe este componente al conjunto global themeListeners
    const listener = (nextMode: 'light' | 'dark') => { // Callback ejecutado cada vez que cambia el tema en Ajustes
      setMode(nextMode); // Re-renderiza la pantalla con los estilos oscuros o claros
    }; // Fin listener
    themeListeners.add(listener); // Registra la suscripción mientras el componente viva

    if (!themeInitialized) { // Si aún no se han leído ajustes iniciales desde storage asíncrono (móvil)
      getUserSettings().catch(() => {}); // Dispara lectura inicial ignorando errores silenciosos
    } else { // Si ya estaba inicializado
      setMode(cachedThemeMode); // Sincroniza estado si cambió antes de montar
    } // Fin de verificación themeInitialized

    return () => { // Limpieza automática al desmontar la pantalla o componente
      themeListeners.delete(listener); // Remueve listener para evitar fugas de memoria
    }; // Fin cleanup
  }, []); // Solo se suscribe una vez al montar

  return mode === 'dark'; // Devuelve booleano simple isDark para usar directo en estilos
} // Fin de useThemeMode

export async function getLocalRecipes(): Promise<RecipeItem[] | null> { // Lee arreglo caché de recetas para respaldo sin conexión
  const raw = await readStorageItem(LOCAL_RECIPES_KEY); // Obtiene JSON serializado de recetas locales
  if (!raw) return null; // Devuelve null si todavía no se ha guardado respaldo
  try { // Decodifica JSON de caché
    const parsed = JSON.parse(raw); // Convierte texto a arreglo JS
    return Array.isArray(parsed) ? (parsed as RecipeItem[]) : null; // Verifica que sea un arreglo válido
  } catch (err) { // Si fallara parseo
    console.warn('[preferencesStorage.ts] Error parseando recetas locales:', err); // Advierte en consola
    return null; // Retorna null para volver a sembrar desde recipesData
  } // Fin try/catch
} // Fin de getLocalRecipes

export async function saveLocalRecipes(recipes: RecipeItem[]): Promise<void> { // Guarda copia actualizada de recetas en caché del dispositivo
  await writeStorageItem(LOCAL_RECIPES_KEY, JSON.stringify(recipes)); // Serializa arreglo único limpio
} // Fin de saveLocalRecipes

export async function resetLocalRecipeChanges(): Promise<void> { // Borra la caché local de recetas (botón Restablecer en Ajustes)
  await removeStorageItem(LOCAL_RECIPES_KEY); // Al limpiar, la app recarga fresco desde recipes.json o la semilla base
} // Fin de resetLocalRecipeChanges

export async function getLocalUsers(): Promise<LocalUserRecord[]> { // Lee usuarios en caché local o inicializa con admin por defecto
  const raw = await readStorageItem(USERS_STORAGE_KEY); // Lee lista de usuarios del dispositivo
  if (!raw) { // Si es primera ejecución y no existe copia local
    await writeStorageItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_LOCAL_USERS)); // Inicializa con admin@gastrolab.com / 1234
    return [...DEFAULT_LOCAL_USERS]; // Retorna copia nueva del usuario inicial
  } // Fin de inicialización
  try { // Decodifica usuarios locales
    const parsed = JSON.parse(raw); // Parsea JSON
    if (Array.isArray(parsed) && parsed.length > 0) { // Valida arreglo no vacío
      return parsed.map((u) => ({ // Normaliza tipos exactos por seguridad
        id: Number(u.id), // Fuerza id numérico
        email: String(u.email || '').trim(), // Limpia espacios de correo
        password: String(u.password || ''), // Conserva contraseña como texto
      })); // Fin de map normalizador
    } // Fin de validación longitud
  } catch (err) { // Ante JSON inválido
    console.warn('[preferencesStorage.ts] Error parseando usuarios locales:', err); // Advierte en consola
  } // Fin try/catch
  return [...DEFAULT_LOCAL_USERS]; // Fallback seguro al administrador predeterminado
} // Fin de getLocalUsers

export async function saveLocalUsers(users: LocalUserRecord[]): Promise<void> { // Guarda arreglo actualizado de usuarios en caché local
  await writeStorageItem(USERS_STORAGE_KEY, JSON.stringify(users)); // Serializa y persiste en dispositivo
} // Fin de saveLocalUsers
