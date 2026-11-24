import { VALID_RECIPE_CATEGORIES, VALID_RECIPE_DIFFICULTIES } from '../types/RecipeItem'; // Listas válidas del catálogo para comprobar selección

export interface ValidationResult { // Resultado unificado que devuelven todas las funciones validadoras
  isValid: boolean; // True si todos los campos pasaron las reglas
  errorMessage: string | null; // Primer error encontrado para mostrar alerta rápida
  fieldErrors: Record<string, string>; // Diccionario campo -> mensaje para pintar error debajo de cada input
} // Fin de interfaz ValidationResult

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Exige texto + @ + dominio + punto + extensión
const TIME_REGEX = /^\d{2}:[0-5]\d:[0-5]\d$/; // Exige formato exacto HH:MM:SS con minutos y segundos 00..59

export const isValidEmail = (email: string): boolean => { // Valida si una cadena tiene estructura válida de correo
  return typeof email === 'string' && email.trim().length > 0 && EMAIL_REGEX.test(email.trim()); // Revisa tipo string, no vacío y regex
}; // Fin de isValidEmail

export const validateAuthForm = ( // Valida formularios de Login y Registro
  email: string, // Correo escrito por el usuario
  password: string, // Contraseña escrita por el usuario
  options?: { isRegister?: boolean; confirmPassword?: string } // Opciones extra cuando se usa en Registro
): ValidationResult => { // Devuelve resumen booleano y errores por campo
  const fieldErrors: Record<string, string> = {}; // Acumula errores individuales por campo

  if (typeof email !== 'string' || email.trim().length === 0 || !EMAIL_REGEX.test(email.trim())) { // Comprueba validez de correo
    fieldErrors.email = 'Por favor ingresa un correo electrónico válido.'; // Mensaje de error en español para email
  } // Fin de validación email

  const minPasswordLen = options?.isRegister ? 4 : 1; // En Registro exige mínimo 4 caracteres; en Login al menos 1
  if ( // Comprueba tipo texto, no vacío y longitud mínima requerida
    typeof password !== 'string' || // Debe ser string
    password.trim().length === 0 || // No puede estar en blanco
    password.trim().length < minPasswordLen // Cumple longitud mínima
  ) { // Abre bloque de error de password
    fieldErrors.password = // Asigna error al campo contraseña
      'La contraseña es obligatoria y debe tener al menos 4 caracteres.'; // Texto descriptivo para usuario
  } // Fin de validación password

  if (options?.isRegister && options.confirmPassword !== undefined) { // En Registro compara además ambas contraseñas
    if (options.confirmPassword.trim().length === 0 || password !== options.confirmPassword) { // Revisa vacío o diferencia exacta
      fieldErrors.confirmPassword = 'Las contraseñas no coinciden.'; // Marca error de confirmación
    } // Fin de comparación contraseñas
  } // Fin de verificación confirmación Registro

  const firstError = Object.values(fieldErrors)[0] || null; // Extrae el primer mensaje de error para banner/alerta
  return { // Devuelve objeto ValidationResult
    isValid: Object.keys(fieldErrors).length === 0, // Válido solo si no hubo ningún error
    errorMessage: firstError, // Primer mensaje o null
    fieldErrors, // Mapa completo de errores por campo
  }; // Fin de retorno validateAuthForm
}; // Fin de validateAuthForm

export interface RecipeFormInput { // Entrada cruda proveniente de los inputs del formulario de receta
  title: string; // Título escrito
  description: string; // Descripción escrita
  imageUri: string | null; // Imagen elegida de galería o URL
  prepareTime: string; // Tiempo escrito como texto
  likeRateInput: string; // Porcentaje escrito como texto en TextInput
  category: string; // Categoría seleccionada
  difficulty: string; // Dificultad seleccionada
} // Fin de interfaz RecipeFormInput

