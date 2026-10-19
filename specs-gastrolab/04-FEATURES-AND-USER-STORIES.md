# 04 — Especificación Funcional Detallada por Módulo (Features & User Stories)

Este documento describe de forma exhaustiva y autónoma cómo debe funcionar cada pantalla y característica de **GastroLab**.

---

## 1. Módulo de Autenticación, Registro y Seguridad (`index.tsx`, `register.tsx`, `auth.ts`, `tokenStorage.ts`)

### 1.1 Inicio de Sesión (`src/app/index.tsx`)
- **Verificación de Sesión Previa:**
  - En un `useEffect` al montar el componente, ejecuta `checkExistingSession()`:
    ```typescript
    useEffect(() => {
      const checkExistingSession = async () => {
        console.log('[index.tsx] Revisando si ya existe sesión previa...');
        const token = await getToken();
        if (token) {
          console.log('[index.tsx] Sesión existente detectada. Saltando al Home...');
          router.replace('/home');
        }
      };
      checkExistingSession();
    }, []);
    ```
- **Formulario de Login:**
  - Estados en inglés: `email`, `password`, `submitting`, `errorMessage`.
  - Textos en español latino: placeholders `"Correo electrónico"` y `"Contraseña"`, botón `"Iniciar sesión"`, enlace `"¿No tienes cuenta? Regístrate aquí"` (navega a `/register`) y enlace `"¿Olvidaste tu contraseña?"`.
- **Acción `handleLogin`:**
  - Valida campos obligatorios y formato de email antes de llamar a `login(email, password)`.
  - Guarda el token con `await saveToken(token)` y redirige a `router.replace('/home')`.
  - Si falla, muestra `Alert.alert('Error', 'Correo o contraseña incorrectos')` y actualiza el mensaje de error visual en pantalla.
- **Recuperación / Cambio de Contraseña (`handleForgotPassword`):**
  - Permite al usuario verificar si su correo existe en la base de datos consumiendo `POST /updateCredentials.php` con `{"action": "verify_email", "current_email": email}` y, si devuelve `exists: true` junto con el `id` del usuario, le permite establecer su nueva contraseña mediante `{"action": "update_credentials", "id": id, "new_email": email, "new_password": newPassword}`.

### 1.2 Registro de Usuario (`src/app/register.tsx`)
- Campos: `email`, `password`, `confirmPassword`.
- Valida que todos los campos sean obligatorios, que el email tenga formato válido y que ambas contraseñas coincidan.
- Consume `registerUser(email, password)` (`POST /register.php`).
- Tras recibir `{"store": "success"}`, muestra confirmación en español latino y redirige al Login (`router.replace('/')`).

---

## 2. Catálogo de Recetas (`src/app/home.tsx` y `src/components/ui/card.tsx`)

- **Protección de Ruta y Carga Reactiva:**
  - Verifica que exista un token activo con `getToken()` (si no existe, redirige a `'/'`).
  - Utiliza `useFocusEffect(useCallback(() => { fetchRecipes(); }, [fetchRecipes]))` para mantener el catálogo siempre sincronizado al regresar de crear, editar o eliminar una receta.
  - Incluye soporte de **Pull-to-Refresh** (`refreshing={refreshing}` y `onRefresh={onRefresh}` en el `FlatList`).
- **Encabezado de Acciones del Catálogo:**
  - Botón `"+ Nueva receta"` -> navega a `/form`.
  - Botón `"Favoritos (N)"` -> navega a `/favorites` (o activa el filtro rápido).
  - Botón `"Ajustes"` -> navega a `/settings`.
  - Botón `"Cerrar sesión"` -> ejecuta `await deleteToken()` y `router.replace('/')`.
- **Tarjeta de Receta (`src/components/ui/card.tsx`):**
  - Muestra la imagen de la receta (`<Image source={{ uri: image }} />` con fallback `onError` a una imagen culinaria por defecto si la URL externa falla).
  - Muestra insignia de **Categoría** (`category`), **Dificultad** (`difficulty`), **Tiempo de preparación** (`prepareTime`) y **Aprobación** (`${likeRate}%`).
  - Incluye un botón de corazón (`♥`) para agregar/quitar de favoritos directamente desde la tarjeta.
  - Al presionar la tarjeta (`onPress`), navega a `/details` enviando `params: { id: String(item.id) }`.

