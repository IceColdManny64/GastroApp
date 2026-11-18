import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { createAppServer } = require('../server.js');

const ROOT = path.resolve('.');
const INITIAL_RECIPES_SRC = path.join(ROOT, 'src', 'data', 'recipes.json');
const INITIAL_USERS_SRC = path.join(ROOT, 'src', 'data', 'users.json');

// Pequeño cargador TS en memoria usando el compilador TypeScript ya instalado
function loadTsModule(relPath, customMocks = {}) {
  const fullPath = path.resolve(ROOT, relPath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: fullPath,
  }).outputText;

  const mod = { exports: {} };
  const localRequire = (specifier) => {
    if (customMocks[specifier]) return customMocks[specifier];
    const resolvedSpec = specifier.startsWith('@/')
      ? path.join(ROOT, 'src', specifier.slice(2))
      : specifier.startsWith('.')
        ? path.resolve(path.dirname(fullPath), specifier)
        : specifier;

    if (customMocks[resolvedSpec]) return customMocks[resolvedSpec];
    if (fs.existsSync(`${resolvedSpec}.ts`)) {
      return loadTsModule(path.relative(ROOT, `${resolvedSpec}.ts`), customMocks);
    }
    return require(resolvedSpec);
  };

  const fn = new Function('require', 'module', 'exports', transpiled);
  fn(localRequire, mod, mod.exports);
  return mod.exports;
}

describe('GastroLab Microservicio JSON (server.js) — CRUD Completo + Usuarios', () => {
  let tmpDir;
  let recipesFile;
  let usersFile;
  let server;
  let baseUrl;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gastrolab-test-'));
    recipesFile = path.join(tmpDir, 'recipes.json');
    usersFile = path.join(tmpDir, 'users.json');
    fs.copyFileSync(INITIAL_RECIPES_SRC, recipesFile);
    fs.copyFileSync(INITIAL_USERS_SRC, usersFile);

    server = createAppServer({ recipesFile, usersFile });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET /health responde estado ok y conteos iniciales', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.recipesCount, 30);
    assert.equal(body.usersCount, 1);
  });

  it('GET /api/recipes lista todas las recetas y soporta ?search=', async () => {
    const allRes = await fetch(`${baseUrl}/api/recipes`);
    assert.equal(allRes.status, 200);
    const all = await allRes.json();
    assert.equal(all.length, 30);

    const searchRes = await fetch(`${baseUrl}/api/recipes?search=pizza`);
    const found = await searchRes.json();
    assert.ok(found.length >= 2);
    assert.ok(found.every((r) => `${r.title} ${r.description} ${r.category}`.toLowerCase().includes('pizza')));
  });

  it('Ciclo CRUD completo de Recetas escribe físicamente en recipes.json', async () => {
    // 1. CREATE (POST)
    const createRes = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chiles en Nogada Prueba',
        description: 'Platillo tradicional mexicano de temporada con granada.',
        imageURL: 'https://example.com/nogada.jpg',
        preparetime: '01:45:00',
        likerate: 99,
        category: 'Mexicanas',
        difficulty: 'Dificil',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.id, 31);
    assert.equal(created.title, 'Chiles en Nogada Prueba');

    let diskRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
    assert.equal(diskRecipes.length, 31);
    assert.equal(diskRecipes[0].id, 31);

    // 2. READ SINGLE (GET /:id)
    const getRes = await fetch(`${baseUrl}/api/recipes/31`);
    assert.equal(getRes.status, 200);
    const fetched = await getRes.json();
    assert.equal(fetched.title, 'Chiles en Nogada Prueba');

    // 3. UPDATE (PUT /:id)
    const updateRes = await fetch(`${baseUrl}/api/recipes/31`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chiles en Nogada Poblanos (Editado)',
        likerate: 100,
        difficulty: 'Medio',
      }),
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.title, 'Chiles en Nogada Poblanos (Editado)');
    assert.equal(updated.likerate, 100);
    assert.equal(updated.difficulty, 'Medio');

    diskRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
    const diskUpdated = diskRecipes.find((r) => r.id === 31);
    assert.equal(diskUpdated.title, 'Chiles en Nogada Poblanos (Editado)');
    assert.equal(diskUpdated.likerate, 100);

    // 4. DELETE (DELETE /:id)
    const delRes = await fetch(`${baseUrl}/api/recipes/31`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
    const delBody = await delRes.json();
    assert.equal(delBody.success, true);

    diskRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
    assert.equal(diskRecipes.length, 30);
    assert.equal(diskRecipes.find((r) => r.id === 31), undefined);

    const missingRes = await fetch(`${baseUrl}/api/recipes/31`);
    assert.equal(missingRes.status, 404);
  });

  it('Rechaza peticiones inválidas con códigos HTTP correctos (400 / 404)', async () => {
    const emptyTitleRes = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    assert.equal(emptyTitleRes.status, 400);

    const putMissingRes = await fetch(`${baseUrl}/api/recipes/9999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No existe' }),
    });
    assert.equal(putMissingRes.status, 404);

    const delMissingRes = await fetch(`${baseUrl}/api/recipes/9999`, { method: 'DELETE' });
    assert.equal(delMissingRes.status, 404);
  });

  it('Ciclo completo de Usuarios (Registro, Duplicados 409, Actualización) en users.json', async () => {
    // Registro nuevo
    const regRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chef@gastrolab.com', password: 'abcd' }),
    });
    assert.equal(regRes.status, 201);
    const newUser = await regRes.json();
    assert.equal(newUser.id, 2);

    // Duplicado (case-insensitive) -> 409
    const dupRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'CHEF@gastrolab.com', password: '1234' }),
    });
    assert.equal(dupRes.status, 409);

    // Actualización de credenciales (PUT /:id)
    const updRes = await fetch(`${baseUrl}/api/users/2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chef.pro@gastrolab.com', password: 'newpass' }),
    });
    assert.equal(updRes.status, 200);

    const diskUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    assert.equal(diskUsers.length, 2);
    assert.equal(diskUsers[1].email, 'chef.pro@gastrolab.com');
    assert.equal(diskUsers[1].password, 'newpass');
  });
});

