import { VALID_RECIPE_CATEGORIES, VALID_RECIPE_DIFFICULTIES } from '../types/RecipeItem';

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^\d{2}:[0-5]\d:[0-5]\d$/;

export const isValidEmail = (email: string): boolean => {
  return typeof email === 'string' && email.trim().length > 0 && EMAIL_REGEX.test(email.trim());
};

export const validateAuthForm = (
  email: string,
  password: string,
  options?: { isRegister?: boolean; confirmPassword?: string }
): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  if (typeof email !== 'string' || email.trim().length === 0 || !EMAIL_REGEX.test(email.trim())) {
    fieldErrors.email = 'Por favor ingresa un correo electrónico válido.';
  }

  const minPasswordLen = options?.isRegister ? 4 : 1;
  if (
    typeof password !== 'string' ||
    password.trim().length === 0 ||
    password.trim().length < minPasswordLen
  ) {
    fieldErrors.password =
      'La contraseña es obligatoria y debe tener al menos 4 caracteres.';
  }

  if (options?.isRegister && options.confirmPassword !== undefined) {
    if (options.confirmPassword.trim().length === 0 || password !== options.confirmPassword) {
      fieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }
  }

  const firstError = Object.values(fieldErrors)[0] || null;
  return {
    isValid: Object.keys(fieldErrors).length === 0,
    errorMessage: firstError,
    fieldErrors,
  };
};

export interface RecipeFormInput {
  title: string;
  description: string;
  imageUri: string | null;
  prepareTime: string;
  likeRateInput: string;
  category: string;
  difficulty: string;
}

export const validateRecipeForm = (input: RecipeFormInput): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  const cleanTitle = typeof input.title === 'string' ? input.title.trim() : '';
  if (!cleanTitle || cleanTitle.length < 3) {
    fieldErrors.title = 'El título es obligatorio (mínimo 3 caracteres).';
  } else if (cleanTitle.length > 80) {
    fieldErrors.title = 'El título no puede superar los 80 caracteres.';
  }

  const cleanDescription = typeof input.description === 'string' ? input.description.trim() : '';
  if (!cleanDescription || cleanDescription.length < 10) {
    fieldErrors.description = 'La descripción es obligatoria (mínimo 10 caracteres).';
  }

  if (!input.imageUri || typeof input.imageUri !== 'string' || !input.imageUri.trim()) {
    fieldErrors.imageUri = 'Debes seleccionar una imagen de la galería o ingresar una URL válida.';
  }

  const cleanTime = typeof input.prepareTime === 'string' ? input.prepareTime.trim() : '';
  if (!cleanTime || !TIME_REGEX.test(cleanTime)) {
    fieldErrors.prepareTime =
      'El tiempo de preparación debe tener el formato HH:MM:SS (ejemplo: 00:45:00).';
  }

  const rawRate = typeof input.likeRateInput === 'string' ? input.likeRateInput.trim() : '';
  const parsedRate = Number(rawRate);
  const isValidRate =
    rawRate !== '' &&
    !Number.isNaN(parsedRate) &&
    Number.isInteger(parsedRate) &&
    parsedRate >= 0 &&
    parsedRate <= 100;

  if (!isValidRate) {
    fieldErrors.likeRate = 'La calificación debe ser un número entero entre 0 y 100.';
  }

  if (!input.category || !VALID_RECIPE_CATEGORIES.includes(input.category.trim())) {
    fieldErrors.category = 'Selecciona una categoría válida del catálogo.';
  }

  if (!input.difficulty || !VALID_RECIPE_DIFFICULTIES.includes(input.difficulty.trim())) {
    fieldErrors.difficulty = 'Selecciona un nivel de dificultad válido.';
  }

  const firstError = Object.values(fieldErrors)[0] || null;
  return {
    isValid: Object.keys(fieldErrors).length === 0,
    errorMessage: firstError,
    fieldErrors,
  };
};

export const validateCredentialsForm = (
  currentPassword: string,
  newEmail: string,
  newPassword: string
): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  if (typeof currentPassword !== 'string' || currentPassword.trim().length === 0) {
    fieldErrors.currentPassword = 'Debes ingresar tu contraseña actual para confirmar.';
  }

  if (!isValidEmail(newEmail)) {
    fieldErrors.newEmail = 'Por favor ingresa un correo electrónico válido.';
  }

  if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    fieldErrors.newPassword =
      'La contraseña es obligatoria y debe tener al menos 4 caracteres.';
  }

  const firstError = Object.values(fieldErrors)[0] || null;
  return {
    isValid: Object.keys(fieldErrors).length === 0,
    errorMessage: firstError,
    fieldErrors,
  };
};
