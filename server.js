const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 3001;
const RECIPES_FILE = path.join(__dirname, 'src', 'data', 'recipes.json');
const USERS_FILE = path.join(__dirname, 'src', 'data', 'users.json');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function readJsonFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultData;
  } catch (err) {
    console.error(`[server.js] Error leyendo ${filePath}:`, err.message);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[server.js] Guardado ${path.basename(filePath)} (${data.length} registros)`);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (_err) {
        reject(new Error('El cuerpo JSON enviado es inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function toSafeLikeRate(value, fallback = 85) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function createAppServer({ recipesFile = RECIPES_FILE, usersFile = USERS_FILE } = {}) {
  return http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname === '/' || pathname === '/health') {
      const recipes = readJsonFile(recipesFile, []);
      const users = readJsonFile(usersFile, []);
      return sendJson(res, 200, {
        status: 'ok',
        server: 'GastroLab JSON Microservice',
        recipesCount: recipes.length,
        usersCount: users.length,
      });
    }

    if (pathname === '/api/recipes' || pathname.startsWith('/api/recipes/')) {
      const idMatch = pathname.match(/^\/api\/recipes\/([^/]+)$/);
      const recipeId = idMatch ? idMatch[1] : null;

      if (req.method === 'GET' && !recipeId) {
        const recipes = readJsonFile(recipesFile, []);
        const search = (url.searchParams.get('search') || '').trim().toLowerCase();
        if (!search) {
          return sendJson(res, 200, recipes);
        }
        const filtered = recipes.filter(
          (r) =>
            String(r.title || '').toLowerCase().includes(search) ||
            String(r.description || '').toLowerCase().includes(search) ||
            String(r.category || '').toLowerCase().includes(search)
        );
        return sendJson(res, 200, filtered);
      }

      if (req.method === 'GET' && recipeId) {
        const recipes = readJsonFile(recipesFile, []);
        const found = recipes.find((r) => String(r.id) === String(recipeId));
        if (!found) {
          return sendJson(res, 404, { error: 'Receta no encontrada.' });
        }
        return sendJson(res, 200, found);
      }

      if (req.method === 'POST' && !recipeId) {
        try {
          const body = await parseBody(req);
          const title = typeof body.title === 'string' ? body.title.trim() : '';
          if (!title) {
            return sendJson(res, 400, { error: 'El título de la receta es obligatorio.' });
          }

          const recipes = readJsonFile(recipesFile, []);
          const maxId = recipes.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
          const newRecipe = {
            id: maxId + 1,
            title,
            description: typeof body.description === 'string' ? body.description.trim() : '',
            imageURL: String(body.imageURL || body.image || '').trim(),
            preparetime: String(body.preparetime || body.prepareTime || '00:30:00').trim(),
            likerate: toSafeLikeRate(body.likerate ?? body.likeRate, 85),
            category: String(body.category || 'Mexicanas').trim(),
            difficulty: String(body.difficulty || 'Facil').trim(),
          };

          recipes.unshift(newRecipe);
          writeJsonFile(recipesFile, recipes);
          return sendJson(res, 201, newRecipe);
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      if (req.method === 'PUT' && recipeId) {
        try {
          const body = await parseBody(req);
          const recipes = readJsonFile(recipesFile, []);
          const index = recipes.findIndex((r) => String(r.id) === String(recipeId));

          if (index === -1) {
            return sendJson(res, 404, { error: 'Receta no encontrada.' });
          }

          const existing = recipes[index];
          const nextTitle =
            typeof body.title === 'string' && body.title.trim()
              ? body.title.trim()
              : existing.title;

          const updated = {
            ...existing,
            id: existing.id,
            title: nextTitle,
            description:
              typeof body.description === 'string' ? body.description.trim() : existing.description,
            imageURL:
              String(body.imageURL ?? body.image ?? '').trim() || existing.imageURL,
            preparetime:
              String(body.preparetime ?? body.prepareTime ?? '').trim() || existing.preparetime,
            likerate: toSafeLikeRate(body.likerate ?? body.likeRate, Number(existing.likerate) || 85),
            category:
              typeof body.category === 'string' && body.category.trim()
                ? body.category.trim()
                : existing.category,
            difficulty:
              typeof body.difficulty === 'string' && body.difficulty.trim()
                ? body.difficulty.trim()
                : existing.difficulty,
          };

          recipes[index] = updated;
          writeJsonFile(recipesFile, recipes);
          return sendJson(res, 200, updated);
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      if (req.method === 'DELETE' && recipeId) {
        const recipes = readJsonFile(recipesFile, []);
        const index = recipes.findIndex((r) => String(r.id) === String(recipeId));

        if (index === -1) {
          return sendJson(res, 404, { error: 'Receta no encontrada.' });
        }

        recipes.splice(index, 1);
        writeJsonFile(recipesFile, recipes);
        return sendJson(res, 200, { success: true, deletedId: recipeId });
      }
    }

    if (pathname === '/api/users' || pathname.startsWith('/api/users/')) {
      const idMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
      const userId = idMatch ? idMatch[1] : null;

      if (req.method === 'GET' && !userId) {
        const users = readJsonFile(usersFile, []);
        return sendJson(res, 200, users);
      }

      if (req.method === 'GET' && userId) {
        const users = readJsonFile(usersFile, []);
        const found = users.find((u) => String(u.id) === String(userId));
        if (!found) {
          return sendJson(res, 404, { error: 'Usuario no encontrado.' });
        }
        return sendJson(res, 200, found);
      }

      if (req.method === 'POST' && !userId) {
        try {
          const body = await parseBody(req);
          const cleanEmail = typeof body.email === 'string' ? body.email.trim() : '';
          const password = typeof body.password === 'string' ? body.password : '';

          if (!cleanEmail || !password) {
            return sendJson(res, 400, {
              error: 'Correo electrónico y contraseña requeridos.',
            });
          }

          const users = readJsonFile(usersFile, []);
          const exists = users.some(
            (u) => String(u.email).toLowerCase() === cleanEmail.toLowerCase()
          );
          if (exists) {
            return sendJson(res, 409, {
              error: 'Este correo electrónico ya está registrado.',
            });
          }

          const maxId = users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
          const newUser = {
            id: maxId + 1,
            email: cleanEmail,
            password,
          };

          users.push(newUser);
          writeJsonFile(usersFile, users);
          return sendJson(res, 201, newUser);
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      if (req.method === 'PUT' && userId) {
        try {
          const body = await parseBody(req);
          const users = readJsonFile(usersFile, []);
          const index = users.findIndex((u) => String(u.id) === String(userId));

          if (index === -1) {
            return sendJson(res, 404, { error: 'Usuario no encontrado.' });
          }

          const existing = users[index];
          const cleanEmail =
            typeof body.email === 'string' && body.email.trim()
              ? body.email.trim()
              : existing.email;
          const nextPassword =
            typeof body.password === 'string' && body.password.length > 0
              ? body.password
              : existing.password;

          const takenByOther = users.some(
            (u) =>
              String(u.id) !== String(userId) &&
              String(u.email).toLowerCase() === cleanEmail.toLowerCase()
          );
          if (takenByOther) {
            return sendJson(res, 409, {
              error: 'Ese correo electrónico ya está en uso por otra cuenta.',
            });
          }

          const updated = {
            ...existing,
            id: existing.id,
            email: cleanEmail,
            password: nextPassword,
          };

          users[index] = updated;
          writeJsonFile(usersFile, users);
          return sendJson(res, 200, updated);
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }
    }

    return sendJson(res, 404, { error: 'Ruta no encontrada.' });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const server = createAppServer();
  server.listen(port, () => {
    console.log(`[GastroLab Server] Microservicio JSON activo en http://localhost:${port}`);
    console.log(`[GastroLab Server] Recetas: ${RECIPES_FILE}`);
    console.log(`[GastroLab Server] Usuarios: ${USERS_FILE}`);
  });
}

module.exports = {
  createAppServer,
  RECIPES_FILE,
  USERS_FILE,
};
