import { UpdateCredentialsResponse, UserProfileResponse } from '../types/Auth'; // Interfaces de respuesta de perfil y credenciales
import { ApiError, apiRequest } from '../utils/api'; // Cliente HTTP para comunicarse con server.js (/api/users)
import { // Importa helpers de caché local para usuarios
  getLocalUsers, // Lee respaldo local de cuentas
  LocalUserRecord, // Estructura { id, email, password }
  saveLocalUsers, // Guarda respaldo local actualizado
} from '../utils/preferencesStorage'; // Módulo de almacenamiento de preferencias
import { getToken } from '../utils/tokenStorage'; // Valida que exista token activo antes de leer perfil

async function loadUsersList(): Promise<LocalUserRecord[]> { // Carga lista de usuarios desde server.js o caché offline
  try { // Intenta leer desde el microservicio JSON
    const serverUsers = await apiRequest<LocalUserRecord[]>('/api/users'); // Solicita GET /api/users
    if (Array.isArray(serverUsers) && serverUsers.length > 0) { // Si trajo usuarios válidos
      await saveLocalUsers(serverUsers); // Refresca el respaldo local en dispositivo
      return serverUsers; // Retorna lista fresca de users.json
    } // Fin de validación de respuesta
  } catch (err) { // Captura errores de red o HTTP
    if (err instanceof ApiError && !err.isNetworkError) { // Si fue error real devuelto por servidor
      throw err; // No oculta fallos HTTP reales
    } // Fin de verificación error servidor
  } // Fin de try/catch
  return await getLocalUsers(); // Respaldo offline cuando el servidor no responde
} // Fin de loadUsersList

export async function getUserProfile(userId: number): Promise<UserProfileResponse> { // Obtiene id y correo de un usuario por ID
  const token = await getToken(); // Verifica sesión iniciada en dispositivo
  if (!token) { // Si no hay token válido
    throw new Error('Sesión no encontrada. Por favor inicia sesión nuevamente.'); // Exige reautenticación
  } // Fin de guardia de token

  try { // Intenta pedir el usuario específico al servidor JSON
    const user = await apiRequest<LocalUserRecord>(`/api/users/${Number(userId)}`); // Solicita GET /api/users/:id
    return { id: user.id, email: user.email }; // Retorna solo datos de perfil sin exponer clave innecesariamente
  } catch (err) { // Maneja error de red o 404
    if (err instanceof ApiError && !err.isNetworkError) { // Si el servidor respondió 404 (no existe)
      throw new Error(err.message); // Lanza mensaje de usuario no encontrado
    } // Fin de verificación error HTTP
  } // Fin de try/catch

  const users = await getLocalUsers(); // En modo offline busca en lista local
  const found = users.find((u) => Number(u.id) === Number(userId)); // Compara por ID numérico
  if (!found) { // Si tampoco existe localmente
    throw new Error('Usuario no encontrado.'); // Lanza error descriptivo
  } // Fin de verificación encontrado

  return { // Retorna perfil desde caché local
    id: found.id, // ID encontrado
    email: found.email, // Correo encontrado
  }; // Fin de objeto perfil
} // Fin de getUserProfile

export async function verifyEmail( // Comprueba si un correo existe para habilitar recuperación de contraseña
  currentEmail: string // Correo ingresado en el formulario "¿Olvidaste tu contraseña?"
): Promise<UpdateCredentialsResponse> { // Devuelve objeto con exists: true/false y el id asociado
  const normalized = currentEmail.trim().toLowerCase(); // Normaliza correo en minúsculas sin espacios
  const users = await loadUsersList(); // Obtiene usuarios de users.json (o caché)
  const found = users.find((u) => u.email.toLowerCase() === normalized); // Busca coincidencia por correo

  if (found) { // Si encontró cuenta con ese correo
    return { // Retorna éxito e ID para el segundo paso de cambio de clave
      status: 'success', // Estado positivo
      exists: true, // Confirma existencia del correo
      id: found.id, // Entrega el ID del usuario al formulario de Login
    }; // Fin de respuesta afirmativa
  } // Fin de rama encontrado

  return { // Si no existe ninguna cuenta con ese correo
    status: 'success', // Respuesta controlada sin fallo de red
    exists: false, // Indica que no fue hallado
    message: 'Email no encontrado', // Mensaje informativo
  }; // Fin de respuesta negativa
} // Fin de verifyEmail

