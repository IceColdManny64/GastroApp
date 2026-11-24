import { useFocusEffect, useRouter } from 'expo-router'; // Recarga recetas al volver al catálogo y navega a Detalle, Form, Favoritos o Ajustes
import { useCallback, useMemo, useRef, useState } from 'react'; // Hooks para callbacks estables, filtrado/paginación memorizados, refs y estados
import { // Componentes visuales nativos para cuadrícula de catálogo, botones superiores y carga
  ActivityIndicator, // Spinner centrado durante la carga inicial o búsqueda en servidor
  FlatList, // Lista virtualizada en 1, 2 o 3 columnas con cabecera y paginador
  Pressable, // Botones superiores (+ Nueva receta, Favoritos, Ajustes, Cerrar sesión) y Reintentar
  StyleSheet, // Compila estilos claro/oscuro de la pantalla principal
  Text, // Textos de carga, error, botones y estado vacío
  View, // Contenedores de acciones, celdas de cuadrícula y estados centrados
  useWindowDimensions, // Mide ancho/alto en tiempo real para adaptar numColumns al girar pantalla
} from 'react-native'; // Fin de importaciones desde react-native
import Card from '@/components/ui/card'; // Tarjeta visual modular reutilizada para cada receta del catálogo
import PaginationBar from '@/components/ui/paginationBar'; // Selector de 10/20/30 elementos y botones Anterior/Siguiente
import SearchFilterBar from '@/components/ui/searchFilterBar'; // Barra de búsqueda y chips de categoría, dificultad, orden y favoritos
import { getRecipes } from '@/services/recipes'; // Consulta GET /api/recipes (o respaldo offline si server.js está apagado)
import { PageSizeOption, UserSettings } from '@/types/Auth'; // Tipos para tamaño de página y preferencias del usuario
import { // Tipos de dominio para filtros, categorías, dificultades y modelo RecipeItem
  RecipeCategory, // Unión de categorías válidas incluyendo 'Todas'
  RecipeDifficulty, // Unión de dificultades válidas incluyendo 'Todas'
  RecipeFilterState, // Estructura agrupada de los 5 criterios de filtrado en Home
  RecipeItem, // Modelo normalizado devuelto por adaptRecipeDtoToItem
  SortOption, // Claves de ordenamiento ('default', 'likes_desc', 'time_asc', 'title_asc')
} from '@/types/RecipeItem'; // Fin de importaciones desde types/RecipeItem
import { // Almacenamiento local por usuario, preferencias y hook reactivo de tema oscuro
  DEFAULT_USER_SETTINGS, // Configuración inicial (10 por página, claro, 'Todas', compacto false)
  getFavorites, // Lee arreglo de IDs marcados como favoritos del usuario activo
  getUserSettings, // Lee preferencias guardadas para itemsPerPage, tema y categoría inicial
  saveUserSettings, // Persiste cambio de itemsPerPage cuando se selecciona 10, 20 o 30 en el paginador
  toggleFavorite, // Agrega o quita una receta de favoritos al tocar su botón ♥
  useThemeMode, // Se suscribe al tema claro/oscuro en vivo para repintar Home al instante
} from '@/utils/preferencesStorage'; // Fin de importaciones desde preferencesStorage
import { deleteToken, getToken } from '@/utils/tokenStorage'; // Valida sesión activa y borra auth_token al cerrar sesión