describe('Validadores y Adaptador TypeScript (validators.ts & adaptRecipeDtoToItem)', () => {
  const store = new Map();
  const mockSecureStore = {
    getItemAsync: async (k) => store.get(k) ?? null,
    setItemAsync: async (k, v) => {
      store.set(k, v);
    },
    deleteItemAsync: async (k) => {
      store.delete(k);
    },
  };
  const mockRn = { Platform: { OS: 'web' }, Alert: { alert: () => {} } };
  const mockConstants = { default: { expoConfig: { hostUri: 'localhost:8081' } } };
  const mocks = {
    'expo-secure-store': mockSecureStore,
    'react-native': mockRn,
    'expo-constants': mockConstants,
  };

  it('validateRecipeForm valida textos obligatorios y tipos estrictos', () => {
    const validators = loadTsModule('src/utils/validators.ts', mocks);

    const validResult = validators.validateRecipeForm({
      title: 'Tacos Dorados',
      description: 'Crujientes tacos dorados de pollo con crema y queso fresco.',
      imageUri: 'https://example.com/tacos.jpg',
      prepareTime: '00:35:00',
      likeRateInput: '95',
      category: 'Mexicanas',
      difficulty: 'Facil',
    });
    assert.equal(validResult.isValid, true);

    const badRate = validators.validateRecipeForm({
      title: 'Tacos Dorados',
      description: 'Crujientes tacos dorados de pollo con crema y queso.',
      imageUri: 'https://example.com/tacos.jpg',
      prepareTime: '00:35:00',
      likeRateInput: '150',
      category: 'Mexicanas',
      difficulty: 'Facil',
    });
    assert.equal(badRate.isValid, false);
    assert.ok(badRate.fieldErrors.likeRate);

    const badTime = validators.validateRecipeForm({
      title: 'Tacos',
      description: 'Descripción suficientemente larga para pasar.',
      imageUri: 'https://example.com/tacos.jpg',
      prepareTime: '99:99:99',
      likeRateInput: '80',
      category: 'Mexicanas',
      difficulty: 'Facil',
    });
    assert.equal(badTime.isValid, false);
    assert.ok(badTime.fieldErrors.prepareTime);
  });

  it('adaptRecipeDtoToItem normaliza string/number e imagen fallback', () => {
    const recipesSvc = loadTsModule('src/services/recipes.ts', mocks);

    const normalized = recipesSvc.adaptRecipeDtoToItem({
      id: '42',
      title: '  Pozole Verde  ',
      description: '',
      imageURL: '',
      preparetime: 'invalido',
      likerate: '92',
      category: 'Mexicanas',
      difficulty: 'Medio',
    });

    assert.equal(normalized.id, 42);
    assert.equal(normalized.title, 'Pozole Verde');
    assert.equal(normalized.image, recipesSvc.DEFAULT_RECIPE_IMAGE);
    assert.equal(normalized.prepareTime, '00:30:00');
    assert.equal(normalized.likeRate, 92);
  });
});

