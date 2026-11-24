export type RecipeCategory = // Tipo unión que restringe las categorías permitidas en filtros
  | 'Todas' // Opción especial para mostrar recetas de cualquier categoría
  | 'Mexicanas' // Recetas tradicionales de cocina mexicana
  | 'Italianas' // Platillos de cocina italiana (pastas, pizzas, etc.)
  | 'Orientales' // Recetas de gastronomía oriental
  | 'Estadounidenses' // Platillos clásicos estadounidenses (hamburguesas, hot dogs)
  | 'Saludables' // Opciones ligeras como ensaladas y batidos
  | 'Postres'; // Recetas dulces y repostería

export type RecipeDifficulty = // Tipo unión que restringe los niveles de dificultad válidos
  | 'Todas' // Opción para no filtrar por dificultad
  | 'Muy facil' // Preparación rápida y sin pasos complejos
  | 'Facil' // Dificultad sencilla para principiantes
  | 'Medio' // Requiere técnica o tiempo moderado
  | 'Dificil'; // Preparación elaborada o tardada

export const RECIPE_CATEGORIES: RecipeCategory[] = [ // Lista completa de categorías usada en filtros y ajustes
  'Todas', // Primer chip seleccionable en barra de filtros
  'Mexicanas', // Chip de categoría Mexicana
  'Italianas', // Chip de categoría Italiana
  'Orientales', // Chip de categoría Oriental
  'Estadounidenses', // Chip de categoría Estadounidense
  'Saludables', // Chip de categoría Saludable
  'Postres', // Chip de categoría Postres
]; // Fin del arreglo de categorías para filtrar

export const VALID_RECIPE_CATEGORIES: string[] = [ // Lista estricta de categorías permitidas al crear o editar recetas
  'Mexicanas', // Categoría válida 1
  'Italianas', // Categoría válida 2
  'Orientales', // Categoría válida 3
  'Estadounidenses', // Categoría válida 4
  'Saludables', // Categoría válida 5
  'Postres', // Categoría válida 6
]; // Fin de categorías válidas para el formulario

export const RECIPE_DIFFICULTIES: RecipeDifficulty[] = [ // Lista completa de dificultades para los chips de filtro
  'Todas', // Sin filtro de dificultad
  'Muy facil', // Nivel 1
  'Facil', // Nivel 2
  'Medio', // Nivel 3
  'Dificil', // Nivel 4
]; // Fin del arreglo de dificultades para filtrar

export const VALID_RECIPE_DIFFICULTIES: string[] = [ // Dificultades válidas al guardar una receta en el formulario
  'Muy facil', // Dificultad válida 1
  'Facil', // Dificultad válida 2
  'Medio', // Dificultad válida 3
  'Dificil', // Dificultad válida 4
]; // Fin de dificultades válidas para validación

export interface RawRecipeDto { // Estructura cruda tal como llega de recipes.json o backend
  id: number | string; // Identificador que podría venir como número o texto
  title: string; // Título de la receta en formato crudo
  description: string; // Descripción cruda de preparación
  imageURL?: string; // Campo de imagen usado en el archivo JSON
  image?: string; // Campo alternativo de imagen soportado por el adaptador
  preparetime?: string; // Tiempo en minúsculas tal como viene del JSON
  likerate?: number | string; // Calificación que puede venir como texto o número
  category?: string; // Nombre opcional de categoría
  difficulty?: string; // Nombre opcional de dificultad
} // Fin de interfaz RawRecipeDto

export interface RecipeItem { // Modelo limpio y normalizado usado en toda la interfaz UI
  id: number; // Identificador siempre numérico entero
  title: string; // Título limpio sin espacios sobrantes
  description: string; // Descripción limpia lista para mostrar
  image: string; // URI final lista para el componente <Image />
  imageURL: string; // Copia de la URL de imagen para compatibilidad
  prepareTime: string; // Tiempo garantizado en formato "HH:MM:SS"
  likeRate: number; // Porcentaje de aprobación entero garantizado (0 a 100)
  category: string; // Categoría asignada al platillo
  difficulty: string; // Nivel de dificultad del platillo
} // Fin de interfaz RecipeItem

export interface RecipeFormPayload { // Objeto que recolecta form.tsx para crear o actualizar
  title: string; // Título validado ingresado por el usuario
  description: string; // Descripción validada ingresada en el formulario
  imageUri: string; // URL o Data URI de la imagen elegida
  prepareTime: string; // Tiempo en formato HH:MM:SS validado
  likeRate: number; // Calificación entera convertida a número
  category: string; // Categoría seleccionada con chip
  difficulty: string; // Dificultad seleccionada con chip
} // Fin de interfaz RecipeFormPayload

export type SortOption = 'default' | 'likes_desc' | 'time_asc' | 'title_asc'; // Claves permitidas de ordenamiento en catálogo

export interface RecipeFilterState { // Estado agrupado de búsqueda, filtros y orden en HomeScreen
  searchQuery: string; // Texto actual escrito en la barra de búsqueda
  category: RecipeCategory; // Categoría seleccionada actualmente
  difficulty: RecipeDifficulty; // Dificultad seleccionada actualmente
  sortBy: SortOption; // Criterio de ordenamiento activo
  onlyFavorites: boolean; // Bandera para mostrar únicamente recetas marcadas ♥
} // Fin de interfaz RecipeFilterState
