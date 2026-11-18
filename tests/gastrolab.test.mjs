import assert from 'node:assert/strict'; // Librería nativa de aserciones estrictas para comprobar valores esperados
import fs from 'node:fs'; // Sistema de archivos para copiar y verificar recipes.json y users.json en disco
import os from 'node:os'; // Proporciona ruta de carpeta temporal del sistema operativo
import path from 'node:path'; // Construcción multiplataforma de rutas de archivo
import { after, before, describe, it } from 'node:test'; // Corredor de pruebas nativo de Node.js sin librerías externas
import { createRequire } from 'node:module'; // Permite cargar módulos CommonJS (.js) dentro de este archivo ESM (.mjs)

const require = createRequire(import.meta.url); // Crea función require referenciada al archivo de pruebas actual
const ts = require('typescript'); // Carga compilador TypeScript para transpilar módulos .ts en memoria
const { createAppServer } = require('../server.js'); // Importa fábrica de servidor HTTP para pruebas aisladas

const ROOT = path.resolve('.'); // Ruta raíz absoluta del proyecto GastroLab
const INITIAL_RECIPES_SRC = path.join(ROOT, 'src', 'data', 'recipes.json'); // Ruta de plantilla original recipes.json
const INITIAL_USERS_SRC = path.join(ROOT, 'src', 'data', 'users.json'); // Ruta de plantilla original users.json

function loadTsModule(relPath, customMocks = {}) { // Compila y ejecuta un archivo .ts inyectando mocks para Expo/RN
  const fullPath = path.resolve(ROOT, relPath); // Resuelve ruta absoluta del archivo TypeScript
  const source = fs.readFileSync(fullPath, 'utf8'); // Lee código fuente TypeScript desde disco
  const transpiled = ts.transpileModule(source, { // Traduce TypeScript a JavaScript CommonJS compatible con Node
    compilerOptions: { // Opciones de compilación rápida en memoria
      module: ts.ModuleKind.CommonJS, // Emite require/module.exports
      target: ts.ScriptTarget.ES2022, // JavaScript moderno soportado por Node 24
      esModuleInterop: true, // Compatibilidad con imports por defecto
    }, // Fin compilerOptions
    fileName: fullPath, // Conserva ruta para mensajes de error claros
  }).outputText; // Extrae texto JavaScript compilado

  const mod = { exports: {} }; // Objeto módulo vacío donde escribirá el código compilado
  const localRequire = (specifier) => { // Resolvedor personalizado de dependencias e imports con alias "@/"
    if (customMocks[specifier]) return customMocks[specifier]; // Devuelve mock si coincide exactamente (ej. react-native)
    const resolvedSpec = specifier.startsWith('@/') // Resuelve alias "@/" hacia src/ o rutas relativas "./"
      ? path.join(ROOT, 'src', specifier.slice(2)) // Convierte "@/utils/..." en ruta física src/utils/...
      : specifier.startsWith('.') // Si es ruta relativa ./ o ../
        ? path.resolve(path.dirname(fullPath), specifier) // Resuelve respecto a la carpeta del módulo actual
        : specifier; // Paquete externo sin prefijo

    if (customMocks[resolvedSpec]) return customMocks[resolvedSpec]; // Devuelve mock si coincide ruta resuelta (ej. api.ts)
    if (fs.existsSync(`${resolvedSpec}.ts`)) { // Si apunta a otro archivo .ts del proyecto
      return loadTsModule(path.relative(ROOT, `${resolvedSpec}.ts`), customMocks); // Lo carga recursivamente en memoria
    } // Fin verificación archivo .ts
    return require(resolvedSpec); // Cualquier otro módulo (como JSON o librerías) usa require normal
  }; // Fin localRequire

  const fn = new Function('require', 'module', 'exports', transpiled); // Envuelve el código en ámbito aislado CommonJS
  fn(localRequire, mod, mod.exports); // Ejecuta el módulo con require mockeado
  return mod.exports; // Devuelve lo que exportó el archivo TypeScript
} // Fin de loadTsModule

