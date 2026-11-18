# 06 — Plan de Implementación (Roadmap) y Checklist de Aceptación para el Agente

Este documento establece el orden paso a paso en que el agente debe construir **GastroLab** dentro de `/GastroLab` basándose exclusivamente en las especificaciones de esta carpeta.

---

## 1. Secuencia de Ejecución por Fases

### Fase 1: Configuración del Proyecto en `/GastroLab`
1. Inicializar la estructura de proyecto Expo SDK 58 dentro de `/GastroLab` con `package.json`, `tsconfig.json` y `app.json` (con `"orientation": "default"` para permitir rotación libre entre portrait y landscape).
2. Asegurar que estén instaladas las dependencias especificadas en `01-ARCHITECTURE-AND-CODING-STANDARDS.md` (incluyendo `expo-image-picker` y `expo-secure-store`).

### Fase 2: Catálogo JSON, Microservicio Local, Modelos, Almacenamiento y Validaciones (`server.js`, `src/data`, `src/types` y `src/utils`)
1. Crear `src/data/recipes.json` (30 recetas base) y `src/data/users.json` (usuario administrador inicial `admin@gastrolab.com` / `1234`), además de `src/data/recipesData.ts` como respaldo sin conexión.
2. Implementar `server.js` en la raíz con rutas REST mínimas (`GET`, `POST`, `PUT`, `DELETE`) sobre `/api/recipes` y `/api/users` en el puerto `3001`.
3. Crear `src/types/RecipeItem.ts` y `src/types/Auth.ts` siguiendo las interfaces de `03-DATA-MODELS-AND-VALIDATIONS.md`.
4. Crear `src/utils/tokenStorage.ts`, `src/utils/api.ts` (`getApiBaseUrl`, `apiRequest`), `src/utils/alerts.ts` (`showAlert`, `confirmAction`) y `src/utils/navigation.ts` (`safeGoBack`).
5. Crear `src/utils/preferencesStorage.ts` para persistir:
   - Usuarios de respaldo local (`getLocalUsers`, `saveLocalUsers`).
   - IDs de recetas favoritas por usuario (`getFavorites`, `toggleFavorite`, `removeFavorite`).
   - Preferencias de usuario (`getUserSettings`, `saveUserSettings`, tema global reactivo `useThemeMode`).
   - Caché local sencilla de recetas (`getLocalRecipes`, `saveLocalRecipes`, `resetLocalRecipeChanges`).
6. Crear `src/utils/validators.ts` y `src/utils/auth.ts` (`login`, `registerUser`).

### Fase 3: Servicios del Dominio (`src/services`)
1. Crear `src/services/recipes.ts` implementando `adaptRecipeDtoToItem`, `getRecipes`, `getRecipe`, `createRecipe`, `updateRecipe` y `deleteRecipe` comunicándose con `server.js` (y caché offline automática en caso de error de red).
2. Crear `src/services/user.ts` implementando `getUserProfile`, `verifyPassword` y `updateCredentials` contra `/api/users` + respaldo local.

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
- [ ] La aplicación sincroniza recetas y usuarios directamente en `src/data/recipes.json` y `src/data/users.json` mediante el microservicio minimalista `server.js` (`npm run server`), conservando respaldo automático en almacenamiento local cuando se usa sin conexión.
- [ ] Las pruebas automatizadas (`npm test`) y la verificación TypeScript (`npx tsc --noEmit`) pasan al 100%.
- [ ] El catálogo carga las 30 recetas originales con sus URLs de imagen, permite buscarlas, filtrarlas por categoría/dificultad, ordenarlas, marcarlas como favoritas y paginarlas de 10 en 10, 20 en 20 o 30 en 30.
- [ ] Las operaciones CRUD (Crear con imagen, Ver detalle, Editar y Eliminar) funcionan de principio a fin y actualizan las listas al regresar gracias a `useFocusEffect`.
- [ ] La pantalla de Configuración (`/settings`) permite personalizar la paginación/preferencias, actualizar el correo y contraseña localmente y restablecer los 30 registros originales.