export async function verifyPassword( // Confirma que la contraseña actual sea correcta antes de modificar cuenta
  userId: number, // ID del usuario autenticado en Ajustes
  currentPassword: string // Contraseña actual escrita para confirmar identidad
): Promise<UpdateCredentialsResponse> { // Devuelve valid: true/false
  const users = await loadUsersList(); // Lee listado actualizado de usuarios
  const found = users.find((u) => Number(u.id) === Number(userId)); // Localiza al usuario por ID

  if (!found) { // Si el usuario no existe en registros
    throw new Error('Usuario no encontrado.'); // Falla explícitamente
  } // Fin de verificación usuario

  const valid = found.password === currentPassword; // Compara estrictamente la contraseña actual guardada
  return { // Retorna resultado de validación
    status: 'success', // Operación completada
    valid, // True si coincidió, false si es errónea
    message: valid ? 'Contraseña válida' : 'Contraseña incorrecta', // Mensaje claro según resultado
  }; // Fin de retorno verifyPassword
} // Fin de verifyPassword

export async function updateCredentials( // Actualiza correo electrónico y/o contraseña del usuario
  userId: number, // ID numérico del usuario a modificar
  newEmail: string, // Nuevo correo electrónico deseado
  newPassword: string // Nueva contraseña (o la actual si se conservó igual)
): Promise<UpdateCredentialsResponse> { // Devuelve confirmación del cambio
  const cleanEmail = newEmail.trim(); // Limpia espacios del correo nuevo
  const normalizedEmail = cleanEmail.toLowerCase(); // Normaliza para revisar duplicados offline
  const numericId = Number(userId); // Asegura ID numérico

  try { // Intenta guardar el cambio directo en src/data/users.json vía server.js
    const updated = await apiRequest<LocalUserRecord>(`/api/users/${numericId}`, { // Petición PUT /api/users/:id
      method: 'PUT', // Verbo HTTP de actualización
      body: JSON.stringify({ email: cleanEmail, password: newPassword }), // Envía nuevo correo y contraseña en JSON
    }); // Espera usuario actualizado devuelto por server.js

    const localUsers = await getLocalUsers(); // Lee respaldo local en dispositivo
    const existsLocally = localUsers.some((u) => Number(u.id) === numericId); // Verifica si ya estaba en caché
    const nextUsers = existsLocally // Reemplaza o añade el usuario actualizado en la caché local
      ? localUsers.map((u) => (Number(u.id) === numericId ? updated : u)) // Actualiza el elemento coincidente
      : [...localUsers, updated]; // Lo agrega si faltaba en caché
    await saveLocalUsers(nextUsers); // Persiste respaldo local sincronizado

    return { // Retorna respuesta de éxito al formulario
      status: 'success', // Estado exitoso
      message: 'Credenciales actualizadas correctamente', // Texto amigable en español
      affected_rows: 1, // Simula 1 registro actualizado
    }; // Fin de retorno exitoso
  } catch (err) { // Captura errores del servidor o falta de conexión
    if (err instanceof ApiError && !err.isNetworkError) { // Si server.js rechazó por correo repetido (409) o usuario inexistente (404)
      throw new Error(err.message); // Propaga el error real a Ajustes o Login
    } // Fin de manejo error servidor
  } // Fin de try/catch

  const users = await getLocalUsers(); // Fallback offline si server.js está apagado
  const userIndex = users.findIndex((u) => Number(u.id) === numericId); // Busca posición en arreglo local
  if (userIndex === -1) { // Si no existe el usuario localmente
    throw new Error('Usuario no encontrado.'); // Lanza error descriptivo
  } // Fin de verificación índice

  const emailTakenByOther = users.some( // Revisa si el correo nuevo ya lo usa otra cuenta distinta
    (u) => Number(u.id) !== numericId && u.email.toLowerCase() === normalizedEmail // Excluye al usuario actual
  ); // Fin de validación duplicado
  if (emailTakenByOther) { // Si otra cuenta ya tiene ese correo
    throw new Error('Ese correo electrónico ya está en uso por otra cuenta.'); // Impide colisión de correos
  } // Fin de verificación correo ocupado

  users[userIndex] = { // Actualiza el registro en memoria local
    ...users[userIndex], // Conserva ID y propiedades previas
    email: cleanEmail, // Asigna correo nuevo
    password: newPassword, // Asigna contraseña nueva
  }; // Fin de actualización de objeto
  await saveLocalUsers(users); // Guarda la lista local actualizada

  return { // Retorna éxito desde respaldo offline
    status: 'success', // Estado exitoso
    message: 'Credenciales actualizadas correctamente', // Mensaje de confirmación
    affected_rows: 1, // 1 fila actualizada
  }; // Fin de retorno offline
} // Fin de updateCredentials

export const verifyUserEmail = verifyEmail; // Alias de compatibilidad de nombre
export const verifyUserPassword = verifyPassword; // Alias de compatibilidad de nombre
export const updateUserCredentials = updateCredentials; // Alias de compatibilidad de nombre