describe('GastroLab Microservicio JSON (server.js) — CRUD Completo + Usuarios', () => { // Suite 1: Pruebas directas al servidor HTTP
  let tmpDir; // Carpeta temporal aislada para no ensuciar los JSON reales del repo
  let recipesFile; // Copia temporal de recipes.json usada por el servidor de prueba
  let usersFile; // Copia temporal de users.json usada por el servidor de prueba
  let server; // Instancia HTTP de prueba creada con createAppServer
  let baseUrl; // URL temporal con puerto efímero asignado por el SO

  before(async () => { // Hook antes de correr los tests de Suite 1: levanta servidor temporal
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gastrolab-test-')); // Crea directorio temporal único
    recipesFile = path.join(tmpDir, 'recipes.json'); // Ruta temporal de recetas
    usersFile = path.join(tmpDir, 'users.json'); // Ruta temporal de usuarios
    fs.copyFileSync(INITIAL_RECIPES_SRC, recipesFile); // Copia las 30 recetas limpias
    fs.copyFileSync(INITIAL_USERS_SRC, usersFile); // Copia usuario admin limpio

    server = createAppServer({ recipesFile, usersFile }); // Crea servidor apuntando a copias temporales
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); // Escucha en puerto libre automático (0)
    const { port } = server.address(); // Recupera el puerto asignado
    baseUrl = `http://127.0.0.1:${port}`; // Arma URL base temporal
  }); // Fin hook before

  after(async () => { // Hook al terminar Suite 1: cierra servidor y limpia archivos temporales
    await new Promise((resolve) => server.close(resolve)); // Apaga servidor HTTP de prueba
    fs.rmSync(tmpDir, { recursive: true, force: true }); // Borra carpeta temporal completa
  }); // Fin hook after

  it('GET /health responde estado ok y conteos iniciales', async () => { // Test 1: Verifica diagnóstico inicial
    const res = await fetch(`${baseUrl}/health`); // Consulta /health
    assert.equal(res.status, 200); // Exige HTTP 200
    const body = await res.json(); // Lee JSON
    assert.equal(body.status, 'ok'); // Verifica status ok
    assert.equal(body.recipesCount, 30); // Verifica 30 recetas iniciales
    assert.equal(body.usersCount, 1); // Verifica 1 usuario administrador inicial
  }); // Fin test 1

  it('GET /api/recipes lista todas las recetas y soporta ?search=', async () => { // Test 2: Verifica listado y búsqueda
    const allRes = await fetch(`${baseUrl}/api/recipes`); // Pide catálogo completo
    assert.equal(allRes.status, 200); // Exige HTTP 200
    const all = await allRes.json(); // Lee arreglo
    assert.equal(all.length, 30); // Debe devolver 30 elementos

    const searchRes = await fetch(`${baseUrl}/api/recipes?search=pizza`); // Filtra con parámetro ?search=pizza
    const found = await searchRes.json(); // Lee resultados filtrados
    assert.ok(found.length >= 2); // Al menos 2 recetas contienen pizza
    assert.ok(found.every((r) => `${r.title} ${r.description} ${r.category}`.toLowerCase().includes('pizza'))); // Todas coinciden con "pizza"
  }); // Fin test 2

  it('Ciclo CRUD completo de Recetas escribe físicamente en recipes.json', async () => { // Test 3: Crear -> Leer -> Editar -> Borrar
    const createRes = await fetch(`${baseUrl}/api/recipes`, { // Paso 1: CREATE vía POST
      method: 'POST', // Verbo POST
      headers: { 'Content-Type': 'application/json' }, // Cabecera JSON
      body: JSON.stringify({ // Cuerpo de receta prueba
        title: 'Chiles en Nogada Prueba', // Título
        description: 'Platillo tradicional mexicano de temporada con granada.', // Descripción
        imageURL: 'https://example.com/nogada.jpg', // URL imagen
        preparetime: '01:45:00', // Tiempo
        likerate: 99, // Likes
        category: 'Mexicanas', // Categoría
        difficulty: 'Dificil', // Dificultad
      }), // Fin stringify
    }); // Espera respuesta POST
    assert.equal(createRes.status, 201); // Exige 201 Created
    const created = await createRes.json(); // Lee objeto creado
    assert.equal(created.id, 31); // Verifica ID consecutivo 31
    assert.equal(created.title, 'Chiles en Nogada Prueba'); // Verifica título guardado

    let diskRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8')); // Lee archivo físico directo del disco
    assert.equal(diskRecipes.length, 31); // Confirma 31 registros escritos en disco
    assert.equal(diskRecipes[0].id, 31); // Confirma que quedó al inicio del arreglo

    const getRes = await fetch(`${baseUrl}/api/recipes/31`); // Paso 2: READ individual GET /:id
    assert.equal(getRes.status, 200); // Exige 200 OK
    const fetched = await getRes.json(); // Lee detalle
    assert.equal(fetched.title, 'Chiles en Nogada Prueba'); // Verifica datos exactos

    const updateRes = await fetch(`${baseUrl}/api/recipes/31`, { // Paso 3: UPDATE vía PUT /:id
      method: 'PUT', // Verbo PUT
      headers: { 'Content-Type': 'application/json' }, // Cabecera JSON
      body: JSON.stringify({ // Nuevos valores a actualizar
        title: 'Chiles en Nogada Poblanos (Editado)', // Título modificado
        likerate: 100, // Likes modificados
        difficulty: 'Medio', // Dificultad modificada
      }), // Fin body PUT
    }); // Espera respuesta PUT
    assert.equal(updateRes.status, 200); // Exige 200 OK
    const updated = await updateRes.json(); // Lee respuesta actualizada
    assert.equal(updated.title, 'Chiles en Nogada Poblanos (Editado)'); // Verifica respuesta HTTP
    assert.equal(updated.likerate, 100); // Verifica likes
    assert.equal(updated.difficulty, 'Medio'); // Verifica dificultad

    diskRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8')); // Relee archivo físico del disco tras PUT
    const diskUpdated = diskRecipes.find((r) => r.id === 31); // Busca ID 31 en disco
    assert.equal(diskUpdated.title, 'Chiles en Nogada Poblanos (Editado)'); // Prueba física de que el cambio quedó en disco
    assert.equal(diskUpdated.likerate, 100); // Prueba likes en disco

    const delRes = await fetch(`${baseUrl}/api/recipes/31`, { method: 'DELETE' }); // Paso 4: DELETE /:id
    assert.equal(delRes.status, 200); // Exige 200 OK
    const delBody = await delRes.json(); // Lee confirmación
    assert.equal(delBody.success, true); // Verifica bandera success

    diskRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8')); // Relee disco tras DELETE
    assert.equal(diskRecipes.length, 30); // Vuelve a exactamente 30 registros
    assert.equal(diskRecipes.find((r) => r.id === 31), undefined); // Confirma que ya no existe en disco

    const missingRes = await fetch(`${baseUrl}/api/recipes/31`); // Intenta leer receta eliminada
    assert.equal(missingRes.status, 404); // Debe responder 404 real
  }); // Fin test 3

  it('Rechaza peticiones inválidas con códigos HTTP correctos (400 / 404)', async () => { // Test 4: Manejo de errores HTTP
    const emptyTitleRes = await fetch(`${baseUrl}/api/recipes`, { // Intenta crear receta sin título
      method: 'POST', // Verbo POST
      headers: { 'Content-Type': 'application/json' }, // JSON
      body: JSON.stringify({ title: '   ' }), // Título vacío con espacios
    }); // Espera respuesta
    assert.equal(emptyTitleRes.status, 400); // Exige 400 Bad Request

    const putMissingRes = await fetch(`${baseUrl}/api/recipes/9999`, { // Intenta editar ID inexistente
      method: 'PUT', // Verbo PUT
      headers: { 'Content-Type': 'application/json' }, // JSON
      body: JSON.stringify({ title: 'No existe' }), // Cuerpo cualquiera
    }); // Espera respuesta
    assert.equal(putMissingRes.status, 404); // Exige 404 Not Found

    const delMissingRes = await fetch(`${baseUrl}/api/recipes/9999`, { method: 'DELETE' }); // Intenta borrar ID inexistente
    assert.equal(delMissingRes.status, 404); // Exige 404 Not Found
  }); // Fin test 4

  it('Ciclo completo de Usuarios (Registro, Duplicados 409, Actualización) en users.json', async () => { // Test 5: Usuarios CRUD
    const regRes = await fetch(`${baseUrl}/api/users`, { // Registra segundo usuario
      method: 'POST', // Verbo POST
      headers: { 'Content-Type': 'application/json' }, // Cabecera JSON
      body: JSON.stringify({ email: 'chef@gastrolab.com', password: 'abcd' }), // Cuenta nueva
    }); // Espera creación
    assert.equal(regRes.status, 201); // Exige 201 Created
    const newUser = await regRes.json(); // Lee usuario creado
    assert.equal(newUser.id, 2); // ID asignado debe ser 2

    const dupRes = await fetch(`${baseUrl}/api/users`, { // Intenta registrar mismo correo con mayúsculas
      method: 'POST', // Verbo POST
      headers: { 'Content-Type': 'application/json' }, // JSON
      body: JSON.stringify({ email: 'CHEF@gastrolab.com', password: '1234' }), // Duplicado insensible a caso
    }); // Espera rechazo
    assert.equal(dupRes.status, 409); // Exige 409 Conflict por correo repetido

    const updRes = await fetch(`${baseUrl}/api/users/2`, { // Actualiza correo y clave del usuario 2
      method: 'PUT', // Verbo PUT
      headers: { 'Content-Type': 'application/json' }, // JSON
      body: JSON.stringify({ email: 'chef.pro@gastrolab.com', password: 'newpass' }), // Nuevas credenciales
    }); // Espera 200
    assert.equal(updRes.status, 200); // Exige 200 OK

    const diskUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8')); // Verifica escritura física en users.json
    assert.equal(diskUsers.length, 2); // Hay 2 usuarios guardados
    assert.equal(diskUsers[1].email, 'chef.pro@gastrolab.com'); // Correo actualizado en disco
    assert.equal(diskUsers[1].password, 'newpass'); // Clave actualizada en disco
  }); // Fin test 5
}); // Fin Suite 1

