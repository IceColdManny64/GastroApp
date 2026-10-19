# 02 — Especificación del Backend PHP/MySQL y Arquitectura de Conexión Segura

## 1. Arquitectura del Servidor Remoto

El backend de **GastroLab** ya existe y está alojado públicamente en:
- **URL Base:** `http://apifake.mywebcommunity.org`
- **Motor de Base de Datos:** MySQL (`4626429_apidb`), accedido mediante scripts PHP con `mysqli` y consultas preparadas (`prepare` / `bind_param`).
- **Tablas en MySQL:**
  1. `gastroLogin` (`id`, `email`, `password`) — Almacena las cuentas de usuario.
  2. `gastroRecipe` (`id`, `title`, `description`, `imageURL`, `preparetime`, `likerate`, `category`, `difficulty`) — Almacena el catálogo de 30 recetas de cocina.

El agente **NO necesita ver ni modificar los archivos PHP del servidor**; a continuación se documenta el comportamiento exacto línea por línea de cada uno de los endpoints para que el frontend se conecte con precisión absoluta.

---

## 2. Contratos Exactos de los Endpoints PHP

### 2.1 Conexión a Base de Datos (`config.php`)
Todos los endpoints incluyen `config.php`. Si la base de datos llega a presentar un error de conexión, el servidor imprime:
```json
{ "error": "Database connection failed: ..." }
```
Por ello, el cliente HTTP en el frontend debe verificar siempre si el objeto JSON devuelto contiene la clave `"error"`, incluso cuando el código de estado HTTP sea `200`.

---

### 2.2 Endpoint de Inicio de Sesión: `/login.php`
- **URL Completa:** `http://apifake.mywebcommunity.org/login.php`
- **Método HTTP:** `POST` (Cualquier otro método HTTP, incluido `OPTIONS`, devuelve `HTTP 405` con `{"error": "Method Not Allowed"}`).
- **Headers de Respuesta del Servidor:**
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST`
  - `Access-Control-Allow-Headers: Content-Type`
  - `Content-Type: application/json; charset=UTF-8`
- **Formato de Entrada:** El servidor lee `json_decode(file_get_contents("php://input"), true)` esperando:
  ```json
  {
    "email": "usuario@correo.com",
    "password": "miPassword123"
  }
  ```
- **Respuestas Posibles:**
  - **Éxito (`HTTP 200`):**
    ```json
    {
      "login": "success",
      "id": 1,
      "email": "usuario@correo.com"
    }
    ```
  - **Credenciales Inválidas (`HTTP 401`):**
    ```json
    {
      "login": "failed",
      "message": "Invalid credentials"
    }
    ```
  - **Campos Faltantes (`HTTP 400`):**
    ```json
    {
      "error": "Missing required fields"
    }
    ```

---

### 2.3 Endpoint de Registro de Usuario: `/register.php`
- **URL Completa:** `http://apifake.mywebcommunity.org/register.php`
- **Método HTTP:** `POST` (Cualquier otro método devuelve `HTTP 405`).
- **Formato de Entrada (`php://input` JSON):**
  ```json
  {
    "email": "nuevo@correo.com",
    "password": "miPassword123"
  }
  ```
- **Respuestas Posibles:**
  - **Éxito (`HTTP 200`):**
    ```json
    { "store": "success" }
    ```
  - **Correo ya registrado (`HTTP 409 Conflict`):**
    ```json
    { "error": "email already exists" }
    ```
  - **Campos faltantes (`HTTP 400`):**
    ```json
    { "error": "Missing required fields" }
    ```
  - **Error de inserción (`HTTP 500`):**
    ```json
    { "error": "Database insert failed" }
    ```

---

### 2.4 Endpoint de Catálogo y Recetas: `/recipe.php`
- **URL Completa:** `http://apifake.mywebcommunity.org/recipe.php`
- **Headers de Respuesta del Servidor:**
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`
  - `Content-Type: application/json; charset=UTF-8`
- **Variantes de Consulta (`GET`):**
  1. **Obtener catálogo completo:**
     - `GET http://apifake.mywebcommunity.org/recipe.php`
     - Ejecuta `SELECT * FROM gastroRecipe` y devuelve un arreglo JSON de objetos.
     - **Nota importante de tipos:** En esta consulta general sin parámetros, el driver `mysqli` devuelve todos los campos como `string` (ejemplo: `"id": "3"`, `"likerate": "90"`).
  2. **Obtener una receta por su ID:**
     - `GET http://apifake.mywebcommunity.org/recipe.php?id=1`
     - Ejecuta una consulta preparada `SELECT * FROM gastroRecipe WHERE id = ?`.
     - Devuelve un único objeto JSON (donde `id` y `likerate` vienen como `number`: `1` y `90`). Si el ID no existe en la base de datos, devuelve `HTTP 200` con `{"error": "Recipe not found"}`.
  3. **Buscar recetas por término:**
     - `GET http://apifake.mywebcommunity.org/recipe.php?search=pollo`
     - Ejecuta `SELECT * FROM gastroRecipe WHERE title LIKE ? OR description LIKE ?` y devuelve un arreglo JSON con las coincidencias.

