# 02 — Arquitectura del Microservicio JSON, Catálogo (30 Recetas) y Respaldo Local

## 1. Visión General de la Capa de Datos

**GastroLab** utiliza un microservicio local minimalista en Node.js (`server.js`, puerto `3001`, sin dependencias externas) que persiste directamente todos los cambios CRUD en disco sobre dos archivos JSON, manteniendo un respaldo automático en el almacenamiento local del dispositivo para operar incluso sin conexión:

1. **Microservicio JSON (`server.js` -> `src/data/recipes.json` y `src/data/users.json`):**
   - **`src/data/recipes.json`:** Contiene las 30 recetas base y se actualiza físicamente en disco ante cada operación `POST`, `PUT` o `DELETE`.
   - **`src/data/users.json`:** Almacena las cuentas de usuario (`admin@gastrolab.com` / `1234` por defecto) y se actualiza físicamente al registrar nuevos usuarios (`POST /api/users`) o actualizar correo/contraseña (`PUT /api/users/:id`).
   - **Semilla de respaldo offline (`src/data/recipesData.ts`):** Exporta `INITIAL_RECIPES_DATA` como arreglo estático de solo lectura para inicializar la app si `server.js` está apagado. (Al no importar `recipes.json` ni `users.json` directamente desde el bundler de Expo, se evitan recargas de Metro cuando `server.js` escribe en disco).
2. **Almacenamiento Local y Caché del Dispositivo (`src/utils/tokenStorage.ts` y `src/utils/preferencesStorage.ts`):**
   - En **Android / iOS**: Utiliza `expo-secure-store` (con chunking automático y respaldo en memoria).
   - En **Web**: Utiliza `localStorage` (con respaldo en memoria).
   - Persiste el token/sesión (`UserSession`), favoritos por usuario, preferencias (`UserSettings`, tema global claro/oscuro) y la caché local (`gastrolab_local_recipes`, `gastrolab_local_users`) usada automáticamente si `server.js` no responde.

---

## 2. Catálogo Completo de las 30 Recetas (`src/data/recipes.json`)

El archivo `src/data/recipes.json` contiene los 30 registros iniciales con sus URLs de imagen:

