const http = require('http'); // Módulo nativo de Node.js para crear servidor HTTP sin librerías externas
const fs = require('fs'); // Módulo de sistema de archivos para leer y escribir JSON físicos en disco
const path = require('path'); // Utilidad para construir rutas de archivo seguras en Windows/Mac/Linux

const DEFAULT_PORT = 3001; // Puerto por defecto donde escucha el microservicio local
const RECIPES_FILE = path.join(__dirname, 'src', 'data', 'recipes.json'); // Ruta absoluta al archivo físico recipes.json
const USERS_FILE = path.join(__dirname, 'src', 'data', 'users.json'); // Ruta absoluta al archivo físico users.json

function sendJson(res, statusCode, payload) { // Helper para responder cualquier petición con cabecera y texto JSON
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' }); // Define código HTTP y tipo JSON UTF-8
  res.end(JSON.stringify(payload)); // Serializa respuesta y cierra la conexión HTTP
} // Fin de sendJson

function setCorsHeaders(res) { // Habilita permisos CORS para que Expo Web (puerto 8081) hable con puerto 3001
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permite peticiones desde cualquier origen local o IP
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Autoriza todos los métodos REST del CRUD
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Permite cabeceras JSON y de autorización
} // Fin de setCorsHeaders

function readJsonFile(filePath, defaultData = []) { // Lee y parsea un archivo JSON desde disco de manera segura
  try { // Protege contra errores de disco o JSON malformado
    if (!fs.existsSync(filePath)) { // Si el archivo aún no existiera en disco
      fs.mkdirSync(path.dirname(filePath), { recursive: true }); // Crea carpeta padre si falta
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8'); // Crea archivo inicial con datos por defecto
      return defaultData; // Retorna datos por defecto
    } // Fin de inicialización si faltaba archivo
    const raw = fs.readFileSync(filePath, 'utf8'); // Lee texto completo del archivo desde disco
    const parsed = JSON.parse(raw); // Convierte texto JSON en arreglo JavaScript
    return Array.isArray(parsed) ? parsed : defaultData; // Garantiza devolver siempre un arreglo
  } catch (err) { // Si falló lectura o parseo
    console.error(`[server.js] Error leyendo ${filePath}:`, err.message); // Muestra error en consola del servidor
    return defaultData; // Devuelve respaldo seguro sin tumbar el servidor
  } // Fin try/catch
} // Fin de readJsonFile

function writeJsonFile(filePath, data) { // Escribe físicamente los datos actualizados en el archivo JSON del disco
  fs.mkdirSync(path.dirname(filePath), { recursive: true }); // Asegura existencia de carpeta destino
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); // Escribe JSON formateado (2 espacios) en disco
  console.log(`[server.js] Guardado ${path.basename(filePath)} (${data.length} registros)`); // Log en terminal confirmando guardado real
} // Fin de writeJsonFile

function parseBody(req) { // Lee el flujo de datos entrantes de POST/PUT y lo convierte en objeto JSON
  return new Promise((resolve, reject) => { // Envuelve lectura asíncrona de streams en Promesa
    let body = ''; // Acumulador de fragmentos recibidos
    req.on('data', (chunk) => { // Evento disparado por cada trozo de datos recibido
      body += chunk.toString(); // Convierte Buffer a texto y lo concatena
    }); // Fin de listener data
    req.on('end', () => { // Evento cuando terminó de llegar toda la petición
      if (!body.trim()) { // Si el cuerpo llegó vacío
        resolve({}); // Resuelve con objeto vacío
        return; // Termina callback end
      } // Fin verificación vacío
      try { // Intenta parsear JSON recibido
        resolve(JSON.parse(body)); // Resuelve la Promesa con el objeto listo
      } catch (_err) { // Si el cliente envió texto que no es JSON válido
        reject(new Error('El cuerpo JSON enviado es inválido.')); // Rechaza para responder HTTP 400
      } // Fin try/catch JSON
    }); // Fin de listener end
    req.on('error', reject); // Reenvía cualquier error de red en la conexión
  }); // Fin de Promesa
} // Fin de parseBody