---

### 2.5 Endpoint de Actualización de Credenciales y Seguridad: `/updateCredentials.php`
- **URL Completa:** `http://apifake.mywebcommunity.org/updateCredentials.php`
- **Método HTTP:** `POST` (Cualquier otro método devuelve `HTTP 405`).
- **Funcionamiento:** Recibe un JSON en `php://input` con una propiedad obligatoria `"action"` que soporta 2 operaciones distintas:

1. **Verificar contraseña actual (`"action": "verify_password"`):**
   - **Request Body:**
     ```json
     {
       "action": "verify_password",
       "id": 1,
       "current_password": "miPasswordActual"
     }
     ```
   - **Response (`HTTP 200`):**
     ```json
     {
       "status": "success",
       "valid": true,
       "message": "Contraseña válida"
     }
     ```
     *(Si no coincide, devuelve `"valid": false, "message": "Contraseña incorrecta"`).*

2. **Actualizar correo y contraseña (`"action": "update_credentials"`):**
   - **Request Body:**
     ```json
     {
       "action": "update_credentials",
       "id": 1,
       "new_email": "nuevo@correo.com",
       "new_password": "nuevaPassword123"
     }
     ```
   - **Response (`HTTP 200`):**
     ```json
     {
       "status": "success",
       "message": "Credenciales actualizadas correctamente",
       "affected_rows": 1
     }
     ```
   - **Errores (`HTTP 400` / `HTTP 500`):**
     `{"status": "error", "message": "Formato de email inválido"}` o `{"status": "error", "message": "Campos requeridos faltantes: ..."}`.

---

### 2.6 Endpoint de Consulta de Usuarios: `/users.php`
- **URL Completa:** `http://apifake.mywebcommunity.org/users.php`
- **Métodos soportados:** `GET` y `OPTIONS`.
- **Consultas:**
  - `GET /users.php?id=1` -> Devuelve `{"id": 1, "email": "...", "password": "..."}` o `HTTP 404 {"error": "User not found"}`.
  - `GET /users.php` -> Devuelve un arreglo con todos los registros de `gastroLogin`.

---

## 3. Reglas de Ingeniería para una Conexión Segura y Eficiente

Para que todas las peticiones funcionen sin errores tanto en **Android**, **iOS** como en **Web**, el agente debe implementar estas 4 reglas técnicas en la capa de red (`src/utils/api.ts`, `src/utils/auth.ts` y `src/services/recipes.ts`):

### Regla 1: Evitar el Error `405 Method Not Allowed` en Peticiones POST (CORS Simple Requests)
- **Causa Técnica:** Los scripts `login.php`, `register.php` y `updateCredentials.php` rechazan cualquier método distinto de `POST` con `HTTP 405`. Cuando la app se ejecuta en un navegador web (`expo start --web`), si `fetch` envía el header `Content-Type: application/json` o un header `Authorization`, el navegador dispara automáticamente una petición preflight `OPTIONS` antes del `POST`. Como esos scripts PHP no tienen un bloque `if ($method === 'OPTIONS')`, responden `405 Method Not Allowed` y el navegador bloquea la petición.
- **Solución Obligatoria:**
  1. Como PHP lee el JSON directamente desde el flujo crudo `file_get_contents("php://input")` sin importar el header `Content-Type`, cuando se envíe un body JSON (`typeof options.body === 'string'`), usar el header `'Content-Type': 'text/plain;charset=UTF-8'`.
  2. `'text/plain;charset=UTF-8'` es un *CORS-safelisted header* según el estándar WHATWG Fetch, por lo que el navegador **no dispara el preflight `OPTIONS`**, enviando el `POST` directamente al script PHP con el JSON intacto en `php://input`.
  3. La verificación de autenticación (`getToken()`) se realiza en `fetchWithAuth` antes de disparar la petición de red, sin adjuntar un header `Authorization` no listado en el `Access-Control-Allow-Headers` del servidor PHP.

### Regla 2: Permitir Tráfico HTTP (`Cleartext Traffic`)
- **Causa Técnica:** El servidor `apifake.mywebcommunity.org` opera exclusivamente sobre `http://` (puerto 80) y rechaza conexiones `https://` (puerto 443).
- **Solución Obligatoria:**
  - Usar siempre `export const API_BASE_URL = 'http://apifake.mywebcommunity.org';`.
  - En `app.json`, configurar `"android": { "usesCleartextTraffic": true }` y `"ios": { "infoPlist": { "NSAppTransportSecurity": { "NSAllowsArbitraryLoads": true } } }`.