export const validateRecipeForm = (input: RecipeFormInput): ValidationResult => { // Valida textos obligatorios y tipos de receta
  const fieldErrors: Record<string, string> = {}; // Mapa de errores por campo del formulario

  const cleanTitle = typeof input.title === 'string' ? input.title.trim() : ''; // Limpia espacios del título
  if (!cleanTitle || cleanTitle.length < 3) { // Exige mínimo 3 caracteres reales
    fieldErrors.title = 'El título es obligatorio (mínimo 3 caracteres).'; // Error título muy corto o vacío
  } else if (cleanTitle.length > 80) { // Límite superior de 80 caracteres
    fieldErrors.title = 'El título no puede superar los 80 caracteres.'; // Error título demasiado largo
  } // Fin de validación title

  const cleanDescription = typeof input.description === 'string' ? input.description.trim() : ''; // Limpia espacios de descripción
  if (!cleanDescription || cleanDescription.length < 10) { // Exige mínimo 10 caracteres para describir pasos/ingredientes
    fieldErrors.description = 'La descripción es obligatoria (mínimo 10 caracteres).'; // Error descripción insuficiente
  } // Fin de validación description

  if (!input.imageUri || typeof input.imageUri !== 'string' || !input.imageUri.trim()) { // Exige imagen de galería o URL
    fieldErrors.imageUri = 'Debes seleccionar una imagen de la galería o ingresar una URL válida.'; // Error falta fotografía
  } // Fin de validación imageUri

  const cleanTime = typeof input.prepareTime === 'string' ? input.prepareTime.trim() : ''; // Limpia formato de tiempo
  if (!cleanTime || !TIME_REGEX.test(cleanTime)) { // Valida formato estricto HH:MM:SS
    fieldErrors.prepareTime = // Error de formato temporal
      'El tiempo de preparación debe tener el formato HH:MM:SS (ejemplo: 00:45:00).'; // Ejemplo claro para el usuario
  } // Fin de validación prepareTime

  const rawRate = typeof input.likeRateInput === 'string' ? input.likeRateInput.trim() : ''; // Texto de calificación ingresada
  const parsedRate = Number(rawRate); // Convierte string de TextInput a tipo number
  const isValidRate = // Verifica estrictamente que sea entero válido entre 0 y 100
    rawRate !== '' && // No permite cadena vacía (Number('') daría 0 engañosamente)
    !Number.isNaN(parsedRate) && // Rechaza letras como "abc"
    Number.isInteger(parsedRate) && // Rechaza decimales como "90.5"
    parsedRate >= 0 && // Mínimo permitido 0
    parsedRate <= 100; // Máximo permitido 100

  if (!isValidRate) { // Si falló cualquiera de las verificaciones numéricas
    fieldErrors.likeRate = 'La calificación debe ser un número entero entre 0 y 100.'; // Marca error en calificación
  } // Fin de validación likeRate

  if (!input.category || !VALID_RECIPE_CATEGORIES.includes(input.category.trim())) { // Comprueba categoría en lista permitida
    fieldErrors.category = 'Selecciona una categoría válida del catálogo.'; // Marca error de categoría
  } // Fin de validación category

  if (!input.difficulty || !VALID_RECIPE_DIFFICULTIES.includes(input.difficulty.trim())) { // Comprueba dificultad en lista permitida
    fieldErrors.difficulty = 'Selecciona un nivel de dificultad válido.'; // Marca error de dificultad
  } // Fin de validación difficulty

  const firstError = Object.values(fieldErrors)[0] || null; // Obtiene primer error para alertas
  return { // Devuelve resultado completo de validación
    isValid: Object.keys(fieldErrors).length === 0, // True solo si todos los campos son válidos
    errorMessage: firstError, // Primer mensaje de error o null
    fieldErrors, // Errores por campo
  }; // Fin de retorno validateRecipeForm
}; // Fin de validateRecipeForm

export const validateCredentialsForm = ( // Valida cambio de correo y contraseña en Ajustes
  currentPassword: string, // Contraseña actual requerida para confirmar identidad
  newEmail: string, // Correo nuevo a guardar
  newPassword: string // Contraseña nueva (o actual cuando se conserva igual)
): ValidationResult => { // Retorna resultado de validación
  const fieldErrors: Record<string, string> = {}; // Acumula errores encontrados

  if (typeof currentPassword !== 'string' || currentPassword.trim().length === 0) { // Exige contraseña actual no vacía
    fieldErrors.currentPassword = 'Debes ingresar tu contraseña actual para confirmar.'; // Error falta contraseña actual
  } // Fin de validación currentPassword

  if (!isValidEmail(newEmail)) { // Valida formato del correo nuevo
    fieldErrors.newEmail = 'Por favor ingresa un correo electrónico válido.'; // Error correo inválido
  } // Fin de validación newEmail

  if (typeof newPassword !== 'string' || newPassword.trim().length < 4) { // Exige mínimo 4 caracteres en la clave efectiva
    fieldErrors.newPassword = // Marca error en nueva contraseña
      'La contraseña es obligatoria y debe tener al menos 4 caracteres.'; // Mensaje descriptivo
  } // Fin de validación newPassword

  const firstError = Object.values(fieldErrors)[0] || null; // Primer error encontrado
  return { // Devuelve objeto ValidationResult
    isValid: Object.keys(fieldErrors).length === 0, // Válido si no hubo errores
    errorMessage: firstError, // Mensaje resumen o null
    fieldErrors, // Detalle de errores por campo
  }; // Fin de retorno validateCredentialsForm
}; // Fin de validateCredentialsForm
