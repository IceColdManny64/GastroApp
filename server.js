const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const RECIPES_FILE = path.join(__dirname, 'src', 'data', 'recipes.json');
const USERS_FILE = path.join(__dirname, 'src', 'data', 'users.json');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function readJsonFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[server.js] Error leyendo ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[server.js] Archivo físico actualizado: ${filePath} (${data.length} elementos)`);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Health check
  if (pathname === '/health' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'GastroLab Local JSON Sync Server' }));
    return;
  }

  // --- RUTAS DE RECETAS (/api/recipes) ---
  if (pathname === '/api/recipes' || pathname.startsWith('/api/recipes/')) {
    const recipes = readJsonFile(RECIPES_FILE, []);

    // GET /api/recipes
    if (req.method === 'GET' && pathname === '/api/recipes') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(recipes));
      return;
    }

    // GET /api/recipes/:id
    if (req.method === 'GET') {
      const id = pathname.split('/')[3];
      const found = recipes.find((r) => String(r.id) === String(id));
      if (!found) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Receta no encontrada' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(found));
      return;
    }

    // POST /api/recipes (Crear)
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const maxId = recipes.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
        const newRecipe = {
          id: maxId + 1,
          title: body.title || 'Nueva Receta',
          description: body.description || '',
          imageURL: body.imageURL || body.image || '',
          preparetime: body.preparetime || body.prepareTime || '00:30:00',
          likerate: Number(body.likerate || body.likeRate || 80),
          category: body.category || 'Mexicanas',
          difficulty: body.difficulty || 'Facil',
        };

        recipes.unshift(newRecipe);
        writeJsonFile(RECIPES_FILE, recipes);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newRecipe));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // PUT /api/recipes/:id (Actualizar)
    if (req.method === 'PUT') {
      try {
        const id = pathname.split('/')[3];
        const body = await parseBody(req);
        const index = recipes.findIndex((r) => String(r.id) === String(id));

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Receta no encontrada' }));
          return;
        }

        const existing = recipes[index];
        const updated = {
          ...existing,
          title: body.title !== undefined ? body.title : existing.title,
          description: body.description !== undefined ? body.description : existing.description,
          imageURL: body.imageURL || body.image || existing.imageURL,
          preparetime: body.preparetime || body.prepareTime || existing.preparetime,
          likerate: body.likerate !== undefined ? Number(body.likerate) : (body.likeRate !== undefined ? Number(body.likeRate) : existing.likerate),
          category: body.category !== undefined ? body.category : existing.category,
          difficulty: body.difficulty !== undefined ? body.difficulty : existing.difficulty,
          id: existing.id,
        };

        recipes[index] = updated;
        writeJsonFile(RECIPES_FILE, recipes);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // DELETE /api/recipes/:id (Eliminar)
    if (req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      const index = recipes.findIndex((r) => String(r.id) === String(id));

      if (index === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Receta no encontrada' }));
        return;
      }

      recipes.splice(index, 1);
      writeJsonFile(RECIPES_FILE, recipes);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deletedId: id }));
      return;
    }
  }

  // --- RUTAS DE USUARIOS (/api/users) ---
  if (pathname === '/api/users' || pathname.startsWith('/api/users/')) {
    const users = readJsonFile(USERS_FILE, []);

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const maxId = users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
        const newUser = {
          id: maxId + 1,
          email: body.email,
          password: body.password,
        };
        users.push(newUser);
        writeJsonFile(USERS_FILE, users);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newUser));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, () => {
  console.log(`[GastroLab Server] Servidor local escuchando en http://localhost:${PORT}`);
  console.log(`[GastroLab Server] Sincronizando físicamente con: ${RECIPES_FILE}`);
});