| ID | Título (`title`) | Categoría (`category`) | Dificultad (`difficulty`) | Tiempo (`preparetime`) | Likes (`likerate`) | URL de Imagen (`imageURL`) |
|---|---|---|---|---|---|---|
| 1 | `Un manjar de italia: la pizza` | `Italianas` | `Facil` | `01:00:00` | `90` | `https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/48a49653c8716457eb0b2f7eb3c7d74c/Derivates/8d83d9ed4567fa15456d8eec7557e60006a15576.jpg` |
| 2 | `Kebab: Brocheta estilo europeo` | `Orientales` | `Medio` | `00:50:00` | `86` | `https://static.bainet.es/clip/f658e8ed-8822-4c26-b51b-51d0f3bf6de2_source-aspect-ratio_1600w_0.jpg` |
| 3 | `Tacos al pastor: el clásico mexicano` | `Mexicanas` | `Medio` | `01:20:00` | `95` | `https://www.seriouseats.com/thmb/4kbwN13BlZnZ3EywrtG2AzCKuYs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/20210712-tacos-al-pastor-melissa-hom-seriouseats-37-f72cdd02c9574bceb1eef1c8a23b76ed.jpg` |
| 4 | `Hamburguesa gourmet casera` | `Estadounidenses` | `Facil` | `00:40:00` | `88` | `https://www.unileverfoodsolutions.com.co/dam/global-ufs/mcos/NOLA/calcmenu/recipes/col-recipies/fruco-tomate-cocineros/HAMBURGUESA%201200x709.png` |
| 5 | `Lasaña boloñesa tradicional` | `Italianas` | `Medio` | `01:30:00` | `92` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRjCnVV8A21ZB29s1541-c9eb010R040196Q&s` |
| 6 | `Enchiladas verdes con pollo` | `Mexicanas` | `Facil` | `00:45:00` | `89` | `https://www.mexicoenmicocina.com/wp-content/uploads/2013/11/Enchiladas-verdes-con-pollo-1.jpg` |
| 7 | `Ensalada César con pollo grillado` | `Saludables` | `Muy facil` | `00:25:00` | `80` | `https://www.goodnes.com/sites/g/files/jgfbjl321/files/srh_recipes/755f697272cbcdc6e5df2adb44b1b705.jpg` |
| 8 | `Spaghetti carbonara auténtico` | `Italianas` | `Facil` | `00:30:00` | `91` | `https://static01.nyt.com/images/2021/02/14/dining/carbonara-horizontal/carbonara-horizontal-threeByTwoMediumAt2X-v2.jpg` |
| 9 | `Burrito tex-mex completo` | `Estadounidenses` | `Facil` | `00:35:00` | `87` | `https://www.seriouseats.com/thmb/2ca1ZB29s1541-c9eb010R040196Q&s` |
| 10 | `Chilaquiles rojos crujientes` | `Mexicanas` | `Muy facil` | `00:25:00` | `90` | `https://patjinich.com/es/wp-content/uploads/sites/3/2017/07/207-chilaquiles-verdes.jpg` |
| 11 | `Pollo al curry estilo hindú` | `Saludables` | `Medio` | `00:55:00` | `84` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9Q2ca1ZB29s1541-c9eb010R040196Q&s` |
| 12 | `Salmón a la plancha con vegetales` | `Saludables` | `Muy facil` | `00:20:00` | `89` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8X1ZB29s1541-c9eb010R040196Q&s` |
| 13 | `Costillas BBQ al horno` | `Estadounidenses` | `Dificil` | `02:00:00` | `94` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7Y2ZB29s1541-c9eb010R040196Q&s` |
| 14 | `Risotto de champiñones` | `Italianas` | `Medio` | `00:50:00` | `86` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcU6Z3ZB29s1541-c9eb010R040196Q&s` |
| 15 | `Quesadillas de flor de calabaza` | `Mexicanas` | `Muy facil` | `00:20:00` | `88` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcV5A4ZB29s1541-c9eb010R040196Q&s` |
| 16 | `Tiramisú clásico italiano` | `Postres` | `Facil` | `00:40:00` | `96` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcW4B5ZB29s1541-c9eb010R040196Q&s` |
| 17 | `Cheesecake de frutos rojos` | `Postres` | `Medio` | `01:10:00` | `93` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcX3C6ZB29s1541-c9eb010R040196Q&s` |
| 18 | `Brownies de chocolate intenso` | `Postres` | `Facil` | `00:35:00` | `92` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcY2D7ZB29s1541-c9eb010R040196Q&s` |
| 19 | `Guacamole tradicional con totopos` | `Mexicanas` | `Muy facil` | `00:15:00` | `91` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcZ1E8ZB29s1541-c9eb010R040196Q&s` |
| 20 | `Bowl saludable de quinoa y aguacate` | `Saludables` | `Muy facil` | `00:25:00` | `85` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcA0F9ZB29s1541-c9eb010R040196Q&s` |
| 21 | `Fettuccine Alfredo cremoso` | `Italianas` | `Facil` | `00:30:00` | `90` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcB9G0ZB29s1541-c9eb010R040196Q&s` |
| 22 | `Alitas buffalo picantes` | `Estadounidenses` | `Facil` | `00:45:00` | `89` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcC8H1ZB29s1541-c9eb010R040196Q&s` |
| 23 | `Pozole rojo tradicional` | `Mexicanas` | `Dificil` | `02:10:00` | `95` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcD7I2ZB29s1541-c9eb010R040196Q&s` |
| 24 | `Panqueques esponjosos estilo americano` | `Postres` | `Muy facil` | `00:25:00` | `90` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcE6J3ZB29s1541-c9eb010R040196Q&s` |
| 25 | `Sopa minestrone de verduras` | `Saludables` | `Facil` | `00:40:00` | `83` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcF5K4ZB29s1541-c9eb010R040196Q&s` |
| 26 | `Mac and cheese gratinado` | `Estadounidenses` | `Facil` | `00:35:00` | `88` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcG4L5ZB29s1541-c9eb010R040196Q&s` |
| 27 | `Gnocchi en salsa de cuatro quesos` | `Italianas` | `Medio` | `00:45:00` | `89` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcH3M6ZB29s1541-c9eb010R040196Q&s` |
| 28 | `Cochinita pibil yucateca` | `Mexicanas` | `Dificil` | `02:30:00` | `96` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcI2N7ZB29s1541-c9eb010R040196Q&s` |
| 29 | `Flan napolitano casero` | `Postres` | `Facil` | `01:00:00` | `92` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcJ1O8ZB29s1541-c9eb010R040196Q&s` |
| 30 | `Wrap mediterráneo de pollo` | `Saludables` | `Muy facil` | `00:20:00` | `86` | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcK0P9ZB29s1541-c9eb010R040196Q&s` |

---

## 3. Autenticación y Gestión de Usuarios (`src/data/users.json`, `src/utils/auth.ts`, `src/services/user.ts`)

### 3.1 Cuenta Predeterminada y Registro en `users.json`
- El archivo `src/data/users.json` inicia con una cuenta administradora lista para usar:
  - **Correo:** `admin@gastrolab.com`
  - **Contraseña:** `1234`
