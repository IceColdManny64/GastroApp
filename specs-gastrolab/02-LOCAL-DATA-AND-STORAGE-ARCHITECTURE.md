# 02 — Arquitectura de Datos Locales (30 Recetas Originales) y Persistencia Frontend

## 1. Visión General de la Capa de Datos 100% Frontend

**GastroLab** opera íntegramente como una aplicación Frontend autónoma sin depender de ningún servidor externo. Toda la información se gestiona localmente mediante dos capas:

1. **Catálogo Base Embebido (`src/data/recipesData.ts`):**
   - Contiene los **30 registros originales de recetas** (`INITIAL_RECIPES_DATA`) con sus títulos, descripciones, tiempos de preparación (`preparetime`), porcentajes de aprobación (`likerate`), categorías (`category`), dificultades (`difficulty`) y sus **URLs de imágenes originales (`imageURL`)**.
2. **Almacenamiento Persistente Multiplataforma (`src/utils/tokenStorage.ts` y `src/utils/preferencesStorage.ts`):**
   - En **Android / iOS**: Utiliza `expo-secure-store` (con respaldo en memoria).
   - En **Web**: Utiliza `localStorage` (con respaldo en memoria).
   - Persiste cuentas de usuario locales, la sesión activa (`token` + `UserSession`), la lista de favoritos por usuario, las preferencias de configuración (`UserSettings`) y el overlay de cambios CRUD (`createdRecipes`, `updatedRecipesById`, `deletedRecipeIds`).

---

## 2. Catálogo Completo de las 30 Recetas (`src/data/recipesData.ts`)

El archivo `src/data/recipesData.ts` debe exportar la constante `INITIAL_RECIPES_DATA: RawRecipeDto[]` con los siguientes 30 registros exactos y sus URLs de imagen:

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

## 3. Autenticación y Gestión de Usuarios Local (`src/utils/auth.ts` y `src/services/user.ts`)

### 3.1 Cuenta Predeterminada y Registro Local (`preferencesStorage.ts`)
- Al iniciar la aplicación por primera vez, el almacenamiento local inicializa una lista de usuarios (`DEFAULT_LOCAL_USERS`) con una cuenta predeterminada lista para usar:
  - **Correo:** `admin@gastrolab.com`
  - **Contraseña:** `1234`
- Cualquier usuario nuevo registrado en `/register` se agrega de forma persistente a la colección local mediante `saveLocalUsers(users)`.

### 3.2 Flujo de Login (`login` en `src/utils/auth.ts`)
- Busca coincidencia exacta de `email` (case-insensitive) y `password` en `getLocalUsers()`.
- Si las credenciales son válidas, genera un token de sesión (`gastrolab-session-${user.id}-${Date.now()}`), lo persiste mediante `saveToken(token)` y `saveUserSession({ id: user.id, email: user.email, token })`, y retorna el token.
- Si no coinciden, lanza un `Error('Credenciales inválidas. Verifica tu correo y contraseña.')`.

### 3.3 Flujo de Perfil y Cambio de Credenciales (`src/services/user.ts`)
- **`getUserProfile(userId)`:** Devuelve `{ id, email }` del usuario almacenado localmente.
- **`verifyPassword(userId, currentPassword)`:** Comprueba que la contraseña actual coincida con la del usuario antes de permitir actualizar credenciales en `/settings`.
- **`updateCredentials(userId, newEmail, newPassword)`:** Actualiza el correo y la contraseña en `getLocalUsers()` y sincroniza la sesión activa (`saveUserSession`).

---

## 4. Motor CRUD Local sobre las 30 Recetas (`src/services/recipes.ts`)

Para que todas las operaciones CRUD (Crear, Leer, Actualizar y Eliminar) funcionen de forma inmediata, persistente y reversible sin servidor externo, `src/services/recipes.ts` combina `INITIAL_RECIPES_DATA` con `RecipeCrudOverlay` almacenado en `preferencesStorage.ts`:

```typescript
export interface RecipeCrudOverlay {
  createdRecipes: RecipeItem[];
  updatedRecipesById: Record<number, RecipeItem>;
  deletedRecipeIds: number[];
}
```

1. **Lectura del Catálogo (`getRecipes(search?)`):**
   - Parte de las 30 recetas de `INITIAL_RECIPES_DATA` normalizadas con `adaptRecipeDtoToItem`.
   - Filtra cualquier receta cuyo `id` esté en `overlay.deletedRecipeIds`.
   - Sustituye cualquier receta cuyo `id` exista en `overlay.updatedRecipesById`.
   - Antepone las recetas creadas por el usuario (`overlay.createdRecipes`).
   - Si se proporciona el parámetro `search`, filtra por coincidencia en `title`, `description`, `category` o `difficulty`.
2. **Detalle de Receta (`getRecipe(id)`):**
   - Busca la receta en el catálogo fusionado y lanza un error descriptivo en español si no existe o fue eliminada.
3. **Creación (`createRecipe(formData, payload)`):**
   - Genera un nuevo `id` numérico incremental (`maxId + 1`), construye el `RecipeItem` con la imagen seleccionada (o URL ingresada) y lo guarda en `overlay.createdRecipes`.
4. **Actualización (`updateRecipe(id, formData, payload)`):**
   - Actualiza el registro en `overlay.createdRecipes` (si fue creado por el usuario) o en `overlay.updatedRecipesById[id]` (si es una de las 30 recetas originales).
5. **Eliminación (`deleteRecipe(id)`):**
   - Agrega el `id` a `overlay.deletedRecipeIds` y lo remueve de `createdRecipes` y `updatedRecipesById`.
6. **Restablecimiento de Datos Originales (`clearCrudOverlay()`):**
   - Disponible desde `/settings`, limpia el overlay para restaurar instantáneamente las 30 recetas originales intactas.
