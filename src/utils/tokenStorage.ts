import * as SecureStore from 'expo-secure-store'; // Almacenamiento cifrado nativo de Expo para Android e iOS
import { Platform } from 'react-native'; // Detecta si la app se ejecuta en navegador Web o móvil
import { UserSession } from '@/types/Auth'; // Interfaz { id, email, token } de sesión de usuario

const TOKEN_KEY = 'auth_token'; // Clave fija bajo la cual se guarda el token de acceso
const SESSION_KEY = 'gastrolab_user_session'; // Clave fija para guardar el objeto JSON completo de sesión

let tokenInMemory: string | null = null; // Respaldo temporal en RAM por si falla el storage del dispositivo
let sessionInMemory: UserSession | null = null; // Respaldo temporal en RAM de la sesión completa

function isWebStorageAvailable(): boolean { // Guardiana que verifica disponibilidad segura de localStorage en Web
  return Platform.OS === 'web' && typeof localStorage !== 'undefined'; // Evita errores cuando Expo compila o pre-renderiza en Node
} // Fin de isWebStorageAvailable

export async function saveToken(token: string): Promise<void> { // Guarda únicamente el token de sesión activo
  tokenInMemory = token; // Actualiza respaldo en RAM inmediatamente
  try { // Protege escritura en almacenamiento persistente
    if (isWebStorageAvailable()) { // Si corre en navegador con localStorage
      localStorage.setItem(TOKEN_KEY, token); // Guarda token en localStorage del navegador
      return; // Termina flujo Web
    } // Fin de rama Web

    await SecureStore.setItemAsync(TOKEN_KEY, token); // En Android/iOS guarda cifrado con SecureStore
  } catch (err) { // Si el storage fallara (ej. modo privado estricto)
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar token:', err); // Avisa sin detener la app gracias al respaldo RAM
  } // Fin de try/catch
} // Fin de saveToken

export async function getToken(): Promise<string | null> { // Recupera el token de sesión actual o null si no existe
  try { // Intenta leer desde almacenamiento persistente
    if (isWebStorageAvailable()) { // Si está en navegador Web
      const stored = localStorage.getItem(TOKEN_KEY); // Lee clave "auth_token" de localStorage
      if (stored) tokenInMemory = stored; // Sincroniza copia en RAM si encontró valor
      return stored ?? tokenInMemory; // Devuelve lo leído o el respaldo RAM
    } // Fin de rama Web

    const stored = await SecureStore.getItemAsync(TOKEN_KEY); // En móvil lee desde SecureStore
    if (stored) tokenInMemory = stored; // Sincroniza copia en RAM
    return stored ?? tokenInMemory; // Devuelve token o null
  } catch (err) { // Si falló la lectura en disco
    console.warn('[tokenStorage.ts] Usando token en memoria:', err); // Advierte en consola
    return tokenInMemory; // Devuelve copia en RAM si existe
  } // Fin de try/catch
} // Fin de getToken

export async function saveUserSession(session: UserSession): Promise<void> { // Guarda sesión completa (id, email y token)
  sessionInMemory = session; // Actualiza sesión en memoria RAM
  tokenInMemory = session.token; // Actualiza token en memoria RAM
  const serialized = JSON.stringify(session); // Convierte objeto UserSession a texto JSON para poder guardarlo
  try { // Intenta guardar en almacenamiento persistente
    if (isWebStorageAvailable()) { // Si corre en Web
      localStorage.setItem(SESSION_KEY, serialized); // Guarda JSON completo de sesión
      localStorage.setItem(TOKEN_KEY, session.token); // Guarda token suelto para lecturas rápidas
      return; // Termina flujo Web
    } // Fin de rama Web

    await SecureStore.setItemAsync(SESSION_KEY, serialized); // Guarda sesión cifrada en móvil
    await SecureStore.setItemAsync(TOKEN_KEY, session.token); // Guarda token cifrado en móvil
  } catch (err) { // Si falla escritura en storage
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar sesión:', err); // Continúa operando con memoria RAM
  } // Fin de try/catch
} // Fin de saveUserSession

export async function getUserSession(): Promise<UserSession | null> { // Recupera la sesión activa completa del usuario
  try { // Intenta leer sesión serializada
    let raw: string | null = null; // Variable para texto JSON recuperado
    if (isWebStorageAvailable()) { // En Web lee localStorage
      raw = localStorage.getItem(SESSION_KEY); // Obtiene JSON de sesión
    } else { // En móvil lee SecureStore
      raw = await SecureStore.getItemAsync(SESSION_KEY); // Obtiene JSON cifrado
    } // Fin de rama lectura por plataforma
    if (raw) { // Si encontró sesión guardada
      sessionInMemory = JSON.parse(raw) as UserSession; // Reconstruye objeto UserSession y refresca caché RAM
      return sessionInMemory; // Retorna sesión completa
    } // Fin de verificación raw
  } catch (err) { // Si falló lectura o JSON.parse
    console.warn('[tokenStorage.ts] Usando sesión en memoria:', err); // Advierte en consola
  } // Fin de try/catch

  if (sessionInMemory) { // Si ya existía en memoria RAM en esta ejecución
    return sessionInMemory; // Retorna respaldo en memoria
  } // Fin de verificación RAM

  const token = await getToken(); // Último recurso: si solo existe token, extrae el ID embebido en él
  if (token) { // Comprueba si hay token activo
    const match = /^gastrolab-token-(\d+)-/.exec(token); // Extrae el ID numérico del formato "gastrolab-token-{id}-..."
    if (match && match[1]) { // Si encontró un ID válido dentro del token
      sessionInMemory = { // Reconstruye sesión mínima con ese ID para no bloquear Configuración
        id: Number(match[1]), // ID numérico recuperado del token
        email: '', // El correo se rellena después desde getUserProfile
        token, // Conserva token activo
      }; // Fin de sesión recuperada
      return sessionInMemory; // Retorna sesión recuperada
    } // Fin de verificación regex
  } // Fin de verificación token

  return null; // Retorna null si realmente no hay ninguna sesión activa
} // Fin de getUserSession

export async function deleteToken(): Promise<void> { // Cierra sesión borrando token y sesión del dispositivo
  tokenInMemory = null; // Limpia token en memoria RAM
  sessionInMemory = null; // Limpia sesión en memoria RAM
  try { // Intenta borrar claves del almacenamiento físico
    if (isWebStorageAvailable()) { // En Web limpia localStorage
      localStorage.removeItem(TOKEN_KEY); // Elimina token
      localStorage.removeItem(SESSION_KEY); // Elimina JSON de sesión
      return; // Termina limpieza Web
    } // Fin de rama Web

    await SecureStore.deleteItemAsync(TOKEN_KEY); // Elimina token de SecureStore móvil
    await SecureStore.deleteItemAsync(SESSION_KEY); // Elimina sesión de SecureStore móvil
  } catch (err) { // Si hubiera fallo limpiando
    console.warn('[tokenStorage.ts] Error limpiando storage:', err); // Registra advertencia en consola
  } // Fin de try/catch
} // Fin de deleteToken

export const removeToken = deleteToken; // Alias mantenido por compatibilidad con llamadas anteriores
