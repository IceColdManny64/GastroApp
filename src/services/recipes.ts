import { RecipeItem, RawRecipeDto, RecipeFormPayload } from '../types/RecipeItem';
import { fetchWithAuth } from '../utils/api';
import { getCrudOverlay, saveCrudOverlay } from '../utils/preferencesStorage';

const ENDPOINT = '/recipe.php';

export const DEFAULT_RECIPE_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';

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

export async function getRecipes(search?: string): Promise<RecipeItem[]> {
  const query = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const data = await fetchWithAuth<RawRecipeDto[]>(`${ENDPOINT}${query}`);
  console.log('[recipes.ts] Respuesta del backend:', data?.length);

  const overlay = await getCrudOverlay();
  const deletedSet = new Set(overlay.deletedRecipeIds.map((id) => Number(id)));

  const serverItems = Array.isArray(data)
    ? data
        .map(adaptRecipeDtoToItem)
        .filter((item) => !deletedSet.has(item.id))
        .map((item) => {
          const updated = overlay.updatedRecipesById[String(item.id)];
          return updated ? { ...item, ...updated, id: item.id } : item;
        })
    : [];

  const normalizedSearch = search?.trim().toLowerCase() || '';
  const localCreated = overlay.createdRecipes
    .filter((item) => !deletedSet.has(item.id))
    .map((item) => {
      const updated = overlay.updatedRecipesById[String(item.id)];
      return updated ? { ...item, ...updated, id: item.id } : item;
    })
    .filter((item) => {
      if (!normalizedSearch) return true;
      return (
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch)
      );
    });

  return [...localCreated, ...serverItems];
}

export async function getRecipe(id: number): Promise<RecipeItem> {
  const numericId = Number(id);
  const overlay = await getCrudOverlay();

  if (overlay.deletedRecipeIds.includes(numericId)) {
    throw new Error('La receta solicitada fue eliminada.');
  }

  const createdLocal = overlay.createdRecipes.find((item) => Number(item.id) === numericId);
  if (createdLocal) {
    const updatedLocal = overlay.updatedRecipesById[String(numericId)];
    return updatedLocal ? { ...createdLocal, ...updatedLocal, id: numericId } : createdLocal;
  }

  const data = await fetchWithAuth<RawRecipeDto>(`${ENDPOINT}?id=${numericId}`);
  const adapted = adaptRecipeDtoToItem(data);
  const updatedLocal = overlay.updatedRecipesById[String(numericId)];

  return updatedLocal ? { ...adapted, ...updatedLocal, id: numericId } : adapted;
}

export async function createRecipe(
  formData: FormData,
  payload: RecipeFormPayload
): Promise<RecipeItem> {
  await fetchWithAuth<unknown>(ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  const cleanImage = payload.imageUri.trim() || DEFAULT_RECIPE_IMAGE;
  const newRecipe: RecipeItem = {
    id: Date.now(),
    title: payload.title.trim(),
    description: payload.description.trim(),
    image: cleanImage,
    imageURL: cleanImage,
    prepareTime: payload.prepareTime.trim(),
    likeRate: Math.round(Number(payload.likeRate)),
    category: payload.category.trim(),
    difficulty: payload.difficulty.trim(),
  };

  const overlay = await getCrudOverlay();
  overlay.createdRecipes = [newRecipe, ...overlay.createdRecipes];
  await saveCrudOverlay(overlay);

  console.log('[recipes.ts] Receta creada exitosamente:', newRecipe.id);
  return newRecipe;
}

export async function updateRecipe(
  id: number,
  formData: FormData,
  payload: RecipeFormPayload
): Promise<RecipeItem> {
  const numericId = Number(id);

  await fetchWithAuth<unknown>(`${ENDPOINT}?id=${numericId}`, {
    method: 'PUT',
    body: formData,
  });

  const cleanImage = payload.imageUri.trim() || DEFAULT_RECIPE_IMAGE;
  const updatedItem: RecipeItem = {
    id: numericId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    image: cleanImage,
    imageURL: cleanImage,
    prepareTime: payload.prepareTime.trim(),
    likeRate: Math.round(Number(payload.likeRate)),
    category: payload.category.trim(),
    difficulty: payload.difficulty.trim(),
  };

  const overlay = await getCrudOverlay();
  overlay.updatedRecipesById[String(numericId)] = updatedItem;
  overlay.createdRecipes = overlay.createdRecipes.map((item) =>
    Number(item.id) === numericId ? updatedItem : item
  );
  await saveCrudOverlay(overlay);

  console.log('[recipes.ts] Receta actualizada exitosamente:', numericId);
  return updatedItem;
}

export async function deleteRecipe(id: number): Promise<void> {
  const numericId = Number(id);

  await fetchWithAuth<unknown>(`${ENDPOINT}?id=${numericId}`, {
    method: 'DELETE',
  });

  const overlay = await getCrudOverlay();
  if (!overlay.deletedRecipeIds.includes(numericId)) {
    overlay.deletedRecipeIds.push(numericId);
  }
  overlay.createdRecipes = overlay.createdRecipes.filter(
    (item) => Number(item.id) !== numericId
  );
  delete overlay.updatedRecipesById[String(numericId)];
  await saveCrudOverlay(overlay);

  console.log('[recipes.ts] Receta eliminada exitosamente:', numericId);
}
