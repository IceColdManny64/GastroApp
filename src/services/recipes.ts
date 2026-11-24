import { INITIAL_RECIPES_DATA } from '../data/recipesData'; // Semilla estática de 30 recetas usada solo si server.js está apagado
import { RecipeItem, RawRecipeDto, RecipeFormPayload } from '../types/RecipeItem'; // Contratos TypeScript DTO, Item limpio y Payload
import { ApiError, apiRequest } from '../utils/api'; // Cliente HTTP hacia puerto 3001 y detector de fallo de red
import { // Importa helpers de caché local y favoritos desde preferencesStorage
  getLocalRecipes, // Lee respaldo local de recetas
  removeFavorite, // Limpia ID eliminado de la lista de favoritos ♥
  saveLocalRecipes, // Guarda respaldo local actualizado
} from '../utils/preferencesStorage'; // Módulo de almacenamiento local
import { getToken } from '../utils/tokenStorage'; // Verifica existencia de token antes de operar

export const DEFAULT_RECIPE_IMAGE = // Imagen culinaria de respaldo si una receta no tiene foto o su URL falla
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'; // Foto genérica estable en Unsplash

const ensureAuthenticated = async (): Promise<void> => { // Guardia interna que exige sesión iniciada en cada llamada
  const token = await getToken(); // Consulta token del usuario
  if (!token) { // Si no hay sesión guardada
    throw new Error('Sesión no encontrada. Por favor inicia sesión nuevamente.'); // Impide operar sin sesión
  } // Fin de validación token
}; // Fin de ensureAuthenticated

export const adaptRecipeDtoToItem = (raw: RawRecipeDto): RecipeItem => { // Patrón Adaptador: limpia datos crudos del JSON al modelo UI
  const numericId = Number(raw.id); // Convierte id aunque venga como texto ("1" -> 1)
  const parsedLikes = Number(raw.likerate); // Convierte likerate a número ("90" -> 90)
  const cleanImage = (raw.imageURL || raw.image || DEFAULT_RECIPE_IMAGE).trim(); // Toma imageURL/image o asigna foto de respaldo

  return { // Devuelve objeto RecipeItem con todos los tipos y valores garantizados
    id: Number.isFinite(numericId) && numericId > 0 ? numericId : Date.now(), // Usa ID numérico válido o timestamp de emergencia
    title: // Garantiza título no vacío y sin espacios sobrantes
      typeof raw.title === 'string' && raw.title.trim() // Verifica texto real
        ? raw.title.trim() // Limpia bordes
        : 'Receta sin título', // Título por defecto seguro
    description: // Garantiza descripción legible
      typeof raw.description === 'string' && raw.description.trim() // Verifica texto real
        ? raw.description.trim() // Limpia bordes
        : 'Sin descripción disponible.', // Texto por defecto si faltaba
    image: cleanImage, // Prop principal de imagen usada por <Card /> y <DetailScreen />
    imageURL: cleanImage, // Prop conservada por compatibilidad DTO
    prepareTime: // Garantiza formato horario válido
      typeof raw.preparetime === 'string' && // Verifica tipo string
      /^\d{2}:\d{2}(:\d{2})?$/.test(raw.preparetime.trim()) // Valida formato HH:MM o HH:MM:SS
        ? raw.preparetime.trim() // Conserva tiempo limpio
        : '00:30:00', // Tiempo por defecto si venía corrupto
    likeRate: // Garantiza porcentaje entero dentro de 0..100
      Number.isFinite(parsedLikes) && parsedLikes >= 0 && parsedLikes <= 100 // Verifica rango válido
        ? Math.round(parsedLikes) // Redondea a entero limpio
        : 85, // Valor por defecto si venía fuera de rango
    category: // Garantiza categoría no vacía
      typeof raw.category === 'string' && raw.category.trim() // Verifica texto
        ? raw.category.trim() // Limpia bordes
        : 'Mexicanas', // Categoría de respaldo
    difficulty: // Garantiza dificultad no vacía
      typeof raw.difficulty === 'string' && raw.difficulty.trim() // Verifica texto
        ? raw.difficulty.trim() // Limpia bordes
        : 'Facil', // Dificultad de respaldo
  }; // Fin de objeto RecipeItem adaptado
}; // Fin de adaptRecipeDtoToItem