describe('Integración Cliente -> Microservicio y Fallback Offline', () => {
  let tmpDir;
  let recipesFile;
  let usersFile;
  let server;
  let port;
  let mocks;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gastrolab-e2e-'));
    recipesFile = path.join(tmpDir, 'recipes.json');
    usersFile = path.join(tmpDir, 'users.json');
    fs.copyFileSync(INITIAL_RECIPES_SRC, recipesFile);
    fs.copyFileSync(INITIAL_USERS_SRC, usersFile);

    server = createAppServer({ recipesFile, usersFile });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;

    const webStore = new Map();
    globalThis.localStorage = {
      getItem: (k) => (webStore.has(k) ? webStore.get(k) : null),
      setItem: (k, v) => webStore.set(k, String(v)),
      removeItem: (k) => webStore.delete(k),
    };
    globalThis.window = { location: { hostname: '127.0.0.1' } };

    // Sobreescribimos getApiBaseUrl apuntando al puerto efímero de pruebas
    const baseApi = loadTsModule('src/utils/api.ts', {
      'react-native': { Platform: { OS: 'ios' }, Alert: { alert: () => {} } },
      'expo-constants': { default: { expoConfig: { hostUri: `127.0.0.1:${port}` } } },
      'expo-secure-store': {
        getItemAsync: async (k) => webStore.get(k) ?? null,
        setItemAsync: async (k, v) => webStore.set(k, v),
        deleteItemAsync: async (k) => webStore.delete(k),
      },
    });
    baseApi.getApiBaseUrl = () => `http://127.0.0.1:${port}`;

    mocks = {
      'react-native': { Platform: { OS: 'web' }, Alert: { alert: () => {} } },
      'expo-constants': { default: { expoConfig: { hostUri: `127.0.0.1:${port}` } } },
      'expo-secure-store': {
        getItemAsync: async () => null,
        setItemAsync: async () => {},
        deleteItemAsync: async () => {},
      },
      [path.join(ROOT, 'src', 'utils', 'api')]: {
        ...baseApi,
        apiRequest: async (reqPath, opts = {}) => {
          const res = await fetch(`http://127.0.0.1:${port}${reqPath}`, {
            ...opts,
            headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
          });
          const data = await res.json();
          if (!res.ok) throw new baseApi.ApiError(data.error || 'Error', res.status, false);
          return data;
        },
      },
    };
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete globalThis.localStorage;
    delete globalThis.window;
  });

  it('Flujo completo auth + recetas CRUD desde los servicios TypeScript contra server.js', async () => {
    const authMod = loadTsModule('src/utils/auth.ts', mocks);
    const userSvc = loadTsModule('src/services/user.ts', mocks);
    const recipeSvc = loadTsModule('src/services/recipes.ts', mocks);

    // 1. Registrar usuario nuevo -> debe quedar en users.json
    await authMod.registerUser('nuevo@gastrolab.com', 'pass1234');
    let diskUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    assert.equal(diskUsers.length, 2);

    // 2. Login con nuevo usuario
    const token = await authMod.login('nuevo@gastrolab.com', 'pass1234');
    assert.ok(token.startsWith('gastrolab-token-2-'));

    // 3. Actualizar credenciales del usuario -> users.json actualizado
    await userSvc.updateCredentials(2, 'actualizado@gastrolab.com', 'nueva4321');
    diskUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    assert.equal(diskUsers[1].email, 'actualizado@gastrolab.com');
    assert.equal(diskUsers[1].password, 'nueva4321');

    // 4. Crear receta -> recipes.json actualizado
    const created = await recipeSvc.createRecipe({
      title: 'Sopa Azteca E2E',
      description: 'Sopa de tortilla tradicional con aguacate y queso.',
      imageUri: 'https://example.com/azteca.jpg',
      prepareTime: '00:40:00',
      likeRate: 94,
      category: 'Mexicanas',
      difficulty: 'Facil',
    });
    assert.equal(created.id, 31);

    // 5. Editar receta -> recipes.json actualizado en disco
    const updated = await recipeSvc.updateRecipe(created.id, {
      title: 'Sopa Azteca Especial (Editada)',
      description: 'Con pasilla crujiente, crema y chicharrón.',
      imageUri: 'https://example.com/azteca.jpg',
      prepareTime: '00:45:00',
      likeRate: 98,
      category: 'Mexicanas',
      difficulty: 'Medio',
    });
    assert.equal(updated.title, 'Sopa Azteca Especial (Editada)');

    const diskAfterUpdate = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
    assert.equal(diskAfterUpdate[0].title, 'Sopa Azteca Especial (Editada)');
    assert.equal(diskAfterUpdate[0].likerate, 98);

    // 6. Leer detalle actualizado
    const detail = await recipeSvc.getRecipe(31);
    assert.equal(detail.title, 'Sopa Azteca Especial (Editada)');

    // 7. Eliminar receta -> removida de recipes.json
    await recipeSvc.deleteRecipe(31);
    const diskAfterDelete = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
    assert.equal(diskAfterDelete.length, 30);

    // 8. Intentar editar receta inexistente (404) NO debe silenciarse
    await assert.rejects(
      () =>
        recipeSvc.updateRecipe(9999, {
          title: 'Fantasma',
          description: 'No deberia actualizarse en silencio',
          imageUri: 'https://example.com/no.jpg',
          prepareTime: '00:10:00',
          likeRate: 50,
          category: 'Mexicanas',
          difficulty: 'Facil',
        }),
      /Receta no encontrada/i
    );
  });

  it('Fallback offline funciona cuando el microservicio JSON está apagado', async () => {
    const webStore = new Map();
    globalThis.localStorage = {
      getItem: (k) => (webStore.has(k) ? webStore.get(k) : null),
      setItem: (k, v) => webStore.set(k, String(v)),
      removeItem: (k) => webStore.delete(k),
    };

    const baseApi = loadTsModule('src/utils/api.ts', {
      'react-native': { Platform: { OS: 'web' }, Alert: { alert: () => {} } },
      'expo-constants': { default: { expoConfig: { hostUri: '127.0.0.1:1' } } },
      'expo-secure-store': {
        getItemAsync: async () => null,
        setItemAsync: async () => {},
        deleteItemAsync: async () => {},
      },
    });

    const offlineMocks = {
      ...mocks,
      [path.join(ROOT, 'src', 'utils', 'api')]: {
        ...baseApi,
        apiRequest: async () => {
          throw new baseApi.ApiError('ECONNREFUSED', 0, true);
        },
      },
    };

    const authMod = loadTsModule('src/utils/auth.ts', offlineMocks);
    const recipeSvc = loadTsModule('src/services/recipes.ts', offlineMocks);

    const token = await authMod.login('admin@gastrolab.com', '1234');
    assert.ok(token.startsWith('gastrolab-token-1-'));

    const initial = await recipeSvc.getRecipes();
    assert.equal(initial.length, 30);

    const created = await recipeSvc.createRecipe({
      title: 'Receta Offline',
      description: 'Creada sin microservicio activo.',
      imageUri: 'https://example.com/offline.jpg',
      prepareTime: '00:15:00',
      likeRate: 88,
      category: 'Postres',
      difficulty: 'Facil',
    });
    assert.equal(created.id, 31);

    const updated = await recipeSvc.updateRecipe(31, {
      title: 'Receta Offline Editada',
      description: 'Actualizada en caché local.',
      imageUri: 'https://example.com/offline.jpg',
      prepareTime: '00:20:00',
      likeRate: 92,
      category: 'Postres',
      difficulty: 'Facil',
    });
    assert.equal(updated.title, 'Receta Offline Editada');

    await recipeSvc.deleteRecipe(31);
    const afterDelete = await recipeSvc.getRecipes();
    assert.equal(afterDelete.length, 30);
  });
});