---

## 3. Vista Detallada de Receta (`src/app/details.tsx`)

- Recibe `{ id }` mediante `useLocalSearchParams<{ id: string }>()` y carga los datos actualizados con `getRecipe(Number(id))` dentro de un `useFocusEffect` con bandera de limpieza `let isActive = true`.
- Muestra un `ActivityIndicator` centrado mientras `loading` es `true`, o el mensaje `"No se encontró la receta"` si `!recipe`.
- Renderiza en un `<ScrollView contentContainerStyle={styles.container}>`:
  - Fotografía principal de la receta (`width: '100%', height: 250`).
  - Botón interactivo para marcar o desmarcar como **Favorito**.
  - Título, insignias de Categoría, Dificultad, Tiempo de preparación (`prepareTime`) y Porcentaje de aprobación (`likeRate%`).
  - Descripción completa de la receta.
  - **Bloque de Botones de Acción CRUD (`styles.actions`):**
    - `<Pressable onPress={handleEdit} style={[styles.button, styles.editButton]}>` con texto `"Editar"`, que ejecuta:
      ```typescript
      router.push({
        pathname: '/form',
        params: { recipe: JSON.stringify(recipe) },
      });
      ```
    - `<Pressable onPress={handleDelete} style={[styles.button, styles.deleteButton]}>` con texto `"Eliminar"`, que solicita confirmación antes de llamar a `await deleteRecipe(recipe.id)` y `router.back()`.

---

## 4. Creación y Edición de Recetas con Imagen (`src/app/form.tsx`)

- **Detección de Modo (Crear vs. Editar):**
  - Obtiene `const { recipe } = useLocalSearchParams<{ recipe?: string }>();`
  - Define `const editing: RecipeItem | null = recipe ? JSON.parse(recipe) : null;`
- **Estados del Formulario:**
  - `title`, `description`, `imageUri`, `prepareTime`, `likeRate`, `category`, `difficulty`, `saving` y `validationErrors`.
- **Selección de Imagen (`pickImage`):**
  - En plataformas móviles (`Platform.OS !== 'web'`), solicita permiso con `ImagePicker.requestMediaLibraryPermissionsAsync()`.
  - Abre el selector con:
    ```typescript
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    ```
  - También permite escribir o pegar una URL de imagen directamente si el usuario lo desea.
- **Guardado (`handleSave`):**
  - Valida que ningún campo obligatorio esté vacío y que `likeRate` sea un número entero entre `0` y `100` y `prepareTime` tenga formato `HH:MM:SS`.
  - Construye el `FormData` anexando los campos de texto y la imagen:
    - En Web (`Platform.OS === 'web'`): convierte la `imageUri` en `blob` mediante `fetch(imageUri)` y hace `formData.append('image', blob, 'photo.jpg')`.
    - En Móvil: extrae `filename` y `type` (`image/jpeg`) y hace `formData.append('image', { uri: imageUri, name: filename, type } as any)`.
  - Llama a `await updateRecipe(editing.id, formData, payload)` si `editing` existe, o `await createRecipe(formData, payload)` si es nueva, y al terminar regresa con `router.back()`.

---

## 5. Búsqueda y Filtros Combinados (`src/components/ui/searchFilterBar.tsx`)

- **Búsqueda por Texto:**
  - Campo `TextInput` con placeholder `"Buscar receta por nombre o ingrediente..."`.
  - Incluye botón para ejecutar consulta directa al endpoint `GET /recipe.php?search=...` además de filtrado reactivo inmediato sobre la colección cargada.
- **Filtros por Categoría:**
  - Chips seleccionables: `'Todas'`, `'Mexicanas'`, `'Italianas'`, `'Estadounidenses'`, `'Saludables'`, `'Postres'`.
- **Filtros por Dificultad:**
  - Chips seleccionables: `'Todas'`, `'Muy facil'`, `'Facil'`, `'Medio'`, `'Dificil'`.
- **Ordenamiento (`sortBy`):**
  - Selector entre: `'Por defecto'`, `'Mayor aprobación (%)'`, `'Menor tiempo'`, `'Nombre (A-Z)'`.
