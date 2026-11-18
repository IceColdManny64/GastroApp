# 03 — Modelos de Datos, Adaptadores de Tipos y Reglas de Validación

## 1. Esquema de Datos del Catálogo (`src/data/recipes.json`)

Cada registro almacenado en `src/data/recipes.json` (y en el respaldo `INITIAL_RECIPES_DATA`) tiene la siguiente estructura:

```json
{
  "id": 1,
  "title": "Un manjar de italia: la pizza",
  "description": "Descubre algo mas sobre este manjar!",
  "imageURL": "https://assets.tmecosys.com/image/upload/...",
  "preparetime": "01:00:00",
  "likerate": 90,
  "category": "Italianas",
  "difficulty": "Facil"
}
```

### Valores del Dominio en el Catálogo
- **Categorías (`category`):** `"Mexicanas"`, `"Italianas"`, `"Estadounidenses"`, `"Orientales"`, `"Saludables"`, `"Postres"`.
- **Dificultades (`difficulty`):** `"Muy facil"`, `"Facil"`, `"Medio"`, `"Dificil"`.
- **Tiempo de preparación (`preparetime`):** Cadena en formato `HH:MM:SS` (ej. `"00:20:00"`, `"01:00:00"`, `"01:30:00"`).
- **Porcentaje de aprobación (`likerate`):** Valor entero entre `0` y `100`.

---

## 2. Interfaces TypeScript (`src/types/RecipeItem.ts` y `src/types/Auth.ts`)

### 2.1 `src/types/RecipeItem.ts`

```typescript
export type RecipeCategory =
  | 'Todas'
  | 'Mexicanas'
  | 'Italianas'
  | 'Estadounidenses'
  | 'Orientales'
  | 'Saludables'
  | 'Postres';

export type RecipeDifficulty =
  | 'Todas'
  | 'Muy facil'
  | 'Facil'
  | 'Medio'
  | 'Dificil';

// Objeto de datos crudo del catálogo base
export interface RawRecipeDto {
  id: number | string;
  title: string;
  description: string;
  imageURL?: string;
  image?: string;
  preparetime?: string;
  likerate?: number | string;
  category?: string;
  difficulty?: string;
}

// Modelo normalizado que utilizan todas las pantallas y componentes
export interface RecipeItem {
  id: number;
  title: string;
  description: string;
  image: string;          // URI de imagen lista para <Image source={{ uri: item.image }} />
  imageURL: string;       // URL de imagen original o seleccionada
  prepareTime: string;    // Formato HH:MM:SS (ej. "00:45:00")
  likeRate: number;       // Siempre tipo number entre 0 y 100
  category: string;       // Ej. "Mexicanas", "Italianas", "Orientales", etc.
  difficulty: string;     // Ej. "Muy facil", "Facil", "Medio", "Dificil"
}

export interface RecipeFormPayload {
  title: string;
  description: string;
  imageUri: string;
  prepareTime: string;
  likeRate: number;
  category: string;
  difficulty: string;
}

export type SortOption = 'default' | 'likes_desc' | 'time_asc' | 'title_asc';

export interface RecipeFilterState {
  searchQuery: string;
  category: RecipeCategory;
  difficulty: RecipeDifficulty;
  sortBy: SortOption;
  onlyFavorites: boolean;
}
```

### 2.2 `src/types/Auth.ts`

```typescript
export interface LoginSuccessResponse {
  login: 'success' | 'failed';
  id?: number;
  email?: string;
  message?: string;
  error?: string;
}

export interface RegisterResponse {
  store?: 'success';
  error?: string;
}

export interface UpdateCredentialsResponse {
  status: 'success' | 'error';
  message?: string;
  exists?: boolean;
  valid?: boolean;
  id?: number;
  affected_rows?: number;
}

export interface UserSession {
  id: number;
  email: string;
  token: string;
}

export type PageSizeOption = 10 | 20 | 30;

export interface UserSettings {
  itemsPerPage: PageSizeOption;
  themeMode: 'light' | 'dark';
  defaultCategory: RecipeCategory;
  compactCards: boolean;
}
```