- Cualquier usuario nuevo registrado en `/(auth)/register` envía `POST /api/users` a `server.js`, validando que el correo no esté repetido (`409`) y guardándolo físicamente en `src/data/users.json` (con respaldo automático en `gastrolab_local_users` si `server.js` no está activo).

### 3.2 Flujo de Login (`login` en `src/utils/auth.ts`)
- Obtiene los usuarios desde `GET /api/users` (o `getLocalUsers()` en modo sin conexión) y busca coincidencia de `email` (case-insensitive) y `password`.
- Si las credenciales son válidas, genera un token de sesión (`gastrolab-token-${user.id}-${Date.now()}`), lo persiste mediante `saveUserSession({ id: user.id, email: user.email, token })`, y retorna el token.
- Si no coinciden, lanza un `Error('Correo o contraseña incorrectos')`.

### 3.3 Flujo de Perfil y Cambio de Credenciales (`src/services/user.ts`)
- **`getUserProfile(userId)`:** Consulta `GET /api/users/:id` (o caché local) y devuelve `{ id, email }`.
- **`verifyPassword(userId, currentPassword)`:** Comprueba que la contraseña actual coincida antes de actualizar credenciales en `/settings`.
- **`updateCredentials(userId, newEmail, newPassword)`:** Envía `PUT /api/users/:id` a `server.js` para actualizar correo y contraseña directamente en `src/data/users.json` (verificando unicidad de correo) y sincroniza la sesión activa (`saveUserSession`).

---

## 4. Microservicio REST y Motor CRUD (`server.js` + `src/services/recipes.ts`)

El microservicio `server.js` expone dos grupos de endpoints REST sumamente simples sobre `src/data/recipes.json` y `src/data/users.json` (`GET`, `POST`, `PUT`, `DELETE`):

| Recurso | Endpoint | Función | Archivo físico modificado |
|---|---|---|---|
| **Salud** | `GET /health` | Verifica estado y conteos actuales | — |
| **Recetas** | `GET /api/recipes` | Lista recetas (acepta `?search=`) | Lee `src/data/recipes.json` |
| **Recetas** | `GET /api/recipes/:id` | Obtiene detalle por ID (o `404`) | Lee `src/data/recipes.json` |
| **Recetas** | `POST /api/recipes` | Crea receta nueva al inicio con `id = max + 1` | Escribe `src/data/recipes.json` |
| **Recetas** | `PUT /api/recipes/:id` | Actualiza campos de una receta (o `404`) | Escribe `src/data/recipes.json` |
| **Recetas** | `DELETE /api/recipes/:id` | Elimina la receta por ID (o `404`) | Escribe `src/data/recipes.json` |
| **Usuarios** | `GET /api/users`, `GET /api/users/:id` | Consulta cuentas de usuario | Lee `src/data/users.json` |
| **Usuarios** | `POST /api/users` | Registra usuario nuevo (valida duplicados `409`) | Escribe `src/data/users.json` |
| **Usuarios** | `PUT /api/users/:id` | Actualiza correo y/o contraseña (valida `409`) | Escribe `src/data/users.json` |

### Flujo en `src/services/recipes.ts`:
1. **Lectura del Catálogo (`getRecipes(search?)`):**
   - Llama `GET /api/recipes` (con `?search=` opcional), normaliza con `adaptRecipeDtoToItem` y guarda copia en `gastrolab_local_recipes`. Si hay error de red (`isNetworkError`), lee la caché local `getLocalRecipes()` (sembrada desde `INITIAL_RECIPES_DATA`).
2. **Detalle de Receta (`getRecipe(id)`):**
   - Llama `GET /api/recipes/:id`. Si recibe `404` del servidor, lanza `'No se encontró la receta solicitada.'` sin ocultar errores reales.
3. **Creación (`createRecipe(payload)`):**
   - Envía JSON a `POST /api/recipes` y recibe el registro ya guardado en `src/data/recipes.json` con su `id` asignado por el servidor (evitando colisiones de ID).
4. **Actualización (`updateRecipe(id, payload)`):**
   - Envía JSON a `PUT /api/recipes/:id`, actualiza `src/data/recipes.json` en disco y refresca la caché local. Si el servidor devuelve `404`/`400`, propaga el error.
5. **Eliminación (`deleteRecipe(id)`):**
   - Envía `DELETE /api/recipes/:id`, remueve la receta de `src/data/recipes.json`, limpia la caché local y elimina el ID de favoritos con `removeFavorite(id)`.
6. **Restablecimiento de Caché Local (`resetLocalRecipeChanges()`):**
   - Disponible desde `/settings`, limpia la caché offline (`gastrolab_local_recipes`) para forzar lectura fresca desde `recipes.json` o restaurar las 30 recetas base en modo sin conexión.
