# 01 — Arquitectura, Estructura de Directorios y Estándar Global de Sintaxis de Código

## 1. Visión General y Stack Oficial

**GastroLab** es una aplicación móvil y web multiplataforma para explorar un catálogo de recetas de cocina, gestionar platillos (CRUD completo con fotografías), administrar favoritos y configurar preferencias y credenciales del usuario, conectada al backend remoto `http://apifake.mywebcommunity.org`.

- **Ruta de Desarrollo Obligatoria:** `/GastroLab`
- **Configuración de `package.json` Base (Expo SDK 57):**
  ```json
  {
    "name": "gastrolab",
    "main": "expo-router/entry",
    "version": "1.0.0",
    "dependencies": {
      "@expo/ui": "~57.0.14",
      "expo": "~57.0.18",
      "expo-constants": "~57.0.16",
      "expo-device": "~57.0.1",
      "expo-font": "~57.0.2",
      "expo-image": "~57.0.3",
      "expo-image-picker": "~57.0.2",
      "expo-linking": "~57.0.8",
      "expo-router": "~57.0.17",
      "expo-secure-store": "~57.0.2",
      "expo-splash-screen": "~57.0.8",
      "expo-status-bar": "~57.0.1",
      "expo-symbols": "~57.0.2",
      "expo-system-ui": "~57.0.3",
      "expo-web-browser": "~57.0.2",
      "react": "19.2.3",
      "react-dom": "19.2.3",
      "react-native": "0.86.3",
      "react-native-gesture-handler": "~2.32.0",
      "react-native-reanimated": "4.5.1",
      "react-native-safe-area-context": "~5.7.0",
      "react-native-screens": "~4.26.0",
      "react-native-web": "~0.21.0",
      "react-native-worklets": "0.10.1"
    },
    "devDependencies": {
      "@types/react": "~19.2.2",
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

Todo el código fuente debe ubicarse dentro de `/GastroLab/src/` respetando esta jerarquía de carpetas:

```text
/GastroLab
├── app.json                         # Configuración de Expo + permisos HTTP cleartext
├── package.json                     # Dependencias Expo SDK 57
├── tsconfig.json                    # Configuración de TypeScript
└── src/
    ├── app/                         # Pantallas y rutas de Expo Router
    │   ├── _layout.tsx              # RootLayout con SafeAreaProvider y Stack
    │   ├── index.tsx                # LoginScreen (Ruta '/' con verificación de sesión previa)
    │   ├── register.tsx             # RegisterScreen (Registro de nuevos usuarios)
    │   ├── home.tsx                 # HomeScreen (Catálogo principal, búsqueda, filtros y paginación)
    │   ├── details.tsx              # DetailScreen (Vista detallada de receta + botones Editar/Eliminar/Favorito)
    │   ├── form.tsx                 # FormScreen (Crear / Actualizar receta con validaciones e ImagePicker)
    │   ├── favorites.tsx            # FavoritesScreen (Vista de recetas guardadas en favoritos)
    │   └── settings.tsx             # SettingsScreen (Preferencias de paginación/tema + cambio de credenciales)
    ├── components/
    │   └── ui/
    │       ├── card.tsx             # Componente visual de tarjeta de receta (Recipe Card)
    │       ├── searchFilterBar.tsx  # Barra de búsqueda y chips de filtrado/ordenamiento
    │       └── paginationBar.tsx    # Selector de 10/20/30 elementos por página y navegación
    ├── services/
    │   ├── recipes.ts               # Funciones CRUD del dominio (getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe)
    │   └── user.ts                  # Funciones de perfil y credenciales (verifyEmail, verifyPassword, updateCredentials)
    ├── types/
    │   ├── RecipeItem.ts            # Interfaces RecipeItem, RawRecipeDto, RecipeFilterState
    │   └── Auth.ts                  # Interfaces AuthResponse, UserSession, UserSettings
    └── utils/
        ├── api.ts                   # Función genérica fetchWithAuth<T>()
        ├── auth.ts                  # Funciones login() y register()
        ├── tokenStorage.ts          # Funciones saveToken(), getToken(), deleteToken(), getUserSession()
        ├── preferencesStorage.ts    # Persistencia de favoritos y settings del usuario
        └── validators.ts            # Validaciones de formularios y verificación de tipos de datos