### Regla 3: Generación de Token de Sesión al Iniciar Sesión (`src/utils/auth.ts`)
- Cuando `POST /login.php` responde con `{"login": "success", "id": 1, "email": "..."}`, la función `login(email, password)` en `src/utils/auth.ts` debe generar un token de sesión estructurado (ej. `gastrolab-token-${data.id}-${Date.now()}`), guardar la sesión del usuario (`id`, `email`, `token`) y retornar el `token` string para que `index.tsx` ejecute `await saveToken(token)`.

### Regla 4: Sincronización CRUD Híbrida (`Write-Through + Local Overlay`) para `recipe.php`
- **Causa Técnica:** En el servidor, `recipe.php` declara soporte para `GET, POST, PUT, DELETE, OPTIONS` y decodifica `$input`, pero su bloque `switch ($method)` actualmente solo ejecuta consultas SQL dentro de `case 'GET':`, devolviendo una respuesta vacía (`""`) con código `200 OK` cuando recibe `POST`, `PUT` o `DELETE`.
- **Solución Obligatoria en `src/services/recipes.ts`:**
  1. **Envío de Petición Real:** `createRecipe`, `updateRecipe` y `deleteRecipe` siempre llaman primero a `fetchWithAuth` enviando la petición real (`POST`, `PUT` o `DELETE`) a `/recipe.php`.
  2. **Persistencia en Overlay Local (`preferencesStorage.ts`):**
     - Además de enviar la petición al servidor, `createRecipe` guarda la nueva receta en una lista local persistente (`createdRecipes`), `updateRecipe` guarda los campos modificados en un mapa (`updatedRecipesById[id]`) y `deleteRecipe` agrega el ID a `deletedRecipeIds`.
  3. **Fusión en Lectura (`getRecipes` y `getRecipe`):**
     - Cuando `getRecipes()` obtiene las 30 recetas de `GET /recipe.php`, filtra cualquier receta cuyo `id` esté en `deletedRecipeIds`, reemplaza las propiedades de las recetas que estén en `updatedRecipesById`, y coloca al inicio las recetas de `createdRecipes` (filtrándolas también si hay un término de búsqueda `?search=`).
     - Cuando `getRecipe(id)` consulta una receta individual, verifica primero si fue creada o actualizada localmente para devolver siempre la versión más reciente.

---

## 4. Implementación de Referencia para `src/utils/api.ts` y `src/utils/auth.ts`

### 4.1 `src/utils/api.ts`
```typescript
import { getToken } from './tokenStorage';

export const API_BASE_URL = 'http://apifake.mywebcommunity.org';
const REQUEST_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new ApiError('Sesión no encontrada. Por favor inicia sesión nuevamente.', 401);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[api.ts] ${options.method || 'GET'} -> ${url}`);

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'text/plain;charset=UTF-8';
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsedData: any = null;

    if (rawText && rawText.trim().length > 0) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        throw new ApiError('Respuesta inválida del servidor.', response.status);
      }
    }

    if (!response.ok) {
      const serverMessage =
        parsedData?.message || parsedData?.error || `Error HTTP: ${response.status}`;
      throw new ApiError(serverMessage, response.status);
    }

    if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData.error) {
      throw new ApiError(parsedData.error, 400);
    }

    return parsedData as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Tiempo de espera agotado al conectar con el servidor.', 408);
    }
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión a internet.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 4.2 `src/utils/auth.ts`
```typescript
import { API_BASE_URL } from './api';
import { LoginSuccessResponse, RegisterResponse } from '../types/Auth';
import { saveUserSession } from './tokenStorage';

const LOGIN_URL = `${API_BASE_URL}/login.php`;
const REGISTER_URL = `${API_BASE_URL}/register.php`;

export async function login(email: string, password: string): Promise<string> {
  console.log(`[auth.ts] Intentando login para: ${email} en URL: ${LOGIN_URL}`);

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data: LoginSuccessResponse = await response.json();

  if (!response.ok || data.login !== 'success' || !data.id) {
    throw new Error(data.message || data.error || 'Correo o contraseña incorrectos');
  }

  const token = `gastrolab-token-${data.id}-${Date.now()}`;
  await saveUserSession({
    id: Number(data.id),
    email: data.email || email.trim(),
    token,
  });

  console.log('[auth.ts] Login exitoso, token generado para ID:', data.id);
  return token;
}

export async function registerUser(email: string, password: string): Promise<void> {
  console.log(`[auth.ts] Registrando nuevo usuario: ${email}`);

  const response = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data: RegisterResponse = await response.json();

  if (response.status === 409) {
    throw new Error('Este correo electrónico ya está registrado.');
  }

  if (!response.ok || data.store !== 'success') {
    throw new Error(data.error || 'No se pudo completar el registro.');
  }
}
```