describe('Validadores y Adaptador TypeScript (validators.ts & adaptRecipeDtoToItem)', () => { // Suite 2: Lógica TS pura
  const store = new Map(); // Almacén simulado en RAM para mocks de SecureStore
  const mockSecureStore = { // Objeto que imita expo-secure-store en Node
    getItemAsync: async (k) => store.get(k) ?? null, // Simula lectura asíncrona
    setItemAsync: async (k, v) => { // Simula escritura asíncrona
      store.set(k, v); // Guarda en Map
    }, // Fin setItemAsync
    deleteItemAsync: async (k) => { // Simula borrado asíncrono
      store.delete(k); // Elimina del Map
    }, // Fin deleteItemAsync
  }; // Fin mockSecureStore
  const mockRn = { Platform: { OS: 'web' }, Alert: { alert: () => {} } }; // Simula módulo react-native mínimo
  const mockConstants = { default: { expoConfig: { hostUri: 'localhost:8081' } } }; // Simula expo-constants
  const mocks = { // Diccionario de dependencias simuladas para loadTsModule
    'expo-secure-store': mockSecureStore, // Mock almacenamiento móvil
    'react-native': mockRn, // Mock RN
    'expo-constants': mockConstants, // Mock Constants
  }; // Fin mocks

  it('validateRecipeForm valida textos obligatorios y tipos estrictos', () => { // Test 6: Validaciones formulario
    const validators = loadTsModule('src/utils/validators.ts', mocks); // Carga validators.ts real

    const validResult = validators.validateRecipeForm({ // Caso completamente válido
      title: 'Tacos Dorados', // Título >= 3
      description: 'Crujientes tacos dorados de pollo con crema y queso fresco.', // Descripción >= 10
      imageUri: 'https://example.com/tacos.jpg', // Imagen presente
      prepareTime: '00:35:00', // Formato HH:MM:SS válido
      likeRateInput: '95', // Entero 0..100
      category: 'Mexicanas', // Categoría válida
      difficulty: 'Facil', // Dificultad válida
    }); // Fin llamada válida
    assert.equal(validResult.isValid, true); // Debe aprobar

    const badRate = validators.validateRecipeForm({ // Caso likeRate > 100
      title: 'Tacos Dorados', // Válido
      description: 'Crujientes tacos dorados de pollo con crema y queso.', // Válido
      imageUri: 'https://example.com/tacos.jpg', // Válido
      prepareTime: '00:35:00', // Válido
      likeRateInput: '150', // Inválido (> 100)
      category: 'Mexicanas', // Válido
      difficulty: 'Facil', // Válido
    }); // Fin llamada badRate
    assert.equal(badRate.isValid, false); // Debe rechazar
    assert.ok(badRate.fieldErrors.likeRate); // Debe reportar error específico en likeRate

    const badTime = validators.validateRecipeForm({ // Caso tiempo imposible 99:99:99
      title: 'Tacos', // Válido
      description: 'Descripción suficientemente larga para pasar.', // Válido
      imageUri: 'https://example.com/tacos.jpg', // Válido
      prepareTime: '99:99:99', // Minutos/segundos inválidos
      likeRateInput: '80', // Válido
      category: 'Mexicanas', // Válido
      difficulty: 'Facil', // Válido
    }); // Fin llamada badTime
    assert.equal(badTime.isValid, false); // Debe rechazar
    assert.ok(badTime.fieldErrors.prepareTime); // Error específico en prepareTime
  }); // Fin test 6

  it('adaptRecipeDtoToItem normaliza string/number e imagen fallback', () => { // Test 7: Adaptador DTO -> UI
    const recipesSvc = loadTsModule('src/services/recipes.ts', mocks); // Carga recipes.ts real

    const normalized = recipesSvc.adaptRecipeDtoToItem({ // Envía DTO crudo sucio e incompleto
      id: '42', // ID como string
      title: '  Pozole Verde  ', // Con espacios en bordes
      description: '', // Descripción vacía
      imageURL: '', // Imagen vacía
      preparetime: 'invalido', // Tiempo corrupto
      likerate: '92', // Likes como string
      category: 'Mexicanas', // Categoría válida
      difficulty: 'Medio', // Dificultad válida
    }); // Fin llamada adaptador

    assert.equal(normalized.id, 42); // ID convertido a número 42
    assert.equal(normalized.title, 'Pozole Verde'); // Título limpiado con trim()
    assert.equal(normalized.image, recipesSvc.DEFAULT_RECIPE_IMAGE); // Foto reemplazada con imagen fallback
    assert.equal(normalized.prepareTime, '00:30:00'); // Tiempo reemplazado por valor seguro
    assert.equal(normalized.likeRate, 92); // LikeRate convertido a número 92
  }); // Fin test 7
}); // Fin Suite 2