- **Filtro "Solo Favoritos":**
  - Chip con ícono de corazón que permite filtrar el listado actual para mostrar únicamente las recetas favoritas del usuario.

---

## 6. Gestión de Favoritos (`src/app/favorites.tsx` y `src/utils/preferencesStorage.ts`)

- Los favoritos se almacenan de forma persistente como un arreglo de IDs numéricos (`number[]`) asociados al usuario actual.
- La pantalla `/favorites` muestra todas las recetas marcadas como favoritas utilizando el mismo componente `Card`, permitiendo quitarlas de favoritos con un toque o entrar a `/details` para ver su información completa.
- Si el usuario aún no tiene recetas favoritas, muestra un estado vacío claro con un botón `"Explorar catálogo"` que lleva a `/home`.

---

## 7. Paginación Configurable (`src/components/ui/paginationBar.tsx`)

- **Opciones de Tamaño de Página (`itemsPerPage`):**
  - El usuario puede elegir en cualquier momento mostrar **10, 20 o 30 elementos por página**.
- **Comportamiento del Paginador:**
  - Calcula `totalPages = Math.max(1, Math.ceil(filteredRecipes.length / itemsPerPage))`.
  - Corta el arreglo visible mediante `filteredRecipes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)`.
  - Al cambiar el texto de búsqueda, categoría, dificultad o el tamaño de página (`10`, `20`, `30`), `currentPage` vuelve automáticamente a `1`.
  - Muestra controles claros: botón `"Anterior"`, indicador `"Página X de Y (Mostrando A-B de Total)"`, botón `"Siguiente"`, y los 3 botones selectores de cantidad `10`, `20`, `30`.

---

## 8. Configuración y Preferencias de Usuario (`src/app/settings.tsx` y `src/services/user.ts`)

La pantalla `/settings` permite configurar la experiencia de la app y gestionar la cuenta en el servidor PHP:

1. **Preferencias de la Aplicación (Persistentes):**
   - **Recetas por página por defecto:** Selector entre `10`, `20` o `30` (se sincroniza automáticamente con el catálogo en `/home`).
   - **Categoría inicial predeterminada:** Permite elegir qué categoría se muestra seleccionada al abrir la app (`Todas`, `Mexicanas`, `Italianas`, etc.).
   - **Tema de la Interfaz:** Selector entre `Claro` y `Oscuro`.
   - **Modo de Tarjetas Compactas:** Alternador para mostrar tarjetas resumidas o completas.
2. **Actualización de Credenciales en el Backend (`POST /updateCredentials.php`):**
   - Muestra el correo electrónico actual del usuario obtenido de la sesión (y verificable con `GET /users.php?id={userId}`).
   - Formulario para actualizar correo y contraseña:
     - Campos: `currentPassword` (Contraseña actual), `newEmail` (Nuevo correo electrónico), `newPassword` (Nueva contraseña).
     - Al presionar `"Actualizar credenciales"`, primero valida la contraseña actual llamando a `updateCredentials.php` con `action: 'verify_password'`.
     - Si el servidor responde `valid: true`, envía la segunda petición con `action: 'update_credentials'`, actualiza la sesión local y muestra `"Credenciales actualizadas correctamente"`.
3. **Acciones de Cuenta:**
   - Botón `"Restablecer datos locales de prueba"` (limpia las recetas editadas/creadas localmente para volver a ver exactamente los 30 registros originales de MySQL).
   - Botón `"Cerrar sesión"` (ejecuta `deleteToken()` y redirige a `'/'`).

---

## 9. Manejo de Errores (Backend y Frontend)

- **Errores de Red y Servidor:** Capturados en `fetchWithAuth` y presentados en español latino con opción de `"Reintentar"`.
- **Confirmación de Eliminación Multiplataforma:**
  - En Android/iOS, `Alert.alert('Confirmar', '¿Seguro que quieres eliminar esta receta?', [...])` muestra los botones `"Cancelar"` y `"Eliminar"`.
  - En Web (`Platform.OS === 'web'`), dado que `Alert.alert` de `react-native-web` a veces no soporta múltiples botones de callback, usar un `window.confirm('¿Seguro que quieres eliminar esta receta?')` o un modal personalizado para garantizar que la confirmación de borrado funcione en Web y en móvil sin fallar.