function toServerRecipeBody(payload: RecipeFormPayload) { // Convierte payload camelCase del formulario al esquema JSON del servidor
  const cleanImage = payload.imageUri.trim() || DEFAULT_RECIPE_IMAGE; // Usa foto elegida o fallback si quedó vacía
  return { // Objeto DTO listo para JSON.stringify en POST y PUT
    title: payload.title.trim(), // Título limpio
    description: payload.description.trim(), // Descripción limpia
    imageURL: cleanImage, // Mapea imageUri -> imageURL del JSON
    preparetime: payload.prepareTime.trim(), // Mapea prepareTime -> preparetime
    likerate: Math.round(Number(payload.likeRate)), // Mapea likeRate -> likerate entero
    category: payload.category.trim(), // Categoría
    difficulty: payload.difficulty.trim(), // Dificultad
  }; // Fin de objeto DTO servidor
} // Fin de toServerRecipeBody

function filterBySearch(items: RecipeItem[], search?: string): RecipeItem[] { // Filtra una lista en modo offline por texto
  const normalized = search?.trim().toLowerCase() || ''; // Normaliza búsqueda en minúsculas
  if (!normalized) return items; // Sin búsqueda devuelve todo el arreglo

  return items.filter( // Conserva recetas que coincidan en título, descripción o categoría
    (recipe) => // Evalúa cada receta
      recipe.title.toLowerCase().includes(normalized) || // Coincidencia en título
      recipe.description.toLowerCase().includes(normalized) || // Coincidencia en descripción
      recipe.category.toLowerCase().includes(normalized) // Coincidencia en categoría
  ); // Fin de filter
} // Fin de filterBySearch

async function getOfflineSeededRecipes(): Promise<RecipeItem[]> { // Carga caché local o la siembra con las 30 recetas base
  const cached = await getLocalRecipes(); // Busca arreglo guardado en almacenamiento local
  if (cached && cached.length > 0) { // Si ya existía caché previa
    return cached; // Devuelve recetas locales guardadas
  } // Fin de verificación caché
  const seeded = INITIAL_RECIPES_DATA.map(adaptRecipeDtoToItem); // Adapta las 30 recetas estáticas de recipesData.ts
  await saveLocalRecipes(seeded); // Guarda semilla inicial para futuras lecturas/ediciones offline
  return seeded; // Devuelve las 30 recetas iniciales
} // Fin de getOfflineSeededRecipes

export async function getRecipes(search?: string): Promise<RecipeItem[]> { // Lee todas las recetas (o filtradas por ?search=)
  await ensureAuthenticated(); // Exige sesión activa
  const cleanSearch = search?.trim() || ''; // Limpia texto buscado
  const query = cleanSearch ? `?search=${encodeURIComponent(cleanSearch)}` : ''; // Construye parámetro query seguro si hay búsqueda

  try { // Intenta pedir recetas en vivo a server.js
    const serverRecipes = await apiRequest<RawRecipeDto[]>(`/api/recipes${query}`); // GET /api/recipes
    const adapted = Array.isArray(serverRecipes) // Normaliza cada elemento recibido con el adaptador
      ? serverRecipes.map(adaptRecipeDtoToItem) // Transforma cada DTO en RecipeItem
      : []; // Respaldo vacío si respuesta no fuera arreglo
    if (!cleanSearch) { // Solo sobrescribe caché completa cuando no fue búsqueda parcial
      await saveLocalRecipes(adapted); // Sincroniza caché local con la última lista real de recipes.json
    } // Fin de guardado caché
    return adapted; // Retorna recetas listas para FlatList
  } catch (err) { // Si falló petición al servidor
    if (err instanceof ApiError && !err.isNetworkError) { // Si fue error real del servidor (4xx/5xx)
      throw err; // Lo propaga a pantalla para mostrar Reintentar
    } // Fin de verificación error servidor
    console.warn('[recipes.ts] Servidor local no disponible, leyendo caché local.'); // Advierte que está en modo sin conexión
    const offline = await getOfflineSeededRecipes(); // Lee lista local
    return filterBySearch(offline, cleanSearch); // Filtra localmente si venía búsqueda
  } // Fin try/catch
} // Fin de getRecipes

