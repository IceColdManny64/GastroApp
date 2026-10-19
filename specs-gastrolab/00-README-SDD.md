# GastroLab — Especificación de Desarrollo Guiado por Especificaciones (SDD)
## Master Index & Guía Autónoma para el Agente

> **Proyecto:** `GastroLab`  
> **Ruta de Desarrollo Objetivo:** `/GastroLab` (p. ej. `C:\Users\manue\Documents\React\GastroLab`)  
> **Backend Remoto (PHP + MySQL):** `http://apifake.mywebcommunity.org`  
> **Stack Tecnológico:** React Native (`0.86.3`) + Expo SDK `~57.0.0` + Expo Router (`~57.0.17`) + TypeScript (`~6.0.3`)

---

## 1. Propósito de este Conjunto de Especificaciones (SDD Autocontenido)

Este conjunto de documentos constituye el **Software Design Document (SDD)** completo y **100% autocontenido** para que un agente de IA diseñe y desarrolle de principio a fin la aplicación móvil y web **GastroLab** dentro de la ruta `/GastroLab`.

**El agente NO necesita buscar ni consultar ningún otro proyecto, archivo externo ni código del servidor**, ya que toda la definición de la arquitectura, los contratos exactos del backend PHP/MySQL, las reglas de negocio y los **patrones exactos de sintaxis y estructura de código** están completamente especificados dentro de estos documentos.

---

## 2. Reglas de Oro para el Agente

1. **Ubicación Estricta del Proyecto (`/GastroLab`):**
   - Todo el código de la aplicación debe crearse y mantenerse dentro de la carpeta `/GastroLab`.
   - El agente solo debe desarrollar el **Frontend móvil/web**, conectándose al backend existente en `http://apifake.mywebcommunity.org`.
2. **Documentación Oficial Expo v57.0.0:**
   - Antes de usar cualquier API nativa de Expo, respeta la especificación de `https://docs.expo.dev/versions/v57.0.0/` (por ejemplo, en `expo-image-picker` se usa `mediaTypes: ['images']` en lugar del enum deprecado `MediaTypeOptions.Images`).
3. **Convención Bilingüe Estricta (Inglés US en Código / Español Latino en UI):**
   - **Código fuente (Inglés US):** Todos los nombres de variables, estados, funciones, hooks, interfaces, tipos, archivos, carpetas y constantes deben escribirse en **inglés (US)** (`camelCase` para variables/funciones, `PascalCase` para componentes/interfaces, `UPPER_SNAKE_CASE` para constantes). Ejemplos: `fetchWithAuth`, `RecipeItem`, `handleSave`, `handleDelete`, `useFocusEffect`, `itemsPerPage`.
   - **Interfaz de Usuario y Mensajes (Español Latino):** Todos los textos visibles por el usuario final (`Text`, `placeholder`, títulos del `Stack.Screen`, `Alert.alert`, mensajes de validación y error) deben estar redactados en **español latino** claro y natural.
4. **Adherencia Estricta a la Sintaxis y Estructura Global del Proyecto:**
   - El agente debe escribir todo el código respetando rigurosamente los patrones sintácticos detallados en el documento **`01-ARCHITECTURE-AND-CODING-STANDARDS.md`** (componentes funcionales con `export default function NombreScreen()`, hooks nativos de React `useState`/`useCallback`/`useEffect`, recarga en foco con `useFocusEffect` de `expo-router`, servicios desacoplados en `src/services/`, utilidades en `src/utils/` y estilos con `StyleSheet.create` al final de cada archivo).

---

## 3. Índice de Documentos del SDD

El agente debe leer estos documentos en orden antes de escribir cualquier línea de código:

1. **[`01-ARCHITECTURE-AND-CODING-STANDARDS.md`](./01-ARCHITECTURE-AND-CODING-STANDARDS.md)**
   - **Estándar Global de Sintaxis y Estructura de Código:** Define con plantillas de código concretas cómo se deben estructurar las carpetas, cómo nombrar e importar módulos, cómo escribir los servicios HTTP, las pantallas de listado (`FlatList`), las vistas de detalle (`ScrollView`), los formularios (`ImagePicker` + `FormData`), el enrutamiento (`Stack`) y los bloques `StyleSheet.create`.
2. **[`02-BACKEND-PHP-AND-API-CONNECTION.md`](./02-BACKEND-PHP-AND-API-CONNECTION.md)**
   - **Especificación Completa del Backend PHP y Conexión Segura:** Documenta al detalle el funcionamiento interno de los endpoints PHP en `http://apifake.mywebcommunity.org` (`login.php`, `register.php`, `recipe.php`, `updateCredentials.php`, `users.php`), el esquema real de las tablas MySQL (`gastroRecipe` y `gastroLogin`), los payloads de entrada/salida, códigos HTTP y cómo implementar `fetchWithAuth` de forma segura, eficiente y sin errores de CORS preflight.
3. **[`03-DATA-MODELS-AND-VALIDATIONS.md`](./03-DATA-MODELS-AND-VALIDATIONS.md)**
   - **Modelos TypeScript, Adaptadores y Validaciones:** Interfaces exactas (`RecipeItem`, `RawRecipeDto`, `UserSession`, `UserSettings`), funciones adaptadoras para normalizar tipos de MySQL (`string` vs `number`), y reglas de validación de campos obligatorios y verificación de tipos.
4. **[`04-FEATURES-AND-USER-STORIES.md`](./04-FEATURES-AND-USER-STORIES.md)**
   - **Especificación Funcional de los 9 Módulos:** Autenticación/Registro, Catálogo, Vista Detallada, CRUD completo con imágenes, Búsqueda y Filtros, Favoritos persistentes, Paginación configurable (10, 20 o 30 elementos por página), Ajustes de usuario y Manejo de errores (Back y Front).
5. **[`05-UI-UX-DESIGN-SYSTEM.md`](./05-UI-UX-DESIGN-SYSTEM.md)**
   - **Sistema de Diseño UI/UX:** Paleta de colores gastronómica (Modo Claro y Modo Oscuro), tipografía, anatomía de tarjetas e insignias (badges de categoría, dificultad, tiempo de preparación y aprobación), micro-interacciones (`pressed && styles.cardPressed`) y diseño responsivo.
6. **[`06-IMPLEMENTATION-ROADMAP.md`](./06-IMPLEMENTATION-ROADMAP.md)**
   - **Plan de Implementación Paso a Paso y Checklist de Aceptación:** Secuencia ordenada de construcción en `/GastroLab` y validaciones finales con TypeScript (`npx tsc --noEmit`).