describe('Integración Cliente -> Microservicio y Fallback Offline', () => { // Suite 3: Flujo completo servicios TS
  let tmpDir; // Directorio temporal
  let recipesFile; // JSON recetas temporal
  let usersFile; // JSON usuarios temporal
  let server; // Servidor HTTP temporal
  let port; // Puerto efímero
  let mocks; // Mocks compartidos

  before(async () => { // Prepara servidor efímero y storage simulado antes de Suite 3
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gastrolab-e2e-')); // Crea carpeta temporal
    recipesFile = path.join(tmpDir, 'recipes.json'); // Ruta temporal recetas
    usersFile = path.join(tmpDir, 'users.json'); // Ruta temporal usuarios
    fs.copyFileSync(INITIAL_RECIPES_SRC, recipesFile); // Copia recetas limpias
    fs.copyFileSync(INITIAL_USERS_SRC, usersFile); // Copia admin limpio

    server = createAppServer({ recipesFile, usersFile }); // Arranca microservicio aislado
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); // Abre puerto libre
    port = server.address().port; // Guarda puerto asignado

    const webStore = new Map(); // Simula localStorage del navegador en memoria
    globalThis.localStorage = { // Inyecta localStorage global para las utilidades Web
      getItem: (k) => (webStore.has(k) ? webStore.get(k) : null), // Leer clave
      setItem: (k, v) => webStore.set(k, String(v)), // Guardar clave
      removeItem: (k) => webStore.delete(k), // Borrar clave
    }; // Fin mock localStorage
    globalThis.window = { location: { hostname: '127.0.0.1' } }; // Simula window.location

    const baseApi = loadTsModule('src/utils/api.ts', { // Carga api.ts base
      'react-native': { Platform: { OS: 'ios' }, Alert: { alert: () => {} } }, // Mock RN
      'expo-constants': { default: { expoConfig: { hostUri: `127.0.0.1:${port}` } } }, // Host temporal
      'expo-secure-store': { // Mock SecureStore usando mismo Map
        getItemAsync: async (k) => webStore.get(k) ?? null, // Lectura
        setItemAsync: async (k, v) => webStore.set(k, v), // Escritura
        deleteItemAsync: async (k) => webStore.delete(k), // Borrado
      }, // Fin mock SecureStore
    }); // Fin carga api.ts
    baseApi.getApiBaseUrl = () => `http://127.0.0.1:${port}`; // Redirige URL al puerto efímero de test

    mocks = { // Mocks para cargar servicios TS apuntando al servidor efímero
      'react-native': { Platform: { OS: 'web' }, Alert: { alert: () => {} } }, // Simula entorno Web
      'expo-constants': { default: { expoConfig: { hostUri: `127.0.0.1:${port}` } } }, // Config host
      'expo-secure-store': { // Fallback no usado en rama Web
        getItemAsync: async () => null, // No-op
        setItemAsync: async () => {}, // No-op
        deleteItemAsync: async () => {}, // No-op
      }, // Fin mock SecureStore
      [path.join(ROOT, 'src', 'utils', 'api')]: { // Intercepta importación de utils/api.ts
        ...baseApi, // Conserva ApiError y helpers
        apiRequest: async (reqPath, opts = {}) => { // Petición directa al servidor de prueba
          const res = await fetch(`http://127.0.0.1:${port}${reqPath}`, { // Llama puerto efímero
            ...opts, // Propaga método y body
            headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, // JSON headers
          }); // Espera respuesta
          const data = await res.json(); // Decodifica JSON
          if (!res.ok) throw new baseApi.ApiError(data.error || 'Error', res.status, false); // Error HTTP real
          return data; // Retorna datos
        }, // Fin apiRequest mock
      }, // Fin mock utils/api
    }; // Fin mocks
  }); // Fin before Suite 3

  after(async () => { // Limpia servidor, archivos y variables globales al terminar Suite 3
    await new Promise((resolve) => server.close(resolve)); // Cierra servidor temporal
    fs.rmSync(tmpDir, { recursive: true, force: true }); // Borra archivos temporales
    delete globalThis.localStorage; // Limpia mock global
    delete globalThis.window; // Limpia mock global
  }); // Fin after Suite 3

  it('Flujo completo auth + recetas CRUD desde los servicios TypeScript contra server.js', async () => { // Test 8: E2E online
    const authMod = loadTsModule('src/utils/auth.ts', mocks); // Carga auth.ts
    const userSvc = loadTsModule('src/services/user.ts', mocks); // Carga user.ts
    const recipeSvc = loadTsModule('src/services/recipes.ts', mocks); // Carga recipes.ts

    await authMod.registerUser('nuevo@gastrolab.com', 'pass1234'); // 1. Registra cuenta vía servicio
    let diskUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8')); // Lee users.json del disco
    assert.equal(diskUsers.length, 2); // Confirma persistencia física

    const token = await authMod.login('nuevo@gastrolab.com', 'pass1234'); // 2. Inicia sesión con nueva cuenta
    assert.ok(token.startsWith('gastrolab-token-2-')); // Confirma token con ID 2

    await userSvc.updateCredentials(2, 'actualizado@gastrolab.com', 'nueva4321'); // 3. Cambia correo y clave
    diskUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8')); // Relee users.json en disco
    assert.equal(diskUsers[1].email, 'actualizado@gastrolab.com'); // Verifica correo actualizado
    assert.equal(diskUsers[1].password, 'nueva4321'); // Verifica clave actualizada

    const created = await recipeSvc.createRecipe({ // 4. Crea receta desde createRecipe()
      title: 'Sopa Azteca E2E', // Título
      description: 'Sopa de tortilla tradicional con aguacate y queso.', // Descripción
      imageUri: 'https://example.com/azteca.jpg', // Imagen
      prepareTime: '00:40:00', // Tiempo
      likeRate: 94, // Likes
      category: 'Mexicanas', // Categoría
      difficulty: 'Facil', // Dificultad
    }); // Espera receta creada
    assert.equal(created.id, 31); // ID asignado por server.js

    const updated = await recipeSvc.updateRecipe(created.id, { // 5. Edita receta recién creada
      title: 'Sopa Azteca Especial (Editada)', // Título actualizado
      description: 'Con pasilla crujiente, crema y chicharrón.', // Descripción actualizada
      imageUri: 'https://example.com/azteca.jpg', // Imagen
      prepareTime: '00:45:00', // Tiempo actualizado
      likeRate: 98, // Likes actualizados
      category: 'Mexicanas', // Categoría
      difficulty: 'Medio', // Dificultad actualizada
    }); // Espera confirmación
    assert.equal(updated.title, 'Sopa Azteca Especial (Editada)'); // Comprueba valor devuelto

    const diskAfterUpdate = JSON.parse(fs.readFileSync(recipesFile, 'utf8')); // Lee recipes.json tras PUT
    assert.equal(diskAfterUpdate[0].title, 'Sopa Azteca Especial (Editada)'); // Confirma cambio físico en disco
    assert.equal(diskAfterUpdate[0].likerate, 98); // Confirma likes en disco

    const detail = await recipeSvc.getRecipe(31); // 6. Lee detalle fresco por ID
    assert.equal(detail.title, 'Sopa Azteca Especial (Editada)'); // Debe coincidir con la edición

    await recipeSvc.deleteRecipe(31); // 7. Elimina receta de prueba
    const diskAfterDelete = JSON.parse(fs.readFileSync(recipesFile, 'utf8')); // Relee disco tras DELETE
    assert.equal(diskAfterDelete.length, 30); // Vuelve a 30 recetas

    await assert.rejects( // 8. Verifica que un 404 real NO se silencia ni se oculta
      () => // Intenta editar receta inexistente 9999
        recipeSvc.updateRecipe(9999, { // Llama updateRecipe con ID fantasma
          title: 'Fantasma', // Título dummy
          description: 'No deberia actualizarse en silencio', // Descripción dummy
          imageUri: 'https://example.com/no.jpg', // URL dummy
          prepareTime: '00:10:00', // Tiempo dummy
          likeRate: 50, // Likes dummy
          category: 'Mexicanas', // Categoría dummy
          difficulty: 'Facil', // Dificultad dummy
        }), // Fin updateRecipe
      /Receta no encontrada/i // Debe rechazar con el error 404 real del servidor
    ); // Fin assert.rejects
  }); // Fin test 8

  it('Fallback offline funciona cuando el microservicio JSON está apagado', async () => { // Test 9: Respaldo offline
    const webStore = new Map(); // Simula nuevo almacenamiento vacío sin caché previa
    globalThis.localStorage = { // Inyecta localStorage limpio
      getItem: (k) => (webStore.has(k) ? webStore.get(k) : null), // Lectura
      setItem: (k, v) => webStore.set(k, String(v)), // Escritura
      removeItem: (k) => webStore.delete(k), // Borrado
    }; // Fin localStorage limpio

    const baseApi = loadTsModule('src/utils/api.ts', { // Carga api.ts para instanciar ApiError
      'react-native': { Platform: { OS: 'web' }, Alert: { alert: () => {} } }, // Mock RN
      'expo-constants': { default: { expoConfig: { hostUri: '127.0.0.1:1' } } }, // Puerto inactivo
      'expo-secure-store': { // Mock SecureStore vacío
        getItemAsync: async () => null, // No-op
        setItemAsync: async () => {}, // No-op
        deleteItemAsync: async () => {}, // No-op
      }, // Fin SecureStore
    }); // Fin carga api

    const offlineMocks = { // Simula fallo total de conexión (isNetworkError = true)
      ...mocks, // Conserva mocks de RN/Expo
      [path.join(ROOT, 'src', 'utils', 'api')]: { // Reemplaza apiRequest para lanzar error de red
        ...baseApi, // Mantiene clase ApiError
        apiRequest: async () => { // Simula server.js apagado
          throw new baseApi.ApiError('ECONNREFUSED', 0, true); // isNetworkError = true
        }, // Fin apiRequest offline
      }, // Fin override utils/api
    }; // Fin offlineMocks

    const authMod = loadTsModule('src/utils/auth.ts', offlineMocks); // Carga auth offline
    const recipeSvc = loadTsModule('src/services/recipes.ts', offlineMocks); // Carga recipes offline

    const token = await authMod.login('admin@gastrolab.com', '1234'); // Login offline con admin por defecto
    assert.ok(token.startsWith('gastrolab-token-1-')); // Genera token válido localmente

    const initial = await recipeSvc.getRecipes(); // Carga las 30 recetas desde semilla recipesData.ts
    assert.equal(initial.length, 30); // Confirma 30 recetas iniciales

    const created = await recipeSvc.createRecipe({ // Crea receta estando sin servidor
      title: 'Receta Offline', // Título offline
      description: 'Creada sin microservicio activo.', // Descripción
      imageUri: 'https://example.com/offline.jpg', // Imagen
      prepareTime: '00:15:00', // Tiempo
      likeRate: 88, // Likes
      category: 'Postres', // Categoría
      difficulty: 'Facil', // Dificultad
    }); // Espera receta creada en caché local
    assert.equal(created.id, 31); // ID generado localmente

    const updated = await recipeSvc.updateRecipe(31, { // Edita esa receta offline
      title: 'Receta Offline Editada', // Nuevo título
      description: 'Actualizada en caché local.', // Nueva descripción
      imageUri: 'https://example.com/offline.jpg', // Imagen
      prepareTime: '00:20:00', // Tiempo
      likeRate: 92, // Likes
      category: 'Postres', // Categoría
      difficulty: 'Facil', // Dificultad
    }); // Espera actualización en caché local
    assert.equal(updated.title, 'Receta Offline Editada'); // Verifica título editado

    await recipeSvc.deleteRecipe(31); // Elimina receta offline
    const afterDelete = await recipeSvc.getRecipes(); // Consulta catálogo restante
    assert.equal(afterDelete.length, 30); // Regresa a las 30 recetas originales
  }); // Fin test 9
}); // Fin Suite 3
