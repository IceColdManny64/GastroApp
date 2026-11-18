import { ApiError, apiRequest } from './api'; // Importa cliente HTTP y clase de error para detectar modo offline
import { // Importa helpers de caché local de usuarios en dispositivo
  getLocalUsers, // Lee usuarios guardados localmente si no hay conexión con server.js
  LocalUserRecord, // Interfaz { id, email, password }
  saveLocalUsers, // Actualiza la copia local de usuarios en almacenamiento del dispositivo
} from './preferencesStorage'; // Desde utilidades de preferencias
import { saveUserSession } from './tokenStorage'; // Guarda el token y sesión activa al autenticarse

async function fetchUsersWithFallback(): Promise<LocalUserRecord[]> { // Obtiene usuarios desde users.json (server.js) o respaldo local
  try { // Intenta consultar primero al microservicio JSON en puerto 3001
    const serverUsers = await apiRequest<LocalUserRecord[]>('/api/users'); // Solicita GET /api/users a server.js
    if (Array.isArray(serverUsers) && serverUsers.length > 0) { // Comprueba que devolvió una lista válida no vacía
      await saveLocalUsers(serverUsers); // Actualiza la caché local con los usuarios reales del servidor
      return serverUsers; // Devuelve la lista actualizada de users.json
    } // Fin de verificación de arreglo no vacío
  } catch (err) { // Si ocurrió error en la petición
    if (err instanceof ApiError && !err.isNetworkError) { // Si fue rechazo real del servidor (no falta de red)
      throw err; // Propaga el error real hacia arriba
    } // Fin de verificación error de servidor
  } // Fin de bloque try/catch
  return await getLocalUsers(); // En modo sin conexión (server.js apagado), lee usuarios de caché local
} // Fin de fetchUsersWithFallback

export async function login(email: string, password: string): Promise<string> { // Valida credenciales y genera sesión activa
  const normalizedEmail = email.trim().toLowerCase(); // Limpia espacios y convierte el correo a minúsculas para comparar
  const users = await fetchUsersWithFallback(); // Carga la lista actual de cuentas disponibles

  const matchedUser = users.find( // Busca un usuario cuyo correo y contraseña coincidan exactamente
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password // Comparación insensible a mayúsculas en correo y exacta en clave
  ); // Fin de búsqueda de coincidencia

  if (!matchedUser) { // Si no encontró ninguna cuenta válida con esa combinación
    throw new Error('Correo o contraseña incorrectos'); // Lanza error descriptivo mostrado en login.tsx
  } // Fin de verificación de usuario encontrado

  const token = `gastrolab-token-${matchedUser.id}-${Date.now()}`; // Construye token único embebiendo el ID del usuario y timestamp
  await saveUserSession({ // Persiste sesión completa (id, email y token) en localStorage/SecureStore
    id: matchedUser.id, // Guarda el ID numérico del usuario autenticado
    email: matchedUser.email, // Guarda el correo registrado
    token, // Guarda el token recién generado
  }); // Fin de guardado de sesión

  return token; // Devuelve el token para completar redirección
} // Fin de login

export async function registerUser(email: string, password: string): Promise<void> { // Registra una cuenta nueva en users.json
  const cleanEmail = email.trim(); // Elimina espacios accidentales al principio o final del correo
  const normalizedEmail = cleanEmail.toLowerCase(); // Versión en minúsculas para detectar duplicados offline

  try { // Intenta registrar directamente en el microservicio server.js
    const created = await apiRequest<LocalUserRecord>('/api/users', { // Envía petición POST /api/users
      method: 'POST', // Verbo HTTP de creación
      body: JSON.stringify({ email: cleanEmail, password }), // Serializa correo y contraseña en JSON
    }); // Espera usuario creado con su ID asignado por server.js
    const localUsers = await getLocalUsers(); // Lee copia actual en caché
    await saveLocalUsers([ // Sincroniza caché local agregando el usuario nuevo sin duplicar IDs
      ...localUsers.filter((u) => Number(u.id) !== Number(created.id)), // Conserva usuarios anteriores distintos
      created, // Añade el registro creado por el servidor
    ]); // Fin de guardado en caché
    return; // Finaliza el registro exitosamente
  } catch (err) { // Si falló la petición POST
    if (err instanceof ApiError && !err.isNetworkError) { // Si el servidor respondió 409 (correo duplicado) o 400
      throw new Error(err.message); // Muestra el mensaje exacto del servidor en la UI
    } // Fin de propagación de error HTTP
  } // Fin de try/catch

  const users = await getLocalUsers(); // Fallback offline si server.js está apagado: lee lista local
  const alreadyExists = users.some((u) => u.email.toLowerCase() === normalizedEmail); // Revisa si el correo ya existía
  if (alreadyExists) { // Si el correo está repetido
    throw new Error('Este correo electrónico ya está registrado.'); // Rechaza registro duplicado en modo offline
  } // Fin de verificación de duplicado

  const nextId = // Calcula siguiente ID secuencial en modo sin conexión
    users.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1; // Suma 1 al ID más alto existente

  users.push({ // Añade el nuevo usuario al arreglo local
    id: nextId, // ID numérico secuencial
    email: cleanEmail, // Correo limpio ingresado
    password, // Contraseña elegida
  }); // Fin de inserción local
  await saveLocalUsers(users); // Persiste lista actualizada en almacenamiento del dispositivo
} // Fin de registerUser
