import { INITIAL_RECIPES_DATA } from '../data/recipesData';
import { RecipeItem, RawRecipeDto, RecipeFormPayload } from '../types/RecipeItem';
import { getCrudOverlay, saveCrudOverlay } from '../utils/preferencesStorage';
import { getToken } from '../utils/tokenStorage';

const LOCAL_SERVER_URL = 'http://localhost:3001/api/recipes';

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

// Sincronizador de fondo con server.js para escribir en recipes.json
async function syncWithLocalJsonServer(
  method: 'POST' | 'PUT' | 'DELETE',
  data?: unknown,
  id?: number
): Promise<void> {
  try {
    const url = id ? `${LOCAL_SERVER_URL}/${id}` : LOCAL_SERVER_URL;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (res.ok) {
      console.log(`[recipes.ts] Sincronización exitosa con recipes.json (${method})`);
    }
  } catch (_e) {
    // Si el server local no está corriendo en ese momento, continúa sin bloquear la app
    console.log('[recipes.ts] Servidor local no conectado, cambio guardado en almacenamiento local.');
  }
}

export async function getRecipes(search?: string): Promise<RecipeItem[]> {
  await ensureAuthenticated();

  // Intenta leer las recetas más frescas desde el servidor local si está activo
  let currentBase: RawRecipeDto[] = INITIAL_RECIPES_DATA;
  try {
    const res = await fetch(LOCAL_SERVER_URL);
    if (res.ok) {
      const serverRecipes = await res.json();
      if (Array.isArray(serverRecipes) && serverRecipes.length > 0) {
        currentBase = serverRecipes;
      }
    }
  } catch (_e) {
    // Modo offline/local
  }

  const overlay = await getCrudOverlay();
  const deletedSet = new Set(overlay.deletedRecipeIds.map((id) => Number(id)));
  const normalizedSearch = search?.trim().toLowerCase() || '';

  const baseItems = currentBase.map(adaptRecipeDtoToItem).filter(
    (item) => !deletedSet.has(Number(item.id))
  );

  const localItems = overlay.createdRecipes.filter(
    (item) => !deletedSet.has(Number(item.id))
  );

  const allItems = [...localItems, ...baseItems].map((item) => {
    const updated = overlay.updatedRecipesById[String(item.id)];
    return updated ? { ...item, ...updated, id: item.id } : item;
  });

  const uniqueMap = new Map<number, RecipeItem>();
  allItems.forEach((recipe) => {
    const id = Number(recipe.id);
    if (!uniqueMap.has(id)) {
      uniqueMap.set(id, recipe);
    }
  });

  const uniqueList = Array.from(uniqueMap.values());

  if (!normalizedSearch) {
    return uniqueList;
  }

  return uniqueList.filter((recipe) => {
    return (
      recipe.title.toLowerCase().includes(normalizedSearch) ||
      recipe.description.toLowerCase().includes(normalizedSearch) ||
      recipe.category.toLowerCase().includes(normalizedSearch)
    );
  });
}

export async function getRecipe(id: number): Promise<RecipeItem> {
  await ensureAuthenticated();
  const numericId = Number(id);

  // Intenta leer desde el servidor local si está disponible
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/${numericId}`);
    if (res.ok) {
      const serverRecipe = await res.json();
      return adaptRecipeDtoToItem(serverRecipe);
    }
  } catch (_e) {
    // Continuar con búsqueda local
  }

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

  // Escribir físicamente en src/data/recipes.json a través de server.js
  await syncWithLocalJsonServer('POST', {
    id: newRecipe.id,
    title: newRecipe.title,
    description: newRecipe.description,
    imageURL: newRecipe.image,
    preparetime: newRecipe.prepareTime,
    likerate: newRecipe.likeRate,
    category: newRecipe.category,
    difficulty: newRecipe.difficulty,
  });

  console.log('[recipes.ts] Receta creada y sincronizada:', newRecipe.id);
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

  // Escribir físicamente en src/data/recipes.json a través de server.js
  await syncWithLocalJsonServer(
    'PUT',
    {
      id: numericId,
      title: updatedItem.title,
      description: updatedItem.description,
      imageURL: updatedItem.image,
      preparetime: updatedItem.prepareTime,
      likerate: updatedItem.likeRate,
      category: updatedItem.category,
      difficulty: updatedItem.difficulty,
    },
    numericId
  );

  console.log('[recipes.ts] Receta actualizada y sincronizada:', numericId);
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

  // Escribir físicamente en src/data/recipes.json a través de server.js
  await syncWithLocalJsonServer('DELETE', undefined, numericId);

  console.log('[recipes.ts] Receta eliminada y sincronizada:', numericId);
}
