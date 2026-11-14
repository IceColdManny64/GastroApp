# 06 — Plan de Implementación (Roadmap) y Checklist de Aceptación para el Agente

Este documento establece el orden paso a paso en que el agente debe construir **GastroLab** dentro de `/GastroLab` basándose exclusivamente en las especificaciones de esta carpeta.

---

## 1. Secuencia de Ejecución por Fases

### Fase 1: Configuración del Proyecto en `/GastroLab`
1. Inicializar la estructura de proyecto Expo SDK 58 dentro de `/GastroLab` con `package.json`, `tsconfig.json` y `app.json` (con `"orientation": "default"` para permitir rotación libre entre portrait y landscape).
2. Asegurar que estén instaladas las dependencias especificadas en `01-ARCHITECTURE-AND-CODING-STANDARDS.md` (incluyendo `expo-image-picker` y `expo-secure-store`).

### Fase 2: Catálogo de Datos, Modelos, Almacenamiento y Validaciones (`src/data`, `src/types` y `src/utils`)
1. Crear `src/types/RecipeItem.ts` y `src/types/Auth.ts` siguiendo las interfaces de `03-DATA-MODELS-AND-VALIDATIONS.md`.
2. Crear `src/data/recipesData.ts` con `INITIAL_RECIPES_DATA` conteniendo las 30 recetas originales y sus URLs de imagen especificadas en `02-LOCAL-DATA-AND-STORAGE-ARCHITECTURE.md`.
3. Crear `src/utils/tokenStorage.ts` con `saveToken`, `getToken`, `deleteToken`, `removeToken`, `saveUserSession` y `getUserSession`.
4. Crear `src/utils/preferencesStorage.ts` para persistir:
   - Usuarios registrados localmente (`getLocalUsers`, `saveLocalUsers`, inicializado con `admin@gastrolab.com` / `1234`).
   - IDs de recetas favoritas por usuario (`getFavorites`, `toggleFavorite`).
   - Preferencias de usuario (`getUserSettings`, `saveUserSettings`: tamaño de página `10 | 20 | 30`, tema claro/oscuro, categoría inicial y modo compacto).
   - Capa de sincronización CRUD (`createdRecipes`, `updatedRecipesById`, `deletedRecipeIds`).
5. Crear `src/utils/validators.ts` con las funciones de validación de formularios y verificación de tipos de dato (`validateAuthForm`, `validateRecipeForm`).
6. Crear `src/utils/api.ts` y `src/utils/auth.ts` (`login`, `registerUser`) operando 100% en el frontend.

### Fase 3: Servicios del Dominio (`src/services`)
1. Crear `src/services/recipes.ts` implementando `adaptRecipeDtoToItem`, `getRecipes`, `getRecipe`, `createRecipe`, `updateRecipe` y `deleteRecipe` sobre el catálogo local de 30 recetas + overlay CRUD.
2. Crear `src/services/user.ts` implementando `getUserProfile`, `verifyPassword` y `updateCredentials` sobre el almacenamiento local de cuentas.

### Fase 4: Componentes UI (`src/components/ui`)
1. Crear `src/components/ui/card.tsx` siguiendo el patrón de `Pressable` (`pressed && styles.cardPressed`), mostrando imagen por URL con fallback, categoría, dificultad, tiempo de preparación, porcentaje de aprobación (`likeRate%`) y botón de favorito (`♥`).
2. Crear `src/components/ui/searchFilterBar.tsx` con barra de búsqueda, chips de categoría, chips de dificultad, selector de ordenamiento y filtro de favoritos.
3. Crear `src/components/ui/paginationBar.tsx` con selector de `10`, `20` o `30` elementos por página y botones de navegación entre páginas.

### Fase 5: Pantallas y Navegación (`src/app`)
1. Crear `src/app/_layout.tsx` con `SafeAreaProvider` y `Stack` (`screenOptions={{ orientation: 'default' }}`) registrando `index`, `register`, `home`, `details`, `form`, `favorites` y `settings`.
2. Crear `src/app/index.tsx` (Login + auto-redirect con `getToken()`) y `src/app/register.tsx`.
3. Crear `src/app/home.tsx` con `useFocusEffect`, `FlatList` responsivo (`numColumns` dinámico con `useWindowDimensions`), pull-to-refresh, búsqueda, filtros, paginación y cierre de sesión.
4. Crear `src/app/details.tsx` con `useFocusEffect`, vista completa responsiva de la receta, botón de favorito y botones `"Editar"` y `"Eliminar"`.
5. Crear `src/app/form.tsx` con `expo-image-picker` (`mediaTypes: ['images']`), validaciones en español latino y guardado local.
6. Crear `src/app/favorites.tsx` y `src/app/settings.tsx`.

---

## 2. Checklist de Verificación y Aceptación

Antes de dar por terminado el desarrollo, el agente debe comprobar:

- [ ] Todo el código vive en `/GastroLab` y pasa la verificación de tipos `npx tsc --noEmit` sin errores (`exit code 0`).
- [ ] El código utiliza exclusivamente la estructura y sintaxis definida en `01-ARCHITECTURE-AND-CODING-STANDARDS.md` (`StyleSheet.create`, `useFocusEffect`, `data/`, `services/`, `utils/`, `types/`).
- [ ] Todos los nombres de funciones, variables, estados, tipos y archivos están en **inglés (US)**, y todos los textos visibles por el usuario están en **español latino**.
- [ ] La aplicación funciona **100% como Frontend autónomo**, sin ninguna referencia ni dependencia a servidores externos.
- [ ] El catálogo carga las 30 recetas originales con sus URLs de imagen, permite buscarlas, filtrarlas por categoría/dificultad, ordenarlas, marcarlas como favoritas y paginarlas de 10 en 10, 20 en 20 o 30 en 30.
- [ ] Las operaciones CRUD (Crear con imagen, Ver detalle, Editar y Eliminar) funcionan de principio a fin y actualizan las listas al regresar gracias a `useFocusEffect`.
- [ ] La pantalla de Configuración (`/settings`) permite personalizar la paginación/preferencias, actualizar el correo y contraseña localmente y restablecer los 30 registros originales.