function toSafeLikeRate(value, fallback = 85) { // Asegura que likerate guardado siempre sea entero válido 0..100
  if (value === undefined || value === null || value === '') return fallback; // Conserva respaldo si no enviaron valor
  const parsed = Number(value); // Convierte entrada a número
  if (!Number.isFinite(parsed)) return fallback; // Si vino NaN/Infinity usa respaldo (evita guardar null en JSON)
  return Math.max(0, Math.min(100, Math.round(parsed))); // Redondea y acota entre 0 y 100
} // Fin de toSafeLikeRate

function createAppServer({ recipesFile = RECIPES_FILE, usersFile = USERS_FILE } = {}) { // Crea instancia del servidor HTTP (configurable para pruebas)
  return http.createServer(async (req, res) => { // Callback ejecutado en cada petición HTTP entrante
    setCorsHeaders(res); // Aplica cabeceras CORS en todas las respuestas

    if (req.method === 'OPTIONS') { // Responde verificación preflight del navegador antes de PUT/POST/DELETE
      res.writeHead(204); // 204 No Content aprobado
      res.end(); // Cierra preflight rápido
      return; // Sale sin procesar rutas
    } // Fin de manejo preflight OPTIONS

    const url = new URL(req.url || '/', 'http://localhost'); // Parsea ruta y parámetros query (?search=...)
    const pathname = url.pathname.replace(/\/+$/, '') || '/'; // Normaliza eliminando barras diagonales finales sobrantes

    if (pathname === '/' || pathname === '/health') { // Ruta de diagnóstico rápido del microservicio
      const recipes = readJsonFile(recipesFile, []); // Lee total actual de recetas
      const users = readJsonFile(usersFile, []); // Lee total actual de usuarios
      return sendJson(res, 200, { // Responde estado saludable y conteos en disco
        status: 'ok', // Indicador ok
        server: 'GastroLab JSON Microservice', // Nombre identificador del servicio
        recipesCount: recipes.length, // Cantidad real en recipes.json
        usersCount: users.length, // Cantidad real en users.json
      }); // Fin de respuesta /health
    } // Fin de ruta /health

    if (pathname === '/api/recipes' || pathname.startsWith('/api/recipes/')) { // Bloque REST para gestionar recetas
      const idMatch = pathname.match(/^\/api\/recipes\/([^/]+)$/); // Extrae ":id" si viene en /api/recipes/:id
      const recipeId = idMatch ? idMatch[1] : null; // Guarda el ID extraído o null si es ruta colección

      if (req.method === 'GET' && !recipeId) { // GET /api/recipes -> Lista recetas (soporta ?search=)
        const recipes = readJsonFile(recipesFile, []); // Lee recipes.json actualizado desde disco
        const search = (url.searchParams.get('search') || '').trim().toLowerCase(); // Obtiene filtro opcional ?search=
        if (!search) { // Si no hay texto de búsqueda
          return sendJson(res, 200, recipes); // Devuelve catálogo completo
        } // Fin de retorno sin filtro
        const filtered = recipes.filter( // Filtra recetas coincidentes con búsqueda en título, descripción o categoría
          (r) => // Revisa cada registro
            String(r.title || '').toLowerCase().includes(search) || // Busca en título
            String(r.description || '').toLowerCase().includes(search) || // Busca en descripción
            String(r.category || '').toLowerCase().includes(search) // Busca en categoría
        ); // Fin filter
        return sendJson(res, 200, filtered); // Devuelve coincidencias
      } // Fin GET /api/recipes

      if (req.method === 'GET' && recipeId) { // GET /api/recipes/:id -> Obtiene una sola receta por ID
        const recipes = readJsonFile(recipesFile, []); // Lee recipes.json desde disco
        const found = recipes.find((r) => String(r.id) === String(recipeId)); // Busca coincidencia exacta de ID
        if (!found) { // Si no existe ese ID
          return sendJson(res, 404, { error: 'Receta no encontrada.' }); // Responde HTTP 404 real
        } // Fin 404
        return sendJson(res, 200, found); // Devuelve objeto receta encontrado
      } // Fin GET /api/recipes/:id

      if (req.method === 'POST' && !recipeId) { // POST /api/recipes -> Crea receta nueva al inicio del archivo
        try { // Protege lectura/escritura
          const body = await parseBody(req); // Espera recibir primero todo el JSON enviado antes de leer disco
          const title = typeof body.title === 'string' ? body.title.trim() : ''; // Extrae y limpia título obligatorio
          if (!title) { // Rechaza si falta título
            return sendJson(res, 400, { error: 'El título de la receta es obligatorio.' }); // Responde 400 Bad Request
          } // Fin validación título

          const recipes = readJsonFile(recipesFile, []); // Lee recipes.json fresco después de parseBody (evita carreras)
          const maxId = recipes.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0); // Busca el ID más alto en disco
          const newRecipe = { // Construye objeto completo en formato DTO del archivo JSON
            id: maxId + 1, // Asigna ID consecutivo único autoritativo
            title, // Título validado
            description: typeof body.description === 'string' ? body.description.trim() : '', // Descripción limpia
            imageURL: String(body.imageURL || body.image || '').trim(), // URI/DataURL de imagen
            preparetime: String(body.preparetime || body.prepareTime || '00:30:00').trim(), // Tiempo de preparación
            likerate: toSafeLikeRate(body.likerate ?? body.likeRate, 85), // Calificación segura 0..100
            category: String(body.category || 'Mexicanas').trim(), // Categoría
            difficulty: String(body.difficulty || 'Facil').trim(), // Dificultad
          }; // Fin newRecipe

          recipes.unshift(newRecipe); // Coloca la receta recién creada al principio para verla primero en Home
          writeJsonFile(recipesFile, recipes); // Sobreescribe src/data/recipes.json físicamente en disco
          return sendJson(res, 201, newRecipe); // Responde HTTP 201 Created con la receta guardada
        } catch (err) { // Si el JSON enviado era inválido
          return sendJson(res, 400, { error: err.message }); // Responde HTTP 400
        } // Fin try/catch POST
      } // Fin POST /api/recipes

      if (req.method === 'PUT' && recipeId) { // PUT /api/recipes/:id -> Actualiza receta existente en disco
        try { // Protege actualización
          const body = await parseBody(req); // Lee cuerpo JSON nuevo enviado desde form.tsx
          const recipes = readJsonFile(recipesFile, []); // Lee versión más reciente de recipes.json en disco
          const index = recipes.findIndex((r) => String(r.id) === String(recipeId)); // Encuentra índice del registro a editar

          if (index === -1) { // Si el ID no existe en recipes.json
            return sendJson(res, 404, { error: 'Receta no encontrada.' }); // Devuelve 404 real para no ocultar errores
          } // Fin verificación existencia

          const existing = recipes[index]; // Copia valores actuales del registro encontrado
          const nextTitle = // Conserva título anterior si no enviaron uno válido
            typeof body.title === 'string' && body.title.trim() // Verifica texto nuevo
              ? body.title.trim() // Usa título nuevo limpio
              : existing.title; // Mantiene título previo

          const updated = { // Combina campos anteriores con modificaciones recibidas
            ...existing, // Preserva propiedades previas
            id: existing.id, // Nunca permite alterar el ID original
            title: nextTitle, // Título resuelto
            description: // Actualiza descripción si llegó como cadena
              typeof body.description === 'string' ? body.description.trim() : existing.description, // Mantiene previa si faltó
            imageURL: // Actualiza imagen si llegó no vacía, o conserva previa
              String(body.imageURL ?? body.image ?? '').trim() || existing.imageURL, // Conserva previa si vacío
            preparetime: // Actualiza tiempo si llegó no vacío
              String(body.preparetime ?? body.prepareTime ?? '').trim() || existing.preparetime, // Conserva previo si faltó
            likerate: toSafeLikeRate(body.likerate ?? body.likeRate, Number(existing.likerate) || 85), // Actualiza likerate validado
            category: // Actualiza categoría si vino texto no vacío
              typeof body.category === 'string' && body.category.trim() // Comprueba texto válido
                ? body.category.trim() // Usa nueva categoría
                : existing.category, // Conserva previa
            difficulty: // Actualiza dificultad si vino texto no vacío
              typeof body.difficulty === 'string' && body.difficulty.trim() // Comprueba texto válido
                ? body.difficulty.trim() // Usa nueva dificultad
                : existing.difficulty, // Conserva previa
          }; // Fin objeto updated

          recipes[index] = updated; // Reemplaza el elemento en su misma posición del arreglo
          writeJsonFile(recipesFile, recipes); // Escribe físicamente los cambios en src/data/recipes.json
          return sendJson(res, 200, updated); // Responde HTTP 200 OK con el objeto actualizado
        } catch (err) { // Si falló el JSON de entrada
          return sendJson(res, 400, { error: err.message }); // Responde HTTP 400
        } // Fin try/catch PUT
      } // Fin PUT /api/recipes/:id

      if (req.method === 'DELETE' && recipeId) { // DELETE /api/recipes/:id -> Elimina una receta de disco
        const recipes = readJsonFile(recipesFile, []); // Lee recipes.json actual
        const index = recipes.findIndex((r) => String(r.id) === String(recipeId)); // Busca posición por ID

        if (index === -1) { // Si el ID no existe
          return sendJson(res, 404, { error: 'Receta no encontrada.' }); // Responde HTTP 404
        } // Fin verificación existencia

        recipes.splice(index, 1); // Remueve 1 elemento en esa posición del arreglo
        writeJsonFile(recipesFile, recipes); // Guarda archivo recipes.json actualizado sin esa receta
        return sendJson(res, 200, { success: true, deletedId: recipeId }); // Confirma eliminación exitosa
      } // Fin DELETE /api/recipes/:id
    } // Fin bloque /api/recipes

    if (pathname === '/api/users' || pathname.startsWith('/api/users/')) { // Bloque REST para gestionar usuarios en users.json
      const idMatch = pathname.match(/^\/api\/users\/([^/]+)$/); // Extrae ":id" de /api/users/:id
      const userId = idMatch ? idMatch[1] : null; // ID buscado o null

      if (req.method === 'GET' && !userId) { // GET /api/users -> Devuelve lista de cuentas de users.json
        const users = readJsonFile(usersFile, []); // Lee cuentas desde disco
        return sendJson(res, 200, users); // Envía arreglo de usuarios
      } // Fin GET /api/users

      if (req.method === 'GET' && userId) { // GET /api/users/:id -> Devuelve una cuenta específica
        const users = readJsonFile(usersFile, []); // Lee cuentas
        const found = users.find((u) => String(u.id) === String(userId)); // Busca usuario por ID
        if (!found) { // Si no existe ese ID
          return sendJson(res, 404, { error: 'Usuario no encontrado.' }); // Responde 404
        } // Fin 404
        return sendJson(res, 200, found); // Devuelve objeto usuario
      } // Fin GET /api/users/:id

      if (req.method === 'POST' && !userId) { // POST /api/users -> Registra nueva cuenta en users.json
        try { // Protege lectura/escritura
          const body = await parseBody(req); // Parsea { email, password } enviados
          const cleanEmail = typeof body.email === 'string' ? body.email.trim() : ''; // Limpia correo
          const password = typeof body.password === 'string' ? body.password : ''; // Extrae contraseña

          if (!cleanEmail || !password) { // Exige ambos campos
            return sendJson(res, 400, { // Rechaza si falta alguno
              error: 'Correo electrónico y contraseña requeridos.', // Mensaje de error
            }); // Fin 400
          } // Fin validación campos

          const users = readJsonFile(usersFile, []); // Lee users.json fresco tras parseBody
          const exists = users.some( // Comprueba si el correo ya existe ignorando mayúsculas
            (u) => String(u.email).toLowerCase() === cleanEmail.toLowerCase() // Comparación insensible a caso
          ); // Fin verificación duplicado
          if (exists) { // Si el correo ya fue registrado previamente
            return sendJson(res, 409, { // Responde HTTP 409 Conflict
              error: 'Este correo electrónico ya está registrado.', // Mensaje claro en español
            }); // Fin 409
          } // Fin check duplicado

          const maxId = users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0); // Calcula ID siguiente disponible
          const newUser = { // Objeto nuevo usuario para users.json
            id: maxId + 1, // ID consecutivo
            email: cleanEmail, // Correo registrado
            password, // Contraseña
          }; // Fin newUser

          users.push(newUser); // Añade usuario nuevo al final de la lista
          writeJsonFile(usersFile, users); // Persiste físicamente en src/data/users.json
          return sendJson(res, 201, newUser); // Responde HTTP 201 Created
        } catch (err) { // Si el cuerpo JSON venía malformado
          return sendJson(res, 400, { error: err.message }); // Responde 400
        } // Fin try/catch POST users
      } // Fin POST /api/users

      if (req.method === 'PUT' && userId) { // PUT /api/users/:id -> Actualiza correo o clave en users.json
        try { // Protege actualización de usuario
          const body = await parseBody(req); // Lee { email, password } nuevos
          const users = readJsonFile(usersFile, []); // Lee users.json actual
          const index = users.findIndex((u) => String(u.id) === String(userId)); // Localiza usuario por ID

          if (index === -1) { // Si el usuario no existe
            return sendJson(res, 404, { error: 'Usuario no encontrado.' }); // Responde 404
          } // Fin 404

          const existing = users[index]; // Datos actuales del usuario
          const cleanEmail = // Usa correo nuevo limpio o mantiene actual
            typeof body.email === 'string' && body.email.trim() // Verifica correo válido
              ? body.email.trim() // Correo nuevo
              : existing.email; // Correo actual
          const nextPassword = // Usa nueva contraseña o conserva actual
            typeof body.password === 'string' && body.password.length > 0 // Verifica no vacía
              ? body.password // Contraseña nueva
              : existing.password; // Contraseña anterior

          const takenByOther = users.some( // Evita robar un correo perteneciente a otra cuenta distinta
            (u) => // Revisa demás usuarios
              String(u.id) !== String(userId) && // Excluye al usuario que está editando su propio correo
              String(u.email).toLowerCase() === cleanEmail.toLowerCase() // Comprueba coincidencia de correo
          ); // Fin verificación correo tomado
          if (takenByOther) { // Si pertenece a otra persona
            return sendJson(res, 409, { // Responde HTTP 409 Conflict
              error: 'Ese correo electrónico ya está en uso por otra cuenta.', // Error descriptivo
            }); // Fin 409
          } // Fin check correo en uso

          const updated = { // Arma registro de usuario actualizado
            ...existing, // Preserva propiedades
            id: existing.id, // Conserva ID intacto
            email: cleanEmail, // Asigna correo final
            password: nextPassword, // Asigna contraseña final
          }; // Fin updated

          users[index] = updated; // Actualiza en el arreglo
          writeJsonFile(usersFile, users); // Escribe cambios en src/data/users.json
          return sendJson(res, 200, updated); // Responde HTTP 200 OK
        } catch (err) { // Ante cuerpo JSON inválido
          return sendJson(res, 400, { error: err.message }); // Responde 400
        } // Fin try/catch PUT users
      } // Fin PUT /api/users/:id
    } // Fin bloque /api/users

    return sendJson(res, 404, { error: 'Ruta no encontrada.' }); // Responde 404 para cualquier URL desconocida
  }); // Fin createServer callback
} // Fin de createAppServer

if (require.main === module) { // Solo abre puerto de escucha cuando se ejecuta directo con "node server.js" (y no al importar en tests)
  const port = Number(process.env.PORT) || DEFAULT_PORT; // Usa variable de entorno PORT o 3001 por defecto
  const server = createAppServer(); // Crea servidor HTTP apuntando a los archivos reales src/data/*.json
  server.listen(port, () => { // Inicia escucha activa en el puerto configurado
    console.log(`[GastroLab Server] Microservicio JSON activo en http://localhost:${port}`); // Imprime URL de acceso
    console.log(`[GastroLab Server] Recetas: ${RECIPES_FILE}`); // Muestra ruta real del archivo de recetas
    console.log(`[GastroLab Server] Usuarios: ${USERS_FILE}`); // Muestra ruta real del archivo de usuarios
  }); // Fin server.listen
} // Fin comprobación require.main

module.exports = { // Exporta fábrica y rutas para permitir pruebas automatizadas aisladas
  createAppServer, // Constructor de instancia HTTP independiente
  RECIPES_FILE, // Ruta del JSON de recetas
  USERS_FILE, // Ruta del JSON de usuarios
}; // Fin module.exports