```

---

## 3. Estándar Global de Sintaxis y Patrones de Código (Obligatorio)

El agente debe escribir **todos** los archivos siguiendo exactamente el estilo sintáctico que se detalla a continuación. **No utilices librerías externas de estado complejas (como Redux o MobX), ni librerías de estilos externas (como NativeWind o Styled Components)**. Todo debe construirse con hooks estándar de React, `expo-router` y `StyleSheet.create`.

### 3.1 Patrón para `_layout.tsx` (Navegación Principal)
Usa `SafeAreaProvider` envolviendo un `Stack` de `expo-router` con títulos en español latino:

```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Iniciar Sesión' }} />
        <Stack.Screen name="register" options={{ title: 'Crear Cuenta' }} />
        <Stack.Screen name="home" options={{ title: 'Catálogo de Recetas' }} />
        <Stack.Screen name="details" options={{ title: 'Detalle de Receta' }} />
        <Stack.Screen name="form" options={{ title: 'Formulario de Receta' }} />
        <Stack.Screen name="favorites" options={{ title: 'Mis Favoritos' }} />
        <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
```

### 3.2 Patrón para Almacenamiento de Token (`src/utils/tokenStorage.ts`)
El módulo `tokenStorage.ts` debe exportar funciones asíncronas claras con logs de trazabilidad en consola. Debe exponer tanto `deleteToken` como `removeToken` (como alias) para máxima consistencia, además de guardar los datos básicos del usuario (`id` y `email`) necesarios para el endpoint `updateCredentials.php`:

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserSession } from '../types/Auth';

const TOKEN_KEY = 'gastrolab_auth_token';
const SESSION_KEY = 'gastrolab_user_session';

let tokenInMemory: string | null = null;
let sessionInMemory: UserSession | null = null;

export const saveToken = async (token: string): Promise<void> => {
  tokenInMemory = token;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
    console.log('[tokenStorage.ts] Token guardado:', token);
  } catch (err) {
    console.warn('[tokenStorage.ts] Fallback a memoria al guardar token:', err);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) tokenInMemory = stored;
    } else {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) tokenInMemory = stored;
    }
  } catch (err) {
    console.warn('[tokenStorage.ts] Usando token en memoria:', err);
  }
  console.log('[tokenStorage.ts] Obteniendo token:', tokenInMemory);
  return tokenInMemory;
};

export const deleteToken = async (): Promise<void> => {
  tokenInMemory = null;
  sessionInMemory = null;
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
    console.log('[tokenStorage.ts] Token eliminado (Logout exitoso)');
  } catch (err) {
    console.warn('[tokenStorage.ts] Error limpiando storage:', err);
  }
};

export const removeToken = deleteToken;
```

### 3.3 Patrón para Servicios del Dominio (`src/services/recipes.ts`)
El archivo de servicios debe importar el modelo desde `../types/RecipeItem` y la función `fetchWithAuth` desde `../utils/api`, exponiendo funciones asíncronas tipadas:

```typescript
import { RecipeItem, RawRecipeDto, RecipeFormPayload } from '../types/RecipeItem';
import { fetchWithAuth } from '../utils/api';

const ENDPOINT = '/recipe.php';

export async function getRecipes(search?: string): Promise<RecipeItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await fetchWithAuth<RawRecipeDto[]>(`${ENDPOINT}${query}`);
  console.log('[recipes.ts] Respuesta del backend:', data?.length);
  // Adaptar cada elemento con adaptRecipeDtoToItem y fusionar con cambios CRUD
  return adaptedList;
}

export async function getRecipe(id: number): Promise<RecipeItem> {
  const data = await fetchWithAuth<RawRecipeDto>(`${ENDPOINT}?id=${id}`);
  return adaptRecipeDtoToItem(data);
}

export async function createRecipe(formData: FormData, payload: RecipeFormPayload): Promise<RecipeItem> {
  // Petición POST con fetchWithAuth y sincronización
}

export async function updateRecipe(id: number, formData: FormData, payload: RecipeFormPayload): Promise<RecipeItem> {
  // Petición PUT con fetchWithAuth y sincronización
}

export async function deleteRecipe(id: number): Promise<void> {
  // Petición DELETE con fetchWithAuth y sincronización
}
```

