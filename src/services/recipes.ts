import { INITIAL_RECIPES_DATA } from '../data/recipesData';
import { RecipeItem, RawRecipeDto, RecipeFormPayload } from '../types/RecipeItem';
import { getCrudOverlay, saveCrudOverlay } from '../utils/preferencesStorage';
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

export async function getRecipes(search?: string): Promise<RecipeItem[]> {
  await ensureAuthenticated();

  const overlay = await getCrudOverlay();
  const deletedSet = new Set(overlay.deletedRecipeIds.map((id) => Number(id)));
  const normalizedSearch = search?.trim().toLowerCase() || '';

  const baseItems = INITIAL_RECIPES_DATA.map(adaptRecipeDtoToItem)
    .filter((item) => !deletedSet.has(item.id))
    .map((item) => {
      const updated = overlay.updatedRecipesById[String(item.id)];
      return updated ? { ...item, ...updated, id: item.id } : item;
    });

  const baseIds = new Set(baseItems.map((item) => item.id));

  const localCreated = overlay.createdRecipes
    .filter((item) => !deletedSet.has(item.id) && !baseIds.has(item.id))
    .map((item) => {
      const updated = overlay.updatedRecipesById[String(item.id)];
      return updated ? { ...item, ...updated, id: item.id } : item;
    });

  const combined = [...localCreated, ...baseItems];

  if (!normalizedSearch) {
    console.log('[recipes.ts] Recetas cargadas en catálogo:', combined.length);
    return combined;
  }

  const filtered = combined.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch) ||
      item.category.toLowerCase().includes(normalizedSearch)
  );

  console.log('[recipes.ts] Recetas filtradas por búsqueda:', filtered.length);
  return filtered;
}

export async function getRecipe(id: number): Promise<RecipeItem> {
  await ensureAuthenticated();

  const numericId = Number(id);
  const overlay = await getCrudOverlay();

  if (overlay.deletedRecipeIds.includes(numericId)) {
    throw new Error('La receta solicitada fue eliminada.');
  }

  const createdLocal = overlay.createdRecipes.find(
    (item) => Number(item.id) === numericId
  );
  if (createdLocal) {
    const updatedLocal = overlay.updatedRecipesById[String(numericId)];
    return updatedLocal
      ? { ...createdLocal, ...updatedLocal, id: numericId }
      : createdLocal;
  }

  const rawFound = INITIAL_RECIPES_DATA.find(
    (item) => Number(item.id) === numericId
  );
  if (!rawFound) {
    throw new Error('No se encontró la receta solicitada.');
  }

  const adapted = adaptRecipeDtoToItem(rawFound);
  const updatedLocal = overlay.updatedRecipesById[String(numericId)];

  return updatedLocal ? { ...adapted, ...updatedLocal, id: numericId } : adapted;
}

export async function createRecipe(
  _formData: FormData,
  payload: RecipeFormPayload
): Promise<RecipeItem> {
  await ensureAuthenticated();

  const cleanImage = payload.imageUri.trim() || DEFAULT_RECIPE_IMAGE;
  const overlay = await getCrudOverlay();

  const maxExistingId = [
    ...INITIAL_RECIPES_DATA.map((r) => Number(r.id) || 0),
    ...overlay.createdRecipes.map((r) => Number(r.id) || 0),
  ].reduce((max, current) => Math.max(max, current), 30);

  const newRecipe: RecipeItem = {
    id: maxExistingId + 1,
    title: payload.title.trim(),
    description: payload.description.trim(),
    image: cleanImage,
    imageURL: cleanImage,
    prepareTime: payload.prepareTime.trim(),
    likeRate: Math.round(Number(payload.likeRate)),
    category: payload.category.trim(),
    difficulty: payload.difficulty.trim(),
  };

  overlay.createdRecipes = [newRecipe, ...overlay.createdRecipes];
  await saveCrudOverlay(overlay);

  console.log('[recipes.ts] Receta creada exitosamente:', newRecipe.id);
  return newRecipe;
}

export async function updateRecipe(
  id: number,
  _formData: FormData,
  payload: RecipeFormPayload
): Promise<RecipeItem> {
  await ensureAuthenticated();

  const numericId = Number(id);
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
  await ensureAuthenticated();

  const numericId = Number(id);
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