---

## 3. Función Adaptadora y Normalización de Tipos (`adaptRecipeDtoToItem`)

El módulo `src/services/recipes.ts` debe definir y utilizar una función adaptadora que convierta cualquier `RawRecipeDto` en un `RecipeItem` con tipos estrictamente verificados:

```typescript
export const DEFAULT_RECIPE_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';

export const adaptRecipeDtoToItem = (raw: RawRecipeDto): RecipeItem => {
  const numericId = Number(raw.id);
  const parsedLikes = Number(raw.likerate);
  const cleanImage = (raw.imageURL || raw.image || DEFAULT_RECIPE_IMAGE).trim();

  return {
    id: Number.isFinite(numericId) && numericId > 0 ? numericId : Date.now(),
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Receta sin título',
    description:
      typeof raw.description === 'string' && raw.description.trim()
        ? raw.description.trim()
        : 'Sin descripción disponible.',
    image: cleanImage,
    imageURL: cleanImage,
    prepareTime:
      typeof raw.preparetime === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(raw.preparetime.trim())
        ? raw.preparetime.trim()
        : '00:30:00',
    likeRate:
      Number.isFinite(parsedLikes) && parsedLikes >= 0 && parsedLikes <= 100
        ? Math.round(parsedLikes)
        : 85,
    category:
      typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : 'Mexicanas',
    difficulty:
      typeof raw.difficulty === 'string' && raw.difficulty.trim() ? raw.difficulty.trim() : 'Facil',
  };
};
```

---

## 4. Especificación del Motor de Validaciones (`src/utils/validators.ts`)

Todas las entradas del usuario deben validarse antes de guardar cambios o iniciar sesión, verificando tanto **campos de texto obligatorios** como **tipos de datos y rangos**.

### 4.1 Validaciones de Login y Registro (`validateAuthForm`)
- **Correo electrónico (`email`):**
  - Verificación de tipo y obligatoriedad: `typeof email === 'string' && email.trim().length > 0`.
  - Verificación de formato mediante expresión regular: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
  - Mensaje de error en español latino: `"Por favor ingresa un correo electrónico válido."`.
- **Contraseña (`password`):**
  - Obligatoria: `typeof password === 'string' && password.trim().length > 0`.
  - En registro y actualización de credenciales: mínimo 4 caracteres.
  - Mensaje de error: `"La contraseña es obligatoria y debe tener al menos 4 caracteres."`.

### 4.2 Validaciones del Formulario de Receta (`validateRecipeForm`)
En `src/app/form.tsx`, antes de guardar se deben validar los siguientes campos y reglas de tipo:

1. **Título (`title`):**
   - Texto obligatorio (`!title.trim()`), longitud mínima de 3 caracteres y máxima de 80 caracteres.
   - Mensaje: `"El título es obligatorio (mínimo 3 caracteres)."`.
2. **Descripción (`description`):**
   - Texto obligatorio (`!description.trim()`), longitud mínima de 10 caracteres.
   - Mensaje: `"La descripción es obligatoria (mínimo 10 caracteres)."`.
3. **Imagen (`imageUri`):**
   - Obligatoria (`!imageUri || !imageUri.trim()`).
   - Mensaje: `"Debes seleccionar una imagen de la galería o ingresar una URL válida."`.
4. **Tiempo de preparación (`prepareTime`):**
   - Obligatorio y con formato `HH:MM:SS` (`/^\d{2}:[0-5]\d:[0-5]\d$/`).
   - Mensaje: `"El tiempo de preparación debe tener el formato HH:MM:SS (ejemplo: 00:45:00)."`.
5. **Calificación / Porcentaje de aprobación (`likeRate`):**
   - Verificación estricta de tipo numérico entero entre `0` y `100`.
   - Mensaje: `"La calificación debe ser un número entero entre 0 y 100."`.
6. **Categoría (`category`) y Dificultad (`difficulty`):**
   - Obligatorios; deben coincidir con las opciones válidas del catálogo.