export async function getRecipe(id: number): Promise<RecipeItem> { // Obtiene una receta individual actualizada por su ID
  await ensureAuthenticated(); // Verifica sesión iniciada
  const numericId = Number(id); // Normaliza ID a número

  try { // Consulta primero al microservicio JSON en disco
    const serverRecipe = await apiRequest<RawRecipeDto>(`/api/recipes/${numericId}`); // GET /api/recipes/:id
    return adaptRecipeDtoToItem(serverRecipe); // Adapta y devuelve receta fresca
  } catch (err) { // Captura 404 o fallo de red
    if (err instanceof ApiError && !err.isNetworkError) { // Si el servidor respondió 404 (borrada o inexistente)
      throw new Error( // Lanza error claro en español sin ocultar que no existe en JSON
        err.status === 404 ? 'No se encontró la receta solicitada.' : err.message // Personaliza mensaje 404
      ); // Fin de throw Error
    } // Fin de manejo error real
    const offline = await getOfflineSeededRecipes(); // Si server.js está apagado busca en caché local
    const found = offline.find((item) => Number(item.id) === numericId); // Busca por ID
    if (!found) { // Si tampoco existe en respaldo
      throw new Error('No se encontró la receta solicitada.'); // Notifica inexistencia
    } // Fin de verificación found
    return found; // Devuelve receta desde caché local
  } // Fin try/catch
} // Fin de getRecipe

export async function createRecipe( // Crea una nueva receta guardándola al inicio de recipes.json
  payload: RecipeFormPayload // Datos validados provenientes del formulario form.tsx
): Promise<RecipeItem> { // Devuelve la receta creada con su ID definitivo
  await ensureAuthenticated(); // Verifica sesión activa
  const body = toServerRecipeBody(payload); // Traduce payload al formato JSON DTO del servidor

  try { // Envía creación al microservicio JSON
    const createdDto = await apiRequest<RawRecipeDto>('/api/recipes', { // POST /api/recipes
      method: 'POST', // Verbo creación
      body: JSON.stringify(body), // Cuerpo JSON de la nueva receta
    }); // Espera receta creada con ID asignado por server.js
    const created = adaptRecipeDtoToItem(createdDto); // Normaliza respuesta en RecipeItem

    const existing = await getOfflineSeededRecipes(); // Lee caché local actual
    await saveLocalRecipes([ // Actualiza caché local anteponiendo la receta creada sin duplicar IDs
      created, // Nueva receta al principio
      ...existing.filter((item) => Number(item.id) !== created.id), // Resto sin colisión de ID
    ]); // Fin de guardado caché

    return created; // Retorna receta creada a form.tsx
  } catch (err) { // Si falló petición
    if (err instanceof ApiError && !err.isNetworkError) { // Si server.js rechazó por datos inválidos (400)
      throw err; // Muestra el error real en el formulario
    } // Fin de propagación error HTTP
    console.warn('[recipes.ts] Servidor local no disponible, guardando en caché local.'); // Aviso modo offline
    const existing = await getOfflineSeededRecipes(); // Lee arreglo local actual
    const maxId = existing.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0); // Calcula ID siguiente disponible
    const localCreated = adaptRecipeDtoToItem({ // Crea RecipeItem adaptado localmente
      id: maxId + 1, // Nuevo ID incremental
      ...body, // Campos DTO
    }); // Fin de adaptación local
    await saveLocalRecipes([localCreated, ...existing]); // Persiste en dispositivo
    return localCreated; // Retorna receta creada offline
  } // Fin try/catch
} // Fin de createRecipe