### 3.4 Patrón Sintáctico para la Pantalla de Catálogo (`src/app/home.tsx`)
La pantalla de catálogo debe seguir exactamente esta estructura:
- Estados: `recipes`, `loading`, `error`, `refreshing`.
- Función `fetchRecipes` envuelta en `useCallback`.
- Recarga automática al enfocar la pantalla usando `useFocusEffect(useCallback(() => { fetchRecipes(); }, [fetchRecipes]))`.
- Función `onRefresh` para pull-to-refresh en el `FlatList`.
- Renderizado condicional temprano para `if (loading)` (con `ActivityIndicator` y texto `"Cargando recetas..."`) y `if (error)` (con texto del error y `<Pressable onPress={fetchRecipes}>` `"Reintentar"`).
- Renderizado principal con `<FlatList data={paginatedRecipes} keyExtractor={(item) => String(item.id)} ... />` y navegación a `/details` pasando `params: { id: String(item.id) }`.

```tsx
export default function HomeScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    await deleteToken();
    router.replace('/');
  };

  const fetchRecipes = useCallback(async () => {
    try {
      setError(null);
      const data = await getRecipes();
      console.log('[home.tsx] Data recibida:', data?.length);
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.message}>Cargando recetas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchRecipes} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Encabezado, Barra de Búsqueda/Filtros, FlatList de Card y PaginationBar */}
    </View>
  );
}
```

### 3.5 Patrón Sintáctico para la Vista Detallada (`src/app/details.tsx`)
La vista de detalle debe seguir exactamente este patrón con bandera `let isActive = true` dentro de `useFocusEffect`, manejo de edición (`handleEdit`) pasando el objeto serializado con `JSON.stringify(recipe)` hacia `/form`, y eliminación (`handleDelete`) con diálogo de confirmación:

```tsx
export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeItem | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          setLoading(true);
          const fresh = await getRecipe(Number(id));
          if (isActive) setRecipe(fresh);
        } catch (err) {
          console.error('[details.tsx] Error al cargar detalle:', err);
          Alert.alert('Error', 'No se pudo cargar la receta');
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [id])
  );

  const handleEdit = () => {
    router.push({
      pathname: '/form',
      params: { recipe: JSON.stringify(recipe) },
    });
  };

  const handleDelete = () => {
    if (!recipe) return;
    Alert.alert(
      'Confirmar',
      '¿Seguro que quieres eliminar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              router.back();
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'No se pudo eliminar'
              );
            }
          },
        },
      ]
    );
  };
  // ...
}
```

### 3.6 Patrón Sintáctico para el Formulario CRUD e Imágenes (`src/app/form.tsx`)
El formulario para crear y editar recetas debe usar exactamente este patrón con `expo-image-picker` y `FormData` diferenciando `Platform.OS === 'web'` de plataformas móviles:

```tsx
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

export default function FormScreen() {
  const { recipe } = useLocalSearchParams<{ recipe?: string }>();
  const editing: RecipeItem | null = recipe ? JSON.parse(recipe) : null;
  const router = useRouter();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [imageUri, setImageUri] = useState<string | null>(editing?.image ?? null);
  const [prepareTime, setPrepareTime] = useState(editing?.prepareTime ?? '00:30:00');
  const [likeRate, setLikeRate] = useState(String(editing?.likeRate ?? 90));
  const [category, setCategory] = useState(editing?.category ?? 'Mexicanas');
  const [difficulty, setDifficulty] = useState(editing?.difficulty ?? 'Facil');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // 1. Ejecutar validación de campos obligatorios y tipos de dato
    // 2. Construir FormData diferenciando Platform.OS === 'web' (blob) vs nativo ({ uri, name, type })
    // 3. Llamar a updateRecipe(...) si editing existe, o createRecipe(...) si es nueva
    // 4. Llamar a router.back()
  };
  // ...
}
```

### 3.7 Patrón Sintáctico para Componentes de Tarjeta (`src/components/ui/card.tsx`)
El componente de tarjeta debe usar `Pressable` con función de estilo `({ pressed }) => [styles.card, pressed && styles.cardPressed]`:

```tsx
interface CardProps {
  title: string;
  image: string;
  description: string;
  category: string;
  difficulty: string;
  prepareTime: string;
  likeRate: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

const Card = ({
  title,
  image,
  description,
  category,
  difficulty,
  prepareTime,
  likeRate,
  isFavorite,
  onToggleFavorite,
  onPress,
}: CardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Imagen con badges de categoría y botón de favorito + bloque content */}
    </Pressable>
  );
};

export default Card;
```
