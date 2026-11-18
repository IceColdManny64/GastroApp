import Constants from 'expo-constants'; // Lee metadatos del host de Expo para detectar IP local en móvil
import { Platform } from 'react-native'; // Detecta si la app corre en web, android o ios
import { getToken } from './tokenStorage'; // Obtiene el token guardado para proteger acciones autenticadas

const SERVER_PORT = 3001; // Puerto fijo donde escucha el microservicio Node.js (server.js)
const REQUEST_TIMEOUT_MS = 2500; // Tiempo máximo de espera (2.5s) antes de pasar a respaldo offline

export function getApiBaseUrl(): string { // Calcula automáticamente la URL del microservicio JSON según plataforma
  if (Platform.OS === 'web') { // Si ejecutamos en navegador web
    if (typeof window !== 'undefined' && window.location?.hostname) { // Verifica existencia de window y hostname actual
      return `http://${window.location.hostname}:${SERVER_PORT}`; // Conecta al mismo host desde donde se abrió la web en puerto 3001
    } // Fin de verificación hostname Web
    return `http://localhost:${SERVER_PORT}`; // Respaldo en entorno Web sin hostname
  } // Fin de rama Web

  const hostUri = Constants.expoConfig?.hostUri; // En Expo Go móvil contiene "IP_DE_TU_PC:8081"
  if (hostUri) { // Si Expo proporcionó la IP de red local
    const host = hostUri.split(':')[0]; // Separa solo la dirección IP quitando el puerto de Metro
    if (host) { // Comprueba que el host extraído no esté vacío
      return `http://${host}:${SERVER_PORT}`; // Apunta hacia el server.js corriendo en tu computadora por Wi-Fi
    } // Fin de verificación host válido
  } // Fin de verificación hostUri

  if (Platform.OS === 'android') { // En emulador Android donde localhost apunta al teléfono virtual
    return `http://10.0.2.2:${SERVER_PORT}`; // IP puente especial del emulador Android hacia la PC anfitriona
  } // Fin de rama Android

  return `http://localhost:${SERVER_PORT}`; // Respaldo final estándar para simulador iOS
} // Fin de getApiBaseUrl

export const API_BASE_URL = getApiBaseUrl(); // Exporta la URL base resuelta al cargar la aplicación

export class ApiError extends Error { // Error personalizado que distingue fallos HTTP del servidor vs falta de red
  status: number; // Código HTTP recibido (ej. 404, 409) o 0 si hubo desconexión
  isNetworkError: boolean; // True solo cuando el servidor está apagado o inalcanzable

  constructor(message: string, status: number = 400, isNetworkError: boolean = false) { // Constructor de ApiError
    super(message); // Llama al constructor base Error con el mensaje legible
    this.name = 'ApiError'; // Etiqueta identificadora del error
    this.status = status; // Guarda el código de estado HTTP
    this.isNetworkError = isNetworkError; // Guarda si fue error de conexión o respuesta HTTP real
  } // Fin del constructor
} // Fin de clase ApiError

export async function apiRequest<T>( // Helper central para enviar peticiones HTTP JSON hacia server.js
  path: string, // Ruta relativa del endpoint (ej. "/api/recipes")
  options: RequestInit = {} // Opciones fetch opcionales (method, body, headers)
): Promise<T> { // Promesa tipada con el JSON devuelto por el servidor
  const controller = new AbortController(); // Controlador estándar para cancelar la petición si excede timeout
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS); // Temporizador que aborta tras 2.5 segundos

  try { // Intenta realizar la comunicación HTTP
    const headers: Record<string, string> = { // Construye cabecera indicando contenido JSON
      'Content-Type': 'application/json', // Informa a server.js que el cuerpo viaja en JSON
      ...((options.headers as Record<string, string>) || {}), // Combina cabeceras extra si las hubiera
    }; // Fin de cabeceras

    const res = await fetch(`${getApiBaseUrl()}${path}`, { // Lanza petición HTTP al microservicio
      ...options, // Propaga método y cuerpo
      headers, // Adjunta cabeceras JSON
      signal: controller.signal, // Vincula señal de cancelación por timeout
    }); // Espera respuesta del servidor

    const text = await res.text(); // Lee el cuerpo crudo como texto para evitar error si viene vacío
    let parsed: any = null; // Variable para almacenar el JSON parseado
    if (text) { // Si el servidor envió contenido en el cuerpo
      try { // Intenta decodificarlo como JSON
        parsed = JSON.parse(text); // Convierte texto JSON en objeto JavaScript
      } catch { // Si el cuerpo no fuera JSON válido
        parsed = null; // Deja parsed en null sin lanzar crash
      } // Fin de try/catch de parseo
    } // Fin de verificación text

    if (!res.ok) { // Si el código HTTP fue 4xx o 5xx (ej. 400, 404, 409)
      const errorMessage = // Extrae mensaje legible enviado por el servidor
        parsed?.error || parsed?.message || `Error del servidor (${res.status})`; // Prioriza campos error/message o muestra código
      throw new ApiError(errorMessage, res.status, false); // Lanza ApiError con isNetworkError=false para NO ocultarlo
    } // Fin de verificación !res.ok

    return parsed as T; // Retorna los datos tipados cuando HTTP fue 2xx
  } catch (err) { // Captura tanto ApiError HTTP como fallos de red o timeout
    if (err instanceof ApiError) { // Si ya era un ApiError del servidor (404/409/400)
      throw err; // Lo relanza intacto hacia el servicio que lo llamó
    } // Fin de verificación ApiError
    const msg = // Construye mensaje ante fallo de red o aborto por timeout
      err instanceof Error // Comprueba si es instancia Error estándar
        ? err.message // Toma mensaje técnico de red
        : 'No se pudo conectar con el servidor local.'; // Mensaje amigable de respaldo
    throw new ApiError(msg, 0, true); // Marca isNetworkError=true para que los servicios activen respaldo offline
  } finally { // Se ejecuta siempre al final (éxito o error)
    clearTimeout(timeoutId); // Cancela el temporizador pendiente para evitar fugas de memoria
  } // Fin de try/catch/finally
} // Fin de apiRequest

export async function fetchWithAuth<T>( // Helper de respaldo que exige sesión activa antes de ejecutar una acción
  action: () => Promise<T> | T // Función protegida a ejecutar tras comprobar token
): Promise<T> { // Retorna el resultado de la acción
  const token = await getToken(); // Consulta token almacenado en dispositivo
  if (!token) { // Si no existe sesión iniciada
    throw new ApiError( // Lanza error 401 no autorizado
      'Sesión no encontrada. Por favor inicia sesión nuevamente.', // Mensaje en español para el usuario
      401, // Código HTTP 401 Unauthorized
      false // No es fallo de red, es falta de sesión
    ); // Fin de ApiError
  } // Fin de verificación token
  return await action(); // Ejecuta y devuelve la acción protegida
} // Fin de fetchWithAuth