export async function updateRecipe( // Actualiza los datos de una receta existente por su ID
  id: number, // ID numérico de la receta a editar
  payload: RecipeFormPayload // Nuevos valores validados en form.tsx
): Promise<RecipeItem> { // Devuelve receta actualizada
  await ensureAuthenticated(); // Exige sesión activa
  const numericId = Number(id); // Normaliza ID a número
  const body = toServerRecipeBody(payload); // Convierte payload a esquema JSON

  try { // Envía actualización física al servidor JSON
    const updatedDto = await apiRequest<RawRecipeDto>(`/api/recipes/${numericId}`, { // PUT /api/recipes/:id
      method: 'PUT', // Verbo actualización
      body: JSON.stringify(body), // Campos nuevos en JSON
    }); // Espera objeto actualizado confirmado desde recipes.json
    const updated = adaptRecipeDtoToItem(updatedDto); // Normaliza respuesta

    const existing = await getOfflineSeededRecipes(); // Lee caché local
    await saveLocalRecipes( // Sustituye el elemento modificado dentro de la caché local
      existing.map((item) => (Number(item.id) === numericId ? updated : item)) // Reemplaza coincidencia por ID
    ); // Fin guardado caché

    return updated; // Retorna receta actualizada
  } catch (err) { // Si falló actualización
    if (err instanceof ApiError && !err.isNetworkError) { // Si el servidor respondió 404 o 400
      throw err; // No oculta el error real; avisa al usuario
    } // Fin manejo error servidor
    console.warn('[recipes.ts] Servidor local no disponible, actualizando caché local.'); // Modo offline
    const existing = await getOfflineSeededRecipes(); // Lee caché local
    const targetExists = existing.some((item) => Number(item.id) === numericId); // Comprueba que el ID exista en respaldo
    if (!targetExists) { // Si no existe ni localmente
      throw new Error('No se encontró la receta solicitada para actualizar.'); // Lanza error claro
    } // Fin de verificación existencia
    const localUpdated = adaptRecipeDtoToItem({ // Construye objeto actualizado localmente
      id: numericId, // Conserva mismo ID
      ...body, // Nuevos datos
    }); // Fin de adaptación
    await saveLocalRecipes( // Guarda arreglo actualizado en dispositivo
      existing.map((item) => (Number(item.id) === numericId ? localUpdated : item)) // Reemplaza por ID
    ); // Fin guardado offline
    return localUpdated; // Retorna receta editada offline
  } // Fin try/catch
} // Fin de updateRecipe

export async function deleteRecipe(id: number): Promise<void> { // Elimina una receta de recipes.json, caché y favoritos
  await ensureAuthenticated(); // Exige sesión iniciada
  const numericId = Number(id); // Normaliza ID

  try { // Intenta borrar primero del archivo físico en server.js
    await apiRequest(`/api/recipes/${numericId}`, { // DELETE /api/recipes/:id
      method: 'DELETE', // Verbo HTTP de borrado
    }); // Espera confirmación HTTP 200
  } catch (err) { // Si hubo error
    if (err instanceof ApiError && !err.isNetworkError) { // Si el servidor respondió 404 (ya no existía)
      throw err; // Propaga error real
    } // Fin verificación servidor
    console.warn('[recipes.ts] Servidor local no disponible, eliminando en caché local.'); // Si server.js estaba apagado continúa borrando local
  } // Fin try/catch

  const existing = await getOfflineSeededRecipes(); // Lee lista en caché
  await Promise.all([ // Ejecuta en paralelo limpieza de caché y favoritos
    saveLocalRecipes(existing.filter((item) => Number(item.id) !== numericId)), // Quita la receta de caché local
    removeFavorite(numericId), // Quita su ID de favoritos para mantener contador real en Home
  ]); // Fin limpieza paralela
} // Fin de deleteRecipe