export default function HomeScreen() { // Pantalla principal del catálogo de recetas en /(app)/home
  const router = useRouter(); // Instancia de navegación para abrir pantallas secundarias o expulsar a Login
  const isDarkTheme = useThemeMode(); // Bandera global reactiva de Modo Oscuro
  const { width, height } = useWindowDimensions(); // Dimensiones actuales de pantalla para responsividad
  const isLandscape = width > height; // Verdadero cuando el ancho supera la altura (móvil horizontal o escritorio)
  const numColumns = width >= 980 ? 3 : width >= 620 || isLandscape ? 2 : 1; // 3 cols >= 980px, 2 cols en tablet/landscape, 1 col en móvil vertical

  const [recipes, setRecipes] = useState<RecipeItem[]>([]); // Lista actual de recetas mostradas (catálogo completo o resultado de búsqueda)
  const [loading, setLoading] = useState<boolean>(true); // Muestra pantalla de carga mientras llega el catálogo inicial
  const [error, setError] = useState<string | null>(null); // Guarda error de carga para ofrecer botón Reintentar
  const [refreshing, setRefreshing] = useState(false); // Controla el indicador nativo de Pull-to-Refresh al deslizar hacia abajo

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]); // IDs de recetas marcadas con ♥ para esta cuenta
  const [userSettings, setUserSettings] = useState<UserSettings>( // Preferencias cargadas del usuario
    DEFAULT_USER_SETTINGS // Arranca con valores por defecto mientras responde Async/SecureStore
  ); // Fin de estado userSettings
  const hasAppliedDefaultCategoryRef = useRef(false); // Evita sobrescribir el filtro si el usuario ya eligió otra categoría manualmente
  const serverSearchActiveRef = useRef(false); // Recuerda si recipes contiene solo un subconjunto devuelto por ?search= en server.js
  const [currentPage, setCurrentPage] = useState(1); // Página actual visible dentro del paginador

  const [filters, setFilters] = useState<RecipeFilterState>({ // Estado único de búsqueda, chips y ordenamiento
    searchQuery: '', // Texto escrito en el buscador
    category: 'Todas', // Categoría seleccionada inicialmente
    difficulty: 'Todas', // Dificultad seleccionada inicialmente
    sortBy: 'default', // Orden original devuelto por recipes.json
    onlyFavorites: false, // Cuando es true muestra solo recetas favoritas
  }); // Fin de estado filters

  const handleLogout = async () => { // Cierra la sesión actual al pulsar "Cerrar sesión"
    await deleteToken(); // Borra auth_token y sesión en memoria/disco
    router.replace('/(auth)/login'); // Sustituye historial para impedir volver al catálogo con el botón Atrás
  }; // Fin de handleLogout

  const fetchRecipes = useCallback(async () => { // Carga catálogo completo, favoritos y preferencias en paralelo
    try { // Verifica sesión y sincroniza datos desde server.js o caché
      const token = await getToken(); // Comprueba que siga existiendo un token válido
      if (!token) { // Si la sesión expiró o fue borrada en localStorage
        router.replace('/(auth)/login'); // Expulsa inmediatamente al Login
        return; // Aborta carga de recetas protegidas
      } // Fin guardia de token

      setError(null); // Limpia errores anteriores antes de cargar
      serverSearchActiveRef.current = false; // Restablece bandera porque se cargará el catálogo completo
      const [data, favs, settings] = await Promise.all([ // Peticiones concurrentes para reducir tiempo de carga
        getRecipes(), // Trae todas las recetas desde GET /api/recipes (o respaldo offline)
        getFavorites(), // Lee IDs favoritos del usuario conectado
        getUserSettings(), // Lee tamaño de página, tema y categoría por defecto
      ]); // Fin Promise.all

      setRecipes(data); // Guarda el catálogo normalizado en estado
      setFavoriteIds(favs); // Actualiza lista de corazones marcados
      setUserSettings(settings); // Actualiza configuración visual y paginación

      if (!hasAppliedDefaultCategoryRef.current && settings.defaultCategory) { // Aplica la categoría preferida solo la primera vez que abre Home
        hasAppliedDefaultCategoryRef.current = true; // Marca bandera en ref para no pisar selecciones posteriores al volver de Detalle
        setFilters((prev) => ({ // Actualiza solo la categoría dentro de filters
          ...prev, // Conserva texto, dificultad, orden y onlyFavorites
          category: settings.defaultCategory, // Aplica la categoría inicial configurada en Ajustes
        })); // Fin actualización inicial de categoría
      } // Fin aplicación única de defaultCategory
    } catch (err) { // Captura fallo inesperado durante la carga
      setError(err instanceof Error ? err.message : 'Error desconocido'); // Muestra texto descriptivo con opción a reintentar
    } finally { // Siempre apaga ambos indicadores de carga
      setLoading(false); // Oculta spinner inicial
      setRefreshing(false); // Detiene animación de Pull-to-Refresh
    } // Fin try/catch/finally
  }, [router]); // Solo depende de router

  useFocusEffect( // Recarga automáticamente cada vez que Home vuelve a ser visible (ej. tras crear/editar/borrar receta)
    useCallback(() => { // Memoriza efecto en foco exigido por Expo Router
      fetchRecipes(); // Pide datos frescos de recipes.json/caché al recuperar foco
    }, [fetchRecipes]) // Se actualiza si cambia fetchRecipes
  ); // Fin useFocusEffect

  const onRefresh = () => { // Manejador del gesto Pull-to-Refresh en FlatList
    setRefreshing(true); // Enciende spinner superior de refresco
    fetchRecipes(); // Vuelve a consultar recetas, favoritos y ajustes
  }; // Fin onRefresh

  const handleServerSearch = async () => { // Ejecuta búsqueda remota contra GET /api/recipes?search= al tocar "Buscar" o Enter
    try { // Consulta al servidor con el término escrito
      setLoading(true); // Muestra indicador de carga mientras busca
      setError(null); // Limpia errores anteriores
      const cleanQuery = filters.searchQuery.trim(); // Elimina espacios sobrantes del buscador
      serverSearchActiveRef.current = cleanQuery.length > 0; // Marca si el arreglo recipes quedó acotado por búsqueda remota
      const data = await getRecipes(cleanQuery || undefined); // Envía ?search= si hay texto, o carga catálogo completo si está vacío
      setRecipes(data); // Reemplaza listado visible con coincidencias
      setCurrentPage(1); // Reinicia paginador a la página 1 tras buscar
    } catch (err) { // Captura fallos de red o respuesta inválida
      setError( // Muestra error legible en pantalla
        err instanceof Error ? err.message : 'Error al buscar en el catálogo' // Mensaje de respaldo
      ); // Fin setError
    } finally { // Siempre oculta spinner de búsqueda
      setLoading(false); // Restaura vista de resultados
    } // Fin try/catch/finally
  }; // Fin handleServerSearch

  const handleResetAllFilters = async () => { // Limpia búsqueda, chips y vuelve al catálogo completo
    setFilters({ // Restaura los 5 criterios de filtro a sus valores neutros
      searchQuery: '', // Borra texto del buscador
      category: 'Todas', // Quita filtro de categoría
      difficulty: 'Todas', // Quita filtro de dificultad
      sortBy: 'default', // Vuelve al orden original
      onlyFavorites: false, // Desactiva filtro de solo favoritos
    }); // Fin reset de filters
    setCurrentPage(1); // Regresa a la primera página
    if (serverSearchActiveRef.current) { // Si antes había buscado en servidor, recipes solo tenía coincidencias parciales
      serverSearchActiveRef.current = false; // Desactiva bandera de búsqueda acotada
      const fullData = await getRecipes(); // Recupera de nuevo todo el catálogo completo
      setRecipes(fullData); // Restaura todas las recetas en memoria
    } // Fin restauración de catálogo completo
  }; // Fin handleResetAllFilters

  const handleToggleFavorite = async (recipeId: number) => { // Alterna el corazón ♥ directamente desde cualquier tarjeta del catálogo
    const updated = await toggleFavorite(recipeId); // Persiste el cambio en almacenamiento del usuario
    setFavoriteIds(updated); // Actualiza los corazones activos y el contador de favoritos en pantalla
  }; // Fin handleToggleFavorite

  const handleItemsPerPageChange = async (size: PageSizeOption) => { // Cambia entre 10, 20 o 30 tarjetas por página desde PaginationBar
    const updated = await saveUserSettings({ // Guarda la preferencia en disco para conservarla en futuras sesiones
      ...userSettings, // Mantiene tema, categoría por defecto y compactCards
      itemsPerPage: size, // Aplica el nuevo tamaño elegido
    }); // Fin saveUserSettings
    setUserSettings(updated); // Refleja inmediatamente el nuevo tamaño en memoria
    setCurrentPage(1); // Regresa a la página 1 para evitar quedar fuera de rango
  }; // Fin handleItemsPerPageChange

  const filteredRecipes = useMemo(() => { // Embudo memorizado de búsqueda local, categoría, dificultad, favoritos y ordenamiento
    const query = filters.searchQuery.trim().toLowerCase(); // Normaliza texto de búsqueda para comparar sin importar mayúsculas

    const filtered = recipes.filter((item) => { // Aplica los 4 filtros secuenciales sobre cada receta
      if (query) { // Filtro 1: coincidencia de texto en título, descripción o categoría
        const matchesQuery = // Verdadero si el texto aparece en alguno de los 3 campos
          item.title.toLowerCase().includes(query) || // Busca en nombre del platillo
          item.description.toLowerCase().includes(query) || // Busca en ingredientes/descripción
          item.category.toLowerCase().includes(query); // Busca en categoría gastronómica
        if (!matchesQuery) return false; // Descarta si no coincide con el texto buscado
      } // Fin filtro por texto

      if ( // Filtro 2: categoría seleccionada distinta de 'Todas'
        filters.category !== 'Todas' && // Solo filtra cuando hay una categoría específica activa
        item.category.toLowerCase() !== filters.category.toLowerCase() // Compara ignorando mayúsculas
      ) { // Si la receta pertenece a otra categoría
        return false; // La excluye del resultado
      } // Fin filtro por categoría

      if ( // Filtro 3: nivel de dificultad distinto de 'Todas'
        filters.difficulty !== 'Todas' && // Solo filtra cuando hay una dificultad específica seleccionada
        item.difficulty.toLowerCase() !== filters.difficulty.toLowerCase() // Compara nivel exacto
      ) { // Si no coincide la dificultad
        return false; // La excluye del resultado
      } // Fin filtro por dificultad

      if (filters.onlyFavorites && !favoriteIds.includes(item.id)) { // Filtro 4: solo recetas marcadas con ♥
        return false; // Excluye si soloFavorites está activo y su ID no está en favoritos
      } // Fin filtro solo favoritos

      return true; // Conserva la receta si superó todos los filtros activos
    }); // Fin filter

    if (filters.sortBy === 'likes_desc') { // Ordena de mayor a menor porcentaje de aprobación
      return [...filtered].sort((a, b) => b.likeRate - a.likeRate); // Clona arreglo para no mutar y compara numéricamente
    } // Fin orden por aprobación
    if (filters.sortBy === 'time_asc') { // Ordena de menor a mayor tiempo de preparación (HH:MM:SS)
      return [...filtered].sort((a, b) => // Clona y compara cadenas HH:MM:SS lexicográficamente
        a.prepareTime.localeCompare(b.prepareTime) // Ej. "00:10:00" va antes que "01:30:00"
      ); // Fin sort por tiempo
    } // Fin orden por tiempo
    if (filters.sortBy === 'title_asc') { // Ordena alfabéticamente A-Z por título
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title)); // Comparación alfabética sensible a idioma
    } // Fin orden alfabético

    return filtered; // Con sortBy === 'default' conserva el orden original de recipes.json
  }, [recipes, filters, favoriteIds]); // Solo recalcula si cambian recetas, criterios o favoritos

  const itemsPerPage = userSettings.itemsPerPage; // Tamaño de página activo (10, 20 o 30)
  const totalPages = Math.max( // Calcula páginas totales garantizando al menos 1 aunque haya 0 resultados
    1, // Mínimo 1 página para mostrar "Página 1 de 1"
    Math.ceil(filteredRecipes.length / itemsPerPage) // Redondea hacia arriba para incluir la última página parcial
  ); // Fin cálculo de totalPages
  const safeCurrentPage = Math.min(currentPage, totalPages); // Evita página inválida si al filtrar disminuyó el total de páginas

  const paginatedRecipes = useMemo(() => { // Recorta únicamente la porción de recetas de la página actual
    const start = (safeCurrentPage - 1) * itemsPerPage; // Índice inicial base 0 (ej. pág 2 de 10 -> índice 10)
    return filteredRecipes.slice(start, start + itemsPerPage); // Devuelve máximo itemsPerPage tarjetas para renderizar
  }, [filteredRecipes, safeCurrentPage, itemsPerPage]); // Recalcula al cambiar lista filtrada, página o tamaño

  const activeFavoritesCount = useMemo(() => { // Cuenta solo favoritos que aún existen en el catálogo completo
    if (serverSearchActiveRef.current) { // Durante búsqueda remota recipes está filtrado, así que usa favoriteIds.length
      return favoriteIds.length; // Evita que el contador baje artificialmente al buscar un término
    } // Fin caso búsqueda en servidor
    return recipes.filter((item) => favoriteIds.includes(item.id)).length; // Excluye IDs huérfanos si alguna receta fue eliminada
  }, [recipes, favoriteIds]); // Recalcula al cambiar recetas o favoritos

  const navigateToDetail = (item: RecipeItem) => { // Abre pantalla Detalle pasando ID y datos seguros
    const safeItemParam = // Omite imágenes Base64 data: para no desbordar la longitud máxima de URL en navegador
      item.image && item.image.startsWith('data:') // Detecta foto local codificada en Base64
        ? { ...item, image: '', imageURL: '' } // Limpia URI pesada; DetailScreen la recuperará entera con getRecipe(id)
        : item; // Conserva URLs HTTP normales para hidratación instantánea
    router.push({ // Apila /(app)/details en la navegación permitiendo volver atrás
      pathname: '/details', // Ruta de vista detallada
      params: { // Parámetros serializados como string
        id: String(item.id), // ID de la receta
        item: JSON.stringify(safeItemParam), // Objeto serializado para mostrar al instante
      }, // Fin params
    }); // Fin router.push
  }; // Fin navigateToDetail

  const isDark = isDarkTheme || userSettings.themeMode === 'dark'; // Verdadero si el tema oscuro está activo

  if (loading) { // Muestra spinner centrado mientras carga el catálogo o busca en el servidor
    return ( // Pantalla de espera con mensaje en español
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo crema o café oscuro */}
        <ActivityIndicator // Rueda giratoria nativa
          size="large" // Tamaño grande
          color={isDark ? '#E74C3C' : '#333333'} // Coral en oscuro o gris en claro
        />{/* Termina spinner de carga */}
        <Text style={[styles.message, isDark && styles.messageDark]}>{/* Mensaje informativo debajo */}
          Cargando recetas...{/* Texto visible mientras responde getRecipes() */}
        </Text>{/* Termina texto de carga */}
      </View> // Fin vista centrada de carga
    ); // Fin retorno temprano loading
  } // Fin guardia loading

  if (error) { // Muestra tarjeta de error con botón Reintentar si falló la carga
    return ( // Vista de error recuperable
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo adaptado al tema */}
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{/* Mensaje de fallo en rojo */}
          {error}{/* Muestra descripción del error ocurrido */}
        </Text>{/* Termina texto de error */}
        <Pressable onPress={fetchRecipes} style={styles.retryButton}>{/* Botón para volver a intentar fetchRecipes */}
          <Text style={styles.retryText}>Reintentar</Text>{/* Etiqueta blanca del botón */}
        </Pressable>{/* Termina botón Reintentar */}
      </View> // Fin vista de error
    ); // Fin retorno temprano error
  } // Fin guardia error

  return ( // Vista principal del catálogo con acciones superiores, buscador, tarjetas y paginador
    <View style={[styles.container, isDark && styles.containerDark]}>{/* Lienzo de pantalla completa */}
      <FlatList // Lista virtualizada de alto rendimiento que recicla tarjetas visibles
        key={`recipes-grid-${numColumns}`} // Fuerza remontaje limpio al cambiar numColumns entre 1, 2 y 3 columnas
        numColumns={numColumns} // Número de tarjetas por fila según ancho actual de pantalla
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined} // Aplica gap horizontal solo cuando hay 2+ columnas
        data={paginatedRecipes} // Muestra únicamente las recetas correspondientes a la página actual
        keyExtractor={(item) => String(item.id)} // Clave única por ID para optimizar reciclaje de filas
        showsVerticalScrollIndicator={false} // Oculta barra vertical de scroll
        refreshing={refreshing} // Conecta estado Pull-to-Refresh al deslizar hacia abajo
        onRefresh={onRefresh} // Dispara recarga completa desde server.js al soltar el gesto
        contentContainerStyle={styles.listContent} // Centra el contenido hasta 1200px con padding de 16px
        ListHeaderComponent={ // Cabecera scrolleable junto al listado: botones de acción + barra de filtros
          <View>{/* Envuelve fila de acciones y SearchFilterBar */}
            <View style={styles.headerActions}>{/* Fila responsiva con botones de navegación rápida */}
              <Pressable // Botón verde para crear una nueva receta
                onPress={() => router.push('/form')} // Abre /(app)/form sin ID (modo Crear)
                style={[styles.actionBtn, styles.primaryActionBtn]} // Botón verde albahaca #27AE60
              >{/* Etiqueta + Nueva receta */}
                <Text style={styles.actionBtnText}>+ Nueva receta</Text>{/* Texto blanco en negrita */}
              </Pressable>{/* Termina botón + Nueva receta */}

              <Pressable // Botón rojo para abrir la pantalla dedicada de favoritos
                onPress={() => router.push('/favorites')} // Navega a /(app)/favorites
                style={[styles.actionBtn, styles.secondaryActionBtn]} // Botón terracota #C0392B
              >{/* Muestra corazón y cantidad de favoritos vigentes */}
                <Text style={styles.actionBtnText}>
                  ♥ Favoritos ({activeFavoritesCount})
                </Text>{/* Termina texto botón Favoritos */}
              </Pressable>{/* Termina botón Favoritos */}

              <Pressable // Botón vino para abrir Ajustes (paginación, tema oscuro y credenciales)
                onPress={() => router.push('/settings')} // Navega a /(app)/settings
                style={[styles.actionBtn, styles.neutralActionBtn]} // Botón vino #753333
              >{/* Etiqueta Ajustes */}
                <Text style={styles.actionBtnText}>⚙️ Ajustes</Text>{/* Texto blanco del botón */}
              </Pressable>{/* Termina botón Ajustes */}

              <Pressable // Botón oscuro para cerrar sesión y volver al Login
                onPress={() => handleLogout()} // Borra token y reemplaza hacia /(auth)/login
                style={[styles.actionBtn, styles.dangerActionBtn]} // Botón café grisáceo #4A3833
              >{/* Etiqueta Cerrar sesión */}
                <Text style={styles.actionBtnText}>Cerrar sesión</Text>{/* Texto blanco del botón */}
              </Pressable>{/* Termina botón Cerrar sesión */}
            </View>{/* Termina fila headerActions */}

            <SearchFilterBar // Componente modular controlado para búsqueda, categorías, dificultades, orden y solo favoritos
              filters={filters} // Pasa objeto completo con los 5 filtros activos
              totalResults={filteredRecipes.length} // Muestra cuántas recetas pasaron todos los filtros
              favoritesCount={activeFavoritesCount} // Muestra conteo real en el chip Solo favoritos
              darkMode={isDark} // Sincroniza estilos claros u oscuros
              onChangeSearch={(text: string) => { // Actualiza búsqueda al teclear en tiempo real
                setFilters((prev) => ({ ...prev, searchQuery: text })); // Guarda texto y activa filtrado local en useMemo
                setCurrentPage(1); // Vuelve a página 1 para mostrar los resultados desde el inicio
                if (text.trim() === '' && serverSearchActiveRef.current) { // Si borró toda una búsqueda hecha en servidor
                  serverSearchActiveRef.current = false; // Restablece bandera de búsqueda remota
                  getRecipes() // Vuelve a cargar las recetas completas desde server.js o caché
                    .then(setRecipes) // Actualiza lista completa en estado
                    .catch(() => {}); // Ignora silenciosamente si ya había datos locales
                } // Fin recarga automática al vaciar búsqueda
              }} // Fin callback onChangeSearch
              onSubmitServerSearch={handleServerSearch} // Dispara petición GET /api/recipes?search= al pulsar Enter o "Buscar"
              onSelectCategory={(category: RecipeCategory) => { // Cambia categoría al tocar un chip
                setFilters((prev) => ({ ...prev, category })); // Actualiza categoría seleccionada
                setCurrentPage(1); // Vuelve a la página 1 del nuevo subconjunto
              }} // Fin callback onSelectCategory
              onSelectDifficulty={(difficulty: RecipeDifficulty) => { // Cambia dificultad al tocar un chip
                setFilters((prev) => ({ ...prev, difficulty })); // Actualiza dificultad seleccionada
                setCurrentPage(1); // Reinicia paginación a página 1
              }} // Fin callback onSelectDifficulty
              onSelectSort={(sortBy: SortOption) => { // Cambia criterio de ordenamiento
                setFilters((prev) => ({ ...prev, sortBy })); // Aplica nuevo orden en useMemo
                setCurrentPage(1); // Reinicia a página 1
              }} // Fin callback onSelectSort
              onToggleOnlyFavorites={() => { // Activa/desactiva el chip "♥ Solo favoritos"
                setFilters((prev) => ({ // Invierte el booleano actual
                  ...prev, // Conserva demás filtros
                  onlyFavorites: !prev.onlyFavorites, // Alterna entre ver todas o solo favoritas
                })); // Fin setFilters
                setCurrentPage(1); // Vuelve a página 1
              }} // Fin callback onToggleOnlyFavorites
              onResetFilters={handleResetAllFilters} // Limpia filtros y recarga catálogo si venía de búsqueda remota
            />{/* Termina SearchFilterBar */}
          </View> // Fin contenedor ListHeaderComponent
        } // Fin ListHeaderComponent
        renderItem={({ item }) => ( // Dibuja cada tarjeta dentro de la cuadrícula de 1, 2 o 3 columnas
          <View style={numColumns > 1 ? styles.gridItem : styles.singleItem}>{/* Celda flexible en fila o ancho completo en 1 col */}
            <Card // Componente visual reutilizable de tarjeta de receta
              title={item.title} // Título del platillo
              image={item.image} // URI de la foto
              description={item.description} // Resumen descriptivo
              category={item.category} // Insignia de categoría
              difficulty={item.difficulty} // Píldora de dificultad con color semántico
              prepareTime={item.prepareTime} // Píldora de tiempo HH:MM:SS
              likeRate={item.likeRate} // Píldora de porcentaje de aprobación
              isFavorite={favoriteIds.includes(item.id)} // Pinta ♥ relleno si su ID está guardado en favoritos
              compact={ // Activa tarjeta compacta si lo eligió en Ajustes o el teléfono horizontal es muy bajo
                userSettings.compactCards || (isLandscape && height < 480) // Mejora legibilidad en landscape compacto
              } // Fin prop compact
              darkMode={isDark} // Adapta la tarjeta al tema claro u oscuro
              onToggleFavorite={() => handleToggleFavorite(item.id)} // Alterna favorito sin abrir Detalle (Card usa stopPropagation)
              onPress={() => navigateToDetail(item)} // Abre /(app)/details con los datos de la receta seleccionada
            />{/* Termina tarjeta Card */}
          </View> // Fin celda de cuadrícula
        )} // Fin renderItem
        ListEmptyComponent={ // Se muestra automáticamente cuando ninguna receta cumple los filtros actuales
          <View style={[styles.emptyBox, isDark && styles.emptyBoxDark]}>{/* Tarjeta de estado vacío por filtros */}
            <Text style={[styles.emptyTitle, isDark && styles.messageDark]}>{/* Aviso al usuario */}
              No se encontraron recetas con los filtros seleccionados.{/* Mensaje explicativo */}
            </Text>{/* Termina texto vacío */}
            <Pressable // Botón para quitar todos los filtros de golpe
              onPress={handleResetAllFilters} // Restablece búsqueda, categoría, dificultad y favoritos
              style={styles.retryButton} // Botón rojo terracota
            >{/* Etiqueta Mostrar todas las recetas */}
              <Text style={styles.retryText}>Mostrar todas las recetas</Text>{/* Texto blanco */}
            </Pressable>{/* Termina botón de limpieza */}
          </View> // Fin emptyBox
        } // Fin ListEmptyComponent
        ListFooterComponent={ // Pie del listado con controles de paginación (10/20/30 y Anterior/Siguiente)
          <PaginationBar // Barra modular de paginación
            currentPage={safeCurrentPage} // Página actual validada contra totalPages
            totalPages={totalPages} // Total calculado de páginas disponibles
            totalItems={filteredRecipes.length} // Cantidad total de recetas tras filtrar
            itemsPerPage={itemsPerPage} // Cantidad activa por página (10, 20 o 30)
            darkMode={isDark} // Adapta estilos al tema oscuro
            onPageChange={(page: number) => setCurrentPage(page)} // Cambia a página anterior o siguiente
            onItemsPerPageChange={handleItemsPerPageChange} // Guarda nuevo tamaño en ajustes y reinicia a página 1
          /> // Termina PaginationBar
        } // Fin ListFooterComponent
      />{/* Termina FlatList principal del catálogo */}
    </View> // Fin contenedor raíz de HomeScreen
  ); // Fin del retorno JSX de HomeScreen
} // Fin de componente HomeScreen

