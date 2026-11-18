# GastroLab — Especificación de Desarrollo Guiado por Especificaciones (SDD)
## Master Index & Guía Autónoma para el Agente

> **Proyecto:** `GastroLab`  
> **Ruta de Desarrollo Objetivo:** `/GastroLab` (p. ej. `C:\Users\manue\Documents\React\GastroLab`)  
> **Arquitectura:** Aplicación Frontend Expo/React Native + Microservicio Local JSON minimalista (`server.js`) sobre `recipes.json` y `users.json` con respaldo local automático en dispositivo  
> **Stack Tecnológico:** React Native (`0.88.1`) + Expo SDK `~58.0.0` + Expo Router (`~58.0.31`) + TypeScript (`~6.0.3`) + Node.js HTTP (`server.js`)

---

## 1. Propósito de este Conjunto de Especificaciones (SDD Autocontenido)

Este conjunto de documentos constituye el **Software Design Document (SDD)** completo y **100% autocontenido** para que un agente de IA diseñe y desarrolle de principio a fin la aplicación móvil y web **GastroLab** dentro de la ruta `/GastroLab`.

**El agente NO necesita servidores externos en la nube ni bases de datos complejas**, ya que toda la definición de la arquitectura, el catálogo completo de las 30 recetas base (`src/data/recipes.json`), los usuarios (`src/data/users.json`), el microservicio mínimo en Node.js (`server.js`), el respaldo offline y los **patrones exactos de sintaxis y estructura de código** están completamente especificados dentro de estos documentos.

---

## 2. Reglas de Oro para el Agente

1. **Ubicación Estricta del Proyecto (`/GastroLab`):**
   - Todo el código de la aplicación debe crearse y mantenerse dentro de la carpeta `/GastroLab`.
   - La aplicación persiste recetas y cuentas directamente en **`src/data/recipes.json`** y **`src/data/users.json`** mediante un microservicio local súper básico en **`server.js`** (`http://localhost:3001`), y cuenta con un respaldo local sencillo en el dispositivo (`expo-secure-store` / `localStorage`) si el microservicio local no está encendido.
2. **Documentación Oficial Expo v58.0.0:**
   - Antes de usar cualquier API nativa de Expo, respeta la especificación de `https://docs.expo.dev/versions/v58.0.0/` (por ejemplo, en `expo-image-picker` se usa `mediaTypes: ['images']` en lugar del enum deprecado `MediaTypeOptions.Images`).
3. **Convención Bilingüe Estricta (Inglés US en Código / Español Latino en UI):**
   - **Código fuente (Inglés US):** Todos los nombres de variables, estados, funciones, hooks, interfaces, tipos, archivos, carpetas y constantes deben escribirse en **inglés (US)** (`camelCase` para variables/funciones, `PascalCase` para componentes/interfaces, `UPPER_SNAKE_CASE` para constantes). Ejemplos: `fetchWithAuth`, `RecipeItem`, `handleSave`, `handleDelete`, `useFocusEffect`, `itemsPerPage`.
   - **Interfaz de Usuario y Mensajes (Español Latino):** Todos los textos visibles por el usuario final (`Text`, `placeholder`, títulos del `Stack.Screen`, `Alert.alert`, mensajes de validación y error) deben estar redactados en **español latino** claro y natural.
4. **Adherencia Estricta a la Sintaxis y Estructura Global del Proyecto:**
   - El agente debe escribir todo el código respetando rigurosamente los patrones sintácticos detallados en el documento **`01-ARCHITECTURE-AND-CODING-STANDARDS.md`** (componentes funcionales con `export default function NombreScreen()`, hooks nativos de React `useState`/`useCallback`/`useEffect`, recarga en foco con `useFocusEffect` de `expo-router`, datos en `src/data/`, servicios desacoplados en `src/services/`, utilidades en `src/utils/` y estilos con `StyleSheet.create` al final de cada archivo).

---

## 3. Índice de Documentos del SDD

El agente debe leer estos documentos en orden antes de escribir cualquier línea de código:

1. **[`01-ARCHITECTURE-AND-CODING-STANDARDS.md`](./01-ARCHITECTURE-AND-CODING-STANDARDS.md)**
   - **Estándar Global de Sintaxis y Estructura de Código:** Define con plantillas de código concretas cómo se deben estructurar las carpetas, cómo nombrar e importar módulos, cómo escribir los servicios asíncronos, las pantallas de listado (`FlatList`), las vistas de detalle (`ScrollView`), los formularios (`ImagePicker`), el enrutamiento (`Stack`) y los bloques `StyleSheet.create`.
2. **[`02-LOCAL-DATA-AND-STORAGE-ARCHITECTURE.md`](./02-LOCAL-DATA-AND-STORAGE-ARCHITECTURE.md)**
   - **Especificación del Microservicio JSON (`server.js`), Catálogo (`recipes.json` / `users.json`) y Respaldo Local:** Documenta el catálogo de 30 recetas (`src/data/recipes.json`), el archivo de usuarios (`src/data/users.json`), la semilla offline (`src/data/recipesData.ts`), el microservicio REST mínimo (`server.js`), la autenticación (`src/utils/auth.ts`), el servicio CRUD (`src/services/recipes.ts`) y la persistencia en dispositivo (`src/utils/tokenStorage.ts` y `src/utils/preferencesStorage.ts`).
3. **[`03-DATA-MODELS-AND-VALIDATIONS.md`](./03-DATA-MODELS-AND-VALIDATIONS.md)**
   - **Modelos TypeScript, Adaptadores y Validaciones:** Interfaces exactas (`RecipeItem`, `RawRecipeDto`, `UserSession`, `UserSettings`), funciones adaptadoras para normalizar tipos (`string` vs `number`), y reglas de validación de campos obligatorios y verificación de tipos.
4. **[`04-FEATURES-AND-USER-STORIES.md`](./04-FEATURES-AND-USER-STORIES.md)**
   - **Especificación Funcional de los 9 Módulos:** Autenticación/Registro, Catálogo, Vista Detallada, CRUD completo con imágenes, Búsqueda y Filtros, Favoritos persistentes, Paginación configurable (10, 20 o 30 elementos por página), Ajustes de usuario y Manejo de errores.
5. **[`05-UI-UX-DESIGN-SYSTEM.md`](./05-UI-UX-DESIGN-SYSTEM.md)**
   - **Sistema de Diseño UI/UX:** Paleta de colores gastronómica (Modo Claro y Modo Oscuro), tipografía, anatomía de tarjetas e insignias (badges de categoría, dificultad, tiempo de preparación y aprobación), micro-interacciones (`pressed && styles.cardPressed`) y diseño responsivo con orientación libre (portrait y landscape).
6. **[`06-IMPLEMENTATION-ROADMAP.md`](./06-IMPLEMENTATION-ROADMAP.md)**
   - **Plan de Implementación Paso a Paso y Checklist de Aceptación:** Secuencia ordenada de construcción en `/GastroLab` y validaciones finales con TypeScript (`npx tsc --noEmit`).
