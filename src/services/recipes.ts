import { INITIAL_RECIPES_DATA } from '../data/recipesData';
import { RecipeItem, RawRecipeDto, RecipeFormPayload } from '../types/RecipeItem';
import { ApiError, apiRequest } from '../utils/api';
import {
  getLocalRecipes,
  removeFavorite,
  saveLocalRecipes,
} from '../utils/preferencesStorage';
import { getToken } from '../utils/tokenStorage';

export const DEFAULT_RECIPE_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';

const ensureAuthenticated = async (): Promise<void> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Sesión no encontrada. Por favor inicia sesión nuevamente.');
  }
};

export const adaptRecipeDtoToItem = (raw: RawRecipeDto): RecipeItem => {
  const numericId = Number(raw.id);
  const parsedLikes = Number(raw.likerate);
  const cleanImage = (raw.imageURL || raw.image || DEFAULT_RECIPE_IMAGE).trim();

  return {
    id: Number.isFinite(numericId) && numericId > 0 ? numericId : Date.now(),
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : 'Receta sin título',
    description:
      typeof raw.description === 'string' && raw.description.trim()
        ? raw.description.trim()
        : 'Sin descripción disponible.',
    image: cleanImage,
    imageURL: cleanImage,
    prepareTime:
      typeof raw.preparetime === 'string' &&
      /^\d{2}:\d{2}(:\d{2})?$/.test(raw.preparetime.trim())
        ? raw.preparetime.trim()
        : '00:30:00',
    likeRate:
      Number.isFinite(parsedLikes) && parsedLikes >= 0 && parsedLikes <= 100
        ? Math.round(parsedLikes)
        : 85,
    category:
      typeof raw.category === 'string' && raw.category.trim()
        ? raw.category.trim()
        : 'Mexicanas',
    difficulty:
      typeof raw.difficulty === 'string' && raw.difficulty.trim()
        ? raw.difficulty.trim()
        : 'Facil',
  };
};

function toServerRecipeBody(payload: RecipeFormPayload) {
  const cleanImage = payload.imageUri.trim() || DEFAULT_RECIPE_IMAGE;
  return {
    title: payload.title.trim(),
    description: payload.description.trim(),
    imageURL: cleanImage,
    preparetime: payload.prepareTime.trim(),
    likerate: Math.round(Number(payload.likeRate)),
    category: payload.category.trim(),
    difficulty: payload.difficulty.trim(),
  };
}

function filterBySearch(items: RecipeItem[], search?: string): RecipeItem[] {
  const normalized = search?.trim().toLowerCase() || '';
  if (!normalized) return items;

  return items.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(normalized) ||
      recipe.description.toLowerCase().includes(normalized) ||
      recipe.category.toLowerCase().includes(normalized)
  );
}

async function getOfflineSeededRecipes(): Promise<RecipeItem[]> {
  const cached = await getLocalRecipes();
  if (cached && cached.length > 0) {
    return cached;
  }
  const seeded = INITIAL_RECIPES_DATA.map(adaptRecipeDtoToItem);
  await saveLocalRecipes(seeded);
  return seeded;
}

export async function getRecipes(search?: string): Promise<RecipeItem[]> {
  await ensureAuthenticated();
  const cleanSearch = search?.trim() || '';
  const query = cleanSearch ? `?search=${encodeURIComponent(cleanSearch)}` : '';

  try {
    const serverRecipes = await apiRequest<RawRecipeDto[]>(`/api/recipes${query}`);
    const adapted = Array.isArray(serverRecipes)
      ? serverRecipes.map(adaptRecipeDtoToItem)
      : [];
    if (!cleanSearch) {
      await saveLocalRecipes(adapted);
    }
    return adapted;
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw err;
    }
    console.warn('[recipes.ts] Servidor local no disponible, leyendo caché local.');
    const offline = await getOfflineSeededRecipes();
    return filterBySearch(offline, cleanSearch);
  }
}

export async function getRecipe(id: number): Promise<RecipeItem> {
  await ensureAuthenticated();
  const numericId = Number(id);

  try {
    const serverRecipe = await apiRequest<RawRecipeDto>(`/api/recipes/${numericId}`);
    return adaptRecipeDtoToItem(serverRecipe);
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw new Error(
        err.status === 404 ? 'No se encontró la receta solicitada.' : err.message
      );
    }
    const offline = await getOfflineSeededRecipes();
    const found = offline.find((item) => Number(item.id) === numericId);
    if (!found) {
      throw new Error('No se encontró la receta solicitada.');
    }
    return found;
  }
}

export async function createRecipe(
  payload: RecipeFormPayload
): Promise<RecipeItem> {
  await ensureAuthenticated();
  const body = toServerRecipeBody(payload);

  try {
    const createdDto = await apiRequest<RawRecipeDto>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const created = adaptRecipeDtoToItem(createdDto);

    const existing = await getOfflineSeededRecipes();
    await saveLocalRecipes([
      created,
      ...existing.filter((item) => Number(item.id) !== created.id),
    ]);

    return created;
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw err;
    }
    console.warn('[recipes.ts] Servidor local no disponible, guardando en caché local.');
    const existing = await getOfflineSeededRecipes();
    const maxId = existing.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    const localCreated = adaptRecipeDtoToItem({
      id: maxId + 1,
      ...body,
    });
    await saveLocalRecipes([localCreated, ...existing]);
    return localCreated;
  }
}

export async function updateRecipe(
  id: number,
  payload: RecipeFormPayload
): Promise<RecipeItem> {
  await ensureAuthenticated();
  const numericId = Number(id);
  const body = toServerRecipeBody(payload);

  try {
    const updatedDto = await apiRequest<RawRecipeDto>(`/api/recipes/${numericId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    const updated = adaptRecipeDtoToItem(updatedDto);

    const existing = await getOfflineSeededRecipes();
    await saveLocalRecipes(
      existing.map((item) => (Number(item.id) === numericId ? updated : item))
    );

    return updated;
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw err;
    }
    console.warn('[recipes.ts] Servidor local no disponible, actualizando caché local.');
    const existing = await getOfflineSeededRecipes();
    const targetExists = existing.some((item) => Number(item.id) === numericId);
    if (!targetExists) {
      throw new Error('No se encontró la receta solicitada para actualizar.');
    }
    const localUpdated = adaptRecipeDtoToItem({
      id: numericId,
      ...body,
    });
    await saveLocalRecipes(
      existing.map((item) => (Number(item.id) === numericId ? localUpdated : item))
    );
    return localUpdated;
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  await ensureAuthenticated();
  const numericId = Number(id);

  try {
    await apiRequest(`/api/recipes/${numericId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    if (err instanceof ApiError && !err.isNetworkError) {
      throw err;
    }
    console.warn('[recipes.ts] Servidor local no disponible, eliminando en caché local.');
  }

  const existing = await getOfflineSeededRecipes();
  await Promise.all([
    saveLocalRecipes(existing.filter((item) => Number(item.id) !== numericId)),
    removeFavorite(numericId),
  ]);
}
