import { RecipeCategory } from './RecipeItem'; // Importa el tipo de categoría válido para ajustes de usuario

export interface LoginSuccessResponse { // Formato esperado de respuesta al iniciar sesión
  login: 'success' | 'failed'; // Estado de resultado del intento de login
  id?: number; // Identificador opcional del usuario autenticado
  email?: string; // Correo opcional devuelto en la respuesta
  message?: string; // Mensaje descriptivo del resultado
  error?: string; // Mensaje de error si la autenticación falló
} // Fin de interfaz LoginSuccessResponse

export interface RegisterResponse { // Formato esperado al registrar una cuenta nueva
  store?: 'success'; // Bandera que indica almacenamiento exitoso
  error?: string; // Mensaje de error en caso de duplicado o fallo
} // Fin de interfaz RegisterResponse

export interface UpdateCredentialsResponse { // Respuesta estandarizada para verificación y cambio de cuenta
  status: 'success' | 'error'; // Indica si la operación terminó bien o falló
  message?: string; // Mensaje amigable para mostrar al usuario
  valid?: boolean; // Bandera usada al validar contraseña actual
  affected_rows?: number; // Cantidad de registros modificados (1 si actualizó)
  error?: string; // Descripción del error en caso de fallo
} // Fin de interfaz UpdateCredentialsResponse

export interface UserProfileResponse { // Datos públicos básicos del perfil de usuario
  id: number | string; // ID numérico o textual del usuario
  email: string; // Correo electrónico registrado
  password?: string; // Contraseña opcional usada internamente en validación local
  error?: string; // Error si no se encontró el perfil
} // Fin de interfaz UserProfileResponse

export interface UserSession { // Objeto completo guardado en dispositivo para la sesión activa
  id: number; // ID del usuario conectado
  email: string; // Correo activo mostrado en Configuración
  token: string; // Token único generado al iniciar sesión
} // Fin de interfaz UserSession

export type PageSizeOption = 10 | 20 | 30; // Opciones permitidas de recetas por página en el paginador

export interface UserSettings { // Preferencias visuales y de catálogo persistentes por usuario
  itemsPerPage: PageSizeOption; // Cantidad elegida de tarjetas por página (10, 20 o 30)
  themeMode: 'light' | 'dark'; // Tema seleccionado de la aplicación (claro u oscuro)
  defaultCategory: RecipeCategory; // Categoría seleccionada automáticamente al abrir Home
  compactCards: boolean; // Si es true, reduce la altura de las tarjetas
} // Fin de interfaz UserSettings
