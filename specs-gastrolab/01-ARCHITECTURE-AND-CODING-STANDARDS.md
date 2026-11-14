# 01 — Arquitectura, Estructura de Directorios y Estándar Global de Sintaxis de Código

## 1. Visión General y Stack Oficial

**GastroLab** es una aplicación móvil y web multiplataforma 100% Frontend para explorar un catálogo de 30 recetas de cocina con sus imágenes originales por URL, gestionar platillos (CRUD completo con fotografías), administrar favoritos y configurar preferencias y credenciales del usuario con persistencia local multiplataforma.

- **Ruta de Desarrollo Obligatoria:** `/GastroLab`
- **Configuración de `package.json` Base (Expo SDK 58):**
  ```json
  {
    "name": "gastrolab",
    "main": "expo-router/entry",
    "version": "1.0.0",
    "dependencies": {
      "@expo/ui": "~58.0.28",
      "expo": "~58.0.25",
      "expo-constants": "~58.0.16",
      "expo-device": "~58.0.5",
      "expo-font": "~58.0.12",
      "expo-image": "~58.0.18",
      "expo-image-picker": "~58.0.10",
      "expo-linking": "~58.0.17",
      "expo-router": "~58.0.31",
      "expo-secure-store": "~58.0.3",
      "expo-splash-screen": "~58.0.14",
      "expo-status-bar": "~58.0.5",
      "expo-symbols": "~58.0.5",
      "expo-system-ui": "~58.0.7",
      "expo-web-browser": "~58.0.8",
      "react": "19.3.0",
      "react-dom": "19.3.0",
      "react-native": "0.88.1",
      "react-native-gesture-handler": "~3.3.0",
      "react-native-reanimated": "4.7.1",
      "react-native-safe-area-context": "~5.11.1",
      "react-native-screens": "~4.30.1",
      "react-native-web": "~0.21.0",
      "react-native-worklets": "0.13.0"
    },
    "devDependencies": {
      "@types/react": "~19.3.0",
      "typescript": "~6.0.3"
    },
    "scripts": {
      "start": "expo start",
      "android": "expo start --android",
      "ios": "expo start --ios",
      "web": "expo start --web",
      "lint": "expo lint"
    },
    "private": true
  }
  ```

---

## 2. Estructura Exacta del Proyecto (`/GastroLab`)

Todo el código fuente debe ubicarse dentro de `/GastroLab/src/` utilizando los grupos de rutas de Expo Router `(auth)` y `(app)` y el alias de importación `@/*` (`"./src/*"` en `tsconfig.json`):

```text
/GastroLab
├── app.json                         # Configuración de Expo SDK 58 (orientation: "default")
├── package.json                     # Dependencias Expo SDK 58
├── tsconfig.json                    # Configuración de TypeScript con alias "@/*": ["./src/*"]
└── src/
    ├── app/                         # Pantallas y grupos de rutas de Expo Router
    │   ├── _layout.tsx              # RootLayout con SplashScreen.preventAutoHideAsync(), SafeAreaProvider y Stack
    │   ├── index.tsx                # Gatekeeper raíz (checking/isLoggedIn con <Redirect href="/(app)/home" | "/(auth)/login" />)
    │   ├── (auth)/                  # Grupo de rutas públicas de autenticación
    │   │   ├── _layout.tsx          # AuthLayout
    │   │   ├── login.tsx            # LoginScreen (Inicio de sesión y recuperación de contraseña)
    │   │   └── register.tsx         # RegisterScreen (Registro local de nuevos usuarios)
    │   └── (app)/                   # Grupo de rutas protegidas de la aplicación
    │       ├── _layout.tsx          # AppLayout (Verifica token y redirige a /(auth)/login si no hay sesión)
    │       ├── home.tsx             # HomeScreen (Catálogo principal, búsqueda, filtros y paginación)
    │       ├── details.tsx          # DetailScreen (Vista detallada de receta + botones Editar/Eliminar/Favorito)
    │       ├── form.tsx             # FormScreen (Crear / Actualizar receta con validaciones e ImagePicker)
    │       ├── favorites.tsx        # FavoritesScreen (Vista de recetas guardadas en favoritos)
    │       └── settings.tsx         # SettingsScreen (Preferencias de paginación/tema + cambio de credenciales)
    ├── components/
    │   └── ui/
    │       ├── card.tsx             # Componente visual de tarjeta de receta (Recipe Card)
    │       ├── searchFilterBar.tsx  # Barra de búsqueda y chips de filtrado/ordenamiento
    │       └── paginationBar.tsx    # Selector de 10/20/30 elementos por página y navegación
    ├── data/
    │   └── recipesData.ts           # Catálogo embebido con las 30 recetas originales y sus URLs de imagen
    ├── services/
    │   ├── recipes.ts               # Funciones CRUD del dominio (getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe)
    │   └── user.ts                  # Funciones de perfil y credenciales locales (getUserProfile, verifyEmail, verifyPassword, updateCredentials)
    ├── types/
    │   ├── RecipeItem.ts            # Interfaces RecipeItem, RawRecipeDto, RecipeFilterState
    │   └── Auth.ts                  # Interfaces AuthResponse, UserSession, UserSettings
    └── utils/
        ├── api.ts                   # Helper local fetchWithAuth<T>() con verificación de token activo
        ├── auth.ts                  # Funciones locales login() y registerUser()
        ├── tokenStorage.ts          # Funciones isWebStorageAvailable(), saveToken(), getToken(), deleteToken()
        ├── preferencesStorage.ts    # Persistencia de usuarios, favoritos, overlay CRUD y settings
        └── validators.ts            # Validaciones de formularios y verificación de tipos de datos
```