const styles = StyleSheet.create({ // Hoja de estilos de HomeScreen
  container: { // Lienzo raíz en modo claro
    flex: 1, // Ocupa toda la altura disponible
    backgroundColor: '#FAF7F5', // Crema cálido
  }, // Fin container
  containerDark: { // Lienzo raíz en modo oscuro
    backgroundColor: '#181312', // Café oscuro profundo
  }, // Fin containerDark
  listContent: { // Contenedor interno del FlatList
    padding: 16, // Relleno uniforme alrededor de la cuadrícula
    maxWidth: 1200, // Ancho máximo legible en monitores anchos
    width: '100%', // Ocupa 100% en móviles
    alignSelf: 'center', // Centra el contenido horizontalmente
  }, // Fin listContent
  columnWrapper: { // Estilo aplicado a cada fila en cuadrícula de 2 o 3 columnas
    gap: 16, // Espacio horizontal de 16px entre tarjetas de la misma fila
  }, // Fin columnWrapper
  gridItem: { // Contenedor de celda cuando numColumns > 1
    flex: 1, // Reparte el ancho en partes iguales entre columnas
  }, // Fin gridItem
  singleItem: { // Contenedor de celda en 1 columna
    width: '100%', // Ocupa todo el ancho de la lista
  }, // Fin singleItem
  centered: { // Pantalla centrada para carga inicial y error
    flex: 1, // Pantalla completa
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    padding: 24, // Aire alrededor
    backgroundColor: '#FAF7F5', // Crema claro
  }, // Fin centered
  centeredDark: { // Pantalla centrada en modo oscuro
    backgroundColor: '#181312', // Café oscuro
  }, // Fin centeredDark
  message: { // Texto "Cargando recetas..."
    marginTop: 12, // Separación debajo del spinner
    fontSize: 16, // Tamaño legible
    color: '#333333', // Gris oscuro
    fontWeight: '600', // Seminegrita
  }, // Fin message
  messageDark: { // Color de texto informativo en modo oscuro
    color: '#F7F2F0', // Blanco cálido
  }, // Fin messageDark
  errorText: { // Texto rojo de error en claro
    color: '#C0392B', // Terracota
    fontSize: 16, // Tamaño legible
    textAlign: 'center', // Centrado
    marginBottom: 16, // Espacio antes del botón Reintentar
    fontWeight: '600', // Seminegrita
  }, // Fin errorText
  errorTextDark: { // Texto rojo de error en oscuro
    color: '#EC7063', // Coral brillante
  }, // Fin errorTextDark
  retryButton: { // Botón reutilizado en Reintentar y Mostrar todas las recetas
    backgroundColor: '#C0392B', // Terracota GastroLab
    paddingHorizontal: 20, // Relleno lateral
    paddingVertical: 12, // Relleno vertical
    borderRadius: 8, // Esquinas redondeadas
  }, // Fin retryButton
  retryText: { // Texto blanco del botón de reintento
    color: '#FFFFFF', // Blanco puro
    fontSize: 15, // Tamaño legible
    fontWeight: '700', // Negrita
  }, // Fin retryText
  headerActions: { // Fila superior de botones (+ Nueva receta, Favoritos, Ajustes, Cerrar sesión)
    flexDirection: 'row', // En fila horizontal
    flexWrap: 'wrap', // Salta a segunda fila automáticamente en pantallas estrechas
    gap: 8, // Separación de 8px entre botones
    marginBottom: 12, // Espacio antes de SearchFilterBar
  }, // Fin headerActions
  actionBtn: { // Base común para los 4 botones de acción rápida
    paddingHorizontal: 14, // Relleno lateral
    paddingVertical: 10, // Altura táctil cómoda
    borderRadius: 8, // Bordes redondeados
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
  }, // Fin actionBtn
  primaryActionBtn: { // Color del botón "+ Nueva receta"
    backgroundColor: '#27AE60', // Verde albahaca para destacar la creación
  }, // Fin primaryActionBtn
  secondaryActionBtn: { // Color del botón "♥ Favoritos"
    backgroundColor: '#C0392B', // Rojo terracota
  }, // Fin secondaryActionBtn
  neutralActionBtn: { // Color del botón "⚙️ Ajustes"
    backgroundColor: '#753333', // Vino corporativo
  }, // Fin neutralActionBtn
  dangerActionBtn: { // Color del botón "Cerrar sesión"
    backgroundColor: '#4A3833', // Café neutro discreto
  }, // Fin dangerActionBtn
  actionBtnText: { // Tipografía blanca compartida por los 4 botones superiores
    color: '#FFFFFF', // Blanco puro
    fontWeight: '700', // Negrita
    fontSize: 13, // Tamaño compacto para que quepan en fila
  }, // Fin actionBtnText
  emptyBox: { // Tarjeta cuando no hay coincidencias con los filtros en claro
    backgroundColor: '#FFFFFF', // Superficie blanca
    borderRadius: 12, // Esquinas redondeadas
    padding: 28, // Relleno interior
    alignItems: 'center', // Centra texto y botón
    borderWidth: 1, // Borde fino
    borderColor: '#EAE2DF', // Arena cálido
    marginVertical: 16, // Espacio vertical respecto a barra y paginador
  }, // Fin emptyBox
  emptyBoxDark: { // Tarjeta de filtros vacíos en modo oscuro
    backgroundColor: '#241D1B', // Superficie café oscuro
    borderColor: '#382E2B', // Borde espresso
  }, // Fin emptyBoxDark
  emptyTitle: { // Mensaje "No se encontraron recetas..."
    fontSize: 15, // Tamaño legible
    color: '#555555', // Gris medio
    textAlign: 'center', // Centrado
    marginBottom: 14, // Espacio antes del botón limpiar filtros
  }, // Fin emptyTitle
}); // Fin StyleSheet HomeScreen