---

## 3. Estándar Global de Sintaxis, Políticas de Clase y Patrones de Código (Obligatorio)

El agente debe escribir **todos** los archivos siguiendo exactamente el estilo sintáctico y las políticas de clase detalladas a continuación:

1. **Alias de Importación `@/`:**
   - Importar siempre los módulos internos con `@/components/...`, `@/services/...`, `@/types/...`, `@/utils/...`, `@/data/...`.
2. **Guardia de Sesión por Grupos `(auth)` y `(app)` con `<Redirect />`:**
   - `src/app/index.tsx` y `src/app/(app)/_layout.tsx` usan los estados `const [checking, setChecking] = useState(true);` y `const [isLoggedIn, setIsLoggedIn] = useState(false);` con una IIFE asíncrona dentro de `useEffect`:
     ```tsx
     useEffect(() => {
       (async () => {
         const token = await getToken();
         setIsLoggedIn(!!token);
         setChecking(false);
       })();
     }, []);
     ```
   - Mientras `checking` es `true`, renderizan un `<ActivityIndicator size="large" />` centrado. Al terminar, redirigen declarativamente con `<Redirect href="/(app)/home" />` o `<Redirect href="/(auth)/login" />`.
3. **Política de `tokenStorage.ts` (`isWebStorageAvailable` + `export async function`):**
   - Antes de acceder a `localStorage` en Web, usar siempre la función guardiana:
     ```ts
     function isWebStorageAvailable(): boolean {
       return Platform.OS === 'web' && typeof localStorage !== 'undefined';
     }
     ```
   - Declarar las funciones exportadas de utilidades y servicios mediante `export async function saveToken(...)`, `export async function getToken()`, `export async function deleteToken()`.
4. **Política de Inputs y Botones durante Carga (`editable={!loading}`, `disabled={loading}`):**
   - En todos los formularios (`login.tsx`, `register.tsx`, `form.tsx`, `settings.tsx`), cada `<TextInput />` debe incluir `autoCapitalize="none"` (cuando aplique) y `editable={!loading}` (o `editable={!saving}`).
   - El botón `<Pressable />` de envío debe incluir `disabled={loading}`, estilo condicional `[styles.button, loading && styles.buttonDisabled]` y mostrar `<ActivityIndicator color="#FFFFFF" />` cuando `loading` sea `true`.
5. **Política de `FlatList` y Paso de Parámetros a `DetailScreen`:**
   - Usar `const [loading, setLoading] = useState<boolean>(true);` con tipo booleano explícito.
   - Incluir `showsVerticalScrollIndicator={false}` y `ListEmptyComponent` en cada `<FlatList />`.
   - Al navegar al detalle desde una tarjeta (`Card`), enviar tanto el `id` como el objeto serializado `params: { id: String(item.id), item: JSON.stringify(item) }` para hidratación instantánea con `JSON.parse` y sincronización en `useFocusEffect`.
