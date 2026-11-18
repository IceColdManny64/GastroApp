import { useFocusEffect, useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useFocusEffect, useRouter })
import { useCallback, useMemo, useRef, useState } from 'react'; // Importa React y sus hooks ({ useCallback, useMemo, useRef, useState }) para estado y ciclo de vida
import { // Continúa o inicia bloque de importación de módulos
  ActivityIndicator, // Importa "ActivityIndicator" desde react-native
  FlatList, // Importa "FlatList" desde react-native
  Pressable, // Importa "Pressable" desde react-native
  StyleSheet, // Importa "StyleSheet" desde react-native
  Text, // Importa "Text" desde react-native
  View, // Importa "View" desde react-native
  useWindowDimensions, // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
} from 'react-native'; // Finaliza importación múltiple desde react-native
import Card from '@/components/ui/card'; // Importa componentes reutilizables de interfaz desde @/components/ui/card
import PaginationBar from '@/components/ui/paginationBar'; // Importa componentes reutilizables de interfaz desde @/components/ui/paginationBar
import SearchFilterBar from '@/components/ui/searchFilterBar'; // Importa componentes reutilizables de interfaz desde @/components/ui/searchFilterBar
import { getRecipes } from '@/services/recipes'; // Importa funciones del servicio de datos (@/services/recipes)
import { PageSizeOption, UserSettings } from '@/types/Auth'; // Importa tipos TypeScript de dominio desde @/types/Auth
import { // Continúa o inicia bloque de importación de módulos
  RecipeCategory, // Importa "RecipeCategory" desde @/types/RecipeItem
  RecipeDifficulty, // Importa "RecipeDifficulty" desde @/types/RecipeItem
  RecipeFilterState, // Importa "RecipeFilterState" desde @/types/RecipeItem
  RecipeItem, // Importa "RecipeItem" desde @/types/RecipeItem
  SortOption, // Importa "SortOption" desde @/types/RecipeItem
} from '@/types/RecipeItem'; // Finaliza importación múltiple desde @/types/RecipeItem
import { // Continúa o inicia bloque de importación de módulos
  DEFAULT_USER_SETTINGS, // Importa "DEFAULT_USER_SETTINGS" desde @/utils/preferencesStorage
  getFavorites, // Importa "getFavorites" desde @/utils/preferencesStorage
  getUserSettings, // Importa "getUserSettings" desde @/utils/preferencesStorage
  saveUserSettings, // Importa "saveUserSettings" desde @/utils/preferencesStorage
  toggleFavorite, // Importa "toggleFavorite" desde @/utils/preferencesStorage
  useThemeMode, // Importa "useThemeMode" desde @/utils/preferencesStorage
} from '@/utils/preferencesStorage'; // Finaliza importación múltiple desde @/utils/preferencesStorage
import { deleteToken, getToken } from '@/utils/tokenStorage'; // Importa utilidades auxiliares compartidas (@/utils/tokenStorage)

export default function HomeScreen() { // Declara y exporta la pantalla principal HomeScreen
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDarkTheme = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width, height } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isLandscape = width > height; // Declara constante local isLandscape
  const numColumns = width >= 980 ? 3 : width >= 620 || isLandscape ? 2 : 1; // Declara constante local numColumns

  const [recipes, setRecipes] = useState<RecipeItem[]>([]); // Declara estado reactivo para la lista paginada de recetas mostradas
  const [loading, setLoading] = useState<boolean>(true); // Declara estado reactivo para el indicador de carga
  const [error, setError] = useState<string | null>(null); // Declara estado reactivo para el mensaje de error actual
  const [refreshing, setRefreshing] = useState(false); // Declara estado reactivo para el estado de recarga manual (pull-to-refresh)

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]); // Declara estado reactivo para favorite ids
  const [userSettings, setUserSettings] = useState<UserSettings>( // Declara estado reactivo para user settings
    DEFAULT_USER_SETTINGS // Pasa default user settings como argumento a useState
  ); // Cierra bloque o expresión anterior
  const hasAppliedDefaultCategoryRef = useRef(false); // Crea referencia mutable para la referencia para aplicar categoría inicial una sola vez sin provocar re-render
  const serverSearchActiveRef = useRef(false); // Crea referencia mutable para la referencia para distinguir búsqueda en servidor vs local sin provocar re-render
  const [currentPage, setCurrentPage] = useState(1); // Declara estado reactivo para current page

  const [filters, setFilters] = useState<RecipeFilterState>({ // Declara estado reactivo para filters
    searchQuery: '', // Define propiedad "searchQuery" en el objeto actual
    category: 'Todas', // Define propiedad "category" en el objeto actual
    difficulty: 'Todas', // Define propiedad "difficulty" en el objeto actual
    sortBy: 'default', // Define propiedad "sortBy" en el objeto actual
    onlyFavorites: false, // Define propiedad "onlyFavorites" en el objeto actual
  }); // Cierra bloque o expresión anterior

  const handleLogout = async () => { // Define manejador o función handleLogout
    await deleteToken(); // Elimina el token de sesión del almacenamiento seguro
    router.replace('/(auth)/login'); // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
  }; // Cierra bloque o expresión anterior

  const fetchRecipes = useCallback(async () => { // Memoriza la función fetchRecipes para evitar recreaciones innecesarias
    try { // Inicia bloque try para capturar posibles errores de ejecución
      const token = await getToken(); // Declara constante local token
      if (!token) { // Evalúa condición lógica antes de ejecutar este bloque
        router.replace('/(auth)/login'); // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
        return; // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else

      setError(null); // Actualiza el mensaje de error actual
      serverSearchActiveRef.current = false; // Actualiza bandera interna en useRef sin disparar nuevo renderizado
      const [data, favs, settings] = await Promise.all([ // Ejecuta múltiples peticiones asíncronas en paralelo y espera todas
        getRecipes(), // Consulta el listado de recetas desde el servicio (JSON o caché)
        getFavorites(), // Carga los identificadores o recetas marcadas como favoritas
        getUserSettings(), // Carga preferencias de usuario guardadas localmente
      ]); // Cierra bloque o expresión anterior

      setRecipes(data); // Actualiza la lista paginada de recetas mostradas
      setFavoriteIds(favs); // Actualiza favorite ids
      setUserSettings(settings); // Actualiza user settings

      if (!hasAppliedDefaultCategoryRef.current && settings.defaultCategory) { // Evalúa condición lógica antes de ejecutar este bloque
        hasAppliedDefaultCategoryRef.current = true; // Actualiza bandera interna en useRef sin disparar nuevo renderizado
        setFilters((prev) => ({ // Actualiza filters
          ...prev, // Copia propiedades existentes (...prev) mediante spread operator
          category: settings.defaultCategory, // Define propiedad "category" en el objeto actual
        })); // Cierra bloque o expresión anterior
      } // Cierra rama del condicional if/else
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      setError(err instanceof Error ? err.message : 'Error desconocido'); // Actualiza el mensaje de error actual
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setLoading(false); // Actualiza el indicador de carga
      setRefreshing(false); // Actualiza el estado de recarga manual (pull-to-refresh)
    } // Cierra bloque try o finally
  }, [router]); // Cierra efecto o memoización; se re-ejecuta si cambia [router]

  useFocusEffect( // Ejecuta recarga automática cada vez que esta pantalla recupera el foco
    useCallback(() => { // Inicia callback o cálculo memorizado para evitar trabajo repetido
      fetchRecipes(); // Invoca la función fetchRecipes en este punto del flujo
    }, [fetchRecipes]) // Cierra efecto o memoización; se re-ejecuta si cambia [fetchRecipes]
  ); // Cierra bloque o expresión anterior

  const onRefresh = () => { // Define manejador o función onRefresh
    setRefreshing(true); // Actualiza el estado de recarga manual (pull-to-refresh)
    fetchRecipes(); // Invoca la función fetchRecipes en este punto del flujo
  }; // Cierra bloque o expresión anterior

  const handleServerSearch = async () => { // Define manejador o función handleServerSearch
    try { // Inicia bloque try para capturar posibles errores de ejecución
      setLoading(true); // Actualiza el indicador de carga
      setError(null); // Actualiza el mensaje de error actual
      const cleanQuery = filters.searchQuery.trim(); // Declara constante local cleanQuery
      serverSearchActiveRef.current = cleanQuery.length > 0; // Actualiza bandera interna en useRef sin disparar nuevo renderizado
      const data = await getRecipes(cleanQuery || undefined); // Consulta el listado de recetas desde el servicio (JSON o caché)
      setRecipes(data); // Actualiza la lista paginada de recetas mostradas
      setCurrentPage(1); // Actualiza current page
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      setError( // Actualiza el mensaje de error actual
        err instanceof Error ? err.message : 'Error al buscar en el catálogo' // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
      ); // Cierra bloque o expresión anterior
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setLoading(false); // Actualiza el indicador de carga
    } // Cierra bloque try o finally
  }; // Cierra bloque o expresión anterior

  const handleResetAllFilters = async () => { // Define manejador o función handleResetAllFilters
    setFilters({ // Actualiza filters
      searchQuery: '', // Define propiedad "searchQuery" en el objeto actual
      category: 'Todas', // Define propiedad "category" en el objeto actual
      difficulty: 'Todas', // Define propiedad "difficulty" en el objeto actual
      sortBy: 'default', // Define propiedad "sortBy" en el objeto actual
      onlyFavorites: false, // Define propiedad "onlyFavorites" en el objeto actual
    }); // Cierra bloque o expresión anterior
    setCurrentPage(1); // Actualiza current page
    if (serverSearchActiveRef.current) { // Evalúa condición lógica antes de ejecutar este bloque
      serverSearchActiveRef.current = false; // Actualiza bandera interna en useRef sin disparar nuevo renderizado
      const fullData = await getRecipes(); // Consulta el listado de recetas desde el servicio (JSON o caché)
      setRecipes(fullData); // Actualiza la lista paginada de recetas mostradas
    } // Cierra rama del condicional if/else
  }; // Cierra bloque o expresión anterior

  const handleToggleFavorite = async (recipeId: number) => { // Define manejador o función handleToggleFavorite
    const updated = await toggleFavorite(recipeId); // Alterna y persiste el estado de receta favorita
    setFavoriteIds(updated); // Actualiza favorite ids
  }; // Cierra bloque o expresión anterior

  const handleItemsPerPageChange = async (size: PageSizeOption) => { // Define manejador o función handleItemsPerPageChange
    const updated = await saveUserSettings({ // Guarda preferencias de usuario en almacenamiento local
      ...userSettings, // Copia propiedades existentes (...userSettings) mediante spread operator
      itemsPerPage: size, // Define propiedad "itemsPerPage" en el objeto actual
    }); // Cierra bloque o expresión anterior
    setUserSettings(updated); // Actualiza user settings
    setCurrentPage(1); // Actualiza current page
  }; // Cierra bloque o expresión anterior

  const filteredRecipes = useMemo(() => { // Memoriza valor calculado de filtered recipes para optimizar rendimiento
    const query = filters.searchQuery.trim().toLowerCase(); // Compara texto normalizado para filtrar u ordenar recetas

    const filtered = recipes.filter((item) => { // Declara constante local filtered
      if (query) { // Evalúa condición lógica antes de ejecutar este bloque
        const matchesQuery = // Declara constante local matchesQuery
          item.title.toLowerCase().includes(query) || // Compara texto normalizado para filtrar u ordenar recetas
          item.description.toLowerCase().includes(query) || // Compara texto normalizado para filtrar u ordenar recetas
          item.category.toLowerCase().includes(query); // Compara texto normalizado para filtrar u ordenar recetas
        if (!matchesQuery) return false; // Evalúa condición lógica antes de ejecutar este bloque
      } // Cierra rama del condicional if/else

      if ( // Evalúa condición lógica antes de ejecutar este bloque
        filters.category !== 'Todas' && // Evalúa condición basada en filters.category !== 'Todas' && para filtrar o aplicar estilos
        item.category.toLowerCase() !== filters.category.toLowerCase() // Compara texto normalizado para filtrar u ordenar recetas
      ) { // Cierra condición compuesta e inicia cuerpo del bloque
        return false; // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else

      if ( // Evalúa condición lógica antes de ejecutar este bloque
        filters.difficulty !== 'Todas' && // Evalúa condición basada en filters.difficulty !== 'Todas' && para filtrar o aplicar estilos
        item.difficulty.toLowerCase() !== filters.difficulty.toLowerCase() // Compara texto normalizado para filtrar u ordenar recetas
      ) { // Cierra condición compuesta e inicia cuerpo del bloque
        return false; // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else

      if (filters.onlyFavorites && !favoriteIds.includes(item.id)) { // Evalúa condición lógica antes de ejecutar este bloque
        return false; // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else

      return true; // Devuelve resultado o detiene ejecución temprana de la función
    }); // Cierra bloque o expresión anterior

    if (filters.sortBy === 'likes_desc') { // Evalúa condición lógica antes de ejecutar este bloque
      return [...filtered].sort((a, b) => b.likeRate - a.likeRate); // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else
    if (filters.sortBy === 'time_asc') { // Evalúa condición lógica antes de ejecutar este bloque
      return [...filtered].sort((a, b) => // Devuelve resultado o detiene ejecución temprana de la función
        a.prepareTime.localeCompare(b.prepareTime) // Compara texto normalizado para filtrar u ordenar recetas
      ); // Finaliza sentencia de retorno
    } // Cierra rama del condicional if/else
    if (filters.sortBy === 'title_asc') { // Evalúa condición lógica antes de ejecutar este bloque
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title)); // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    return filtered; // Devuelve resultado o detiene ejecución temprana de la función
  }, [recipes, filters, favoriteIds]); // Cierra efecto o memoización; se re-ejecuta si cambia [recipes, filters, favoriteIds]

  const itemsPerPage = userSettings.itemsPerPage; // Declara constante local itemsPerPage
  const totalPages = Math.max( // Declara constante local totalPages
    1, // Pasa 1 como argumento a Math.max
    Math.ceil(filteredRecipes.length / itemsPerPage) // Realiza cálculo numérico auxiliar para paginación o límites
  ); // Cierra bloque o expresión anterior
  const safeCurrentPage = Math.min(currentPage, totalPages); // Declara constante local safeCurrentPage

  const paginatedRecipes = useMemo(() => { // Memoriza valor calculado de paginated recipes para optimizar rendimiento
    const start = (safeCurrentPage - 1) * itemsPerPage; // Define manejador o función start
    return filteredRecipes.slice(start, start + itemsPerPage); // Devuelve resultado o detiene ejecución temprana de la función
  }, [filteredRecipes, safeCurrentPage, itemsPerPage]); // Cierra efecto o memoización; se re-ejecuta si cambia [filteredRecipes, safeCurrentPage, itemsPerPage]

  const activeFavoritesCount = useMemo(() => { // Memoriza valor calculado de el conteo de recetas favoritas activas para optimizar rendimiento
    if (serverSearchActiveRef.current) { // Evalúa condición lógica antes de ejecutar este bloque
      return favoriteIds.length; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else
    return recipes.filter((item) => favoriteIds.includes(item.id)).length; // Devuelve resultado o detiene ejecución temprana de la función
  }, [recipes, favoriteIds]); // Cierra efecto o memoización; se re-ejecuta si cambia [recipes, favoriteIds]

  const navigateToDetail = (item: RecipeItem) => { // Define manejador o función navigateToDetail
    const safeItemParam = // Declara constante local safeItemParam
      item.image && item.image.startsWith('data:') // Detecta URI data: base64 pesada heredada para sustituir por respaldo
        ? { ...item, image: '', imageURL: '' } // Valor o rama devuelta cuando la condición ternaria es verdadera
        : item; // Rama alternativa que conserva el objeto receta sin modificaciones
    router.push({ // Navega agregando la nueva pantalla al historial
      pathname: '/details', // Define propiedad "pathname" en el objeto actual
      params: { // Inicia objeto de propiedad "params"
        id: String(item.id), // Define propiedad "id" en el objeto actual
        item: JSON.stringify(safeItemParam), // Define propiedad "item" en el objeto actual
      }, // Cierra objeto literal
    }); // Cierra bloque o expresión anterior
  }; // Cierra bloque o expresión anterior

  const isDark = isDarkTheme || userSettings.themeMode === 'dark'; // Declara constante local isDark

  if (loading) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Abre caja contenedora de diseño (layout) */}
        <ActivityIndicator // Inicia declaración de indicador giratorio de carga
          size="large" // Prop size: tamaño del icono o indicador de carga
          color={isDark ? '#E74C3C' : '#333333'} // Prop color: color del icono o spinner
        />{/* Cierra etiqueta autocontenida de componente */}
        <Text style={[styles.message, isDark && styles.messageDark]}>{/* Abre componente para renderizar texto en pantalla */}
          Cargando recetas...{/* Texto o expresión visible dentro del componente ("Cargando recetas...") */}
        </Text>{/* Cierra bloque de componente Text */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  if (error) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Abre caja contenedora de diseño (layout) */}
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
          {error}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
        </Text>{/* Cierra bloque de componente Text */}
        <Pressable onPress={fetchRecipes} style={styles.retryButton}>{/* Abre área táctil personalizable */}
          <Text style={styles.retryText}>Reintentar</Text>{/* Abre componente para renderizar texto en pantalla */}
        </Pressable>{/* Cierra bloque de componente Pressable */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  return ( // Inicia el árbol JSX retornado por el componente
    <View style={[styles.container, isDark && styles.containerDark]}>{/* Abre caja contenedora de diseño (layout) */}
      <FlatList // Inicia declaración de lista virtualizada eficiente para colecciones
        key={`recipes-grid-${numColumns}`} // Asigna prop "key" al componente
        numColumns={numColumns} // Prop numColumns: cantidad de columnas de la cuadrícula
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined} // Prop columnWrapperStyle: estilos aplicados a cada fila de columnas
        data={paginatedRecipes} // Prop data: arreglo de elementos a renderizar
        keyExtractor={(item) => String(item.id)} // Prop keyExtractor: extrae clave única para optimizar reciclaje de filas
        showsVerticalScrollIndicator={false} // Prop showsVerticalScrollIndicator: muestra u oculta la barra vertical de scroll
        refreshing={refreshing} // Asigna prop "refreshing" al componente
        onRefresh={onRefresh} // Prop onRefresh: dispara recarga al deslizar hacia abajo
        contentContainerStyle={styles.listContent} // Prop contentContainerStyle: estilos del contenedor interno desplazable
        ListHeaderComponent={ // Prop ListHeaderComponent: encabezado incluido dentro del desplazamiento de la lista
          <View>{/* Abre caja contenedora de diseño (layout) */}
            <View style={styles.headerActions}>{/* Abre caja contenedora de diseño (layout) */}
              <Pressable // Inicia declaración de área táctil personalizable
                onPress={() => router.push('/form')} // Navega agregando la nueva pantalla al historial
                style={[styles.actionBtn, styles.primaryActionBtn]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text style={styles.actionBtnText}>+ Nueva receta</Text>{/* Abre componente para renderizar texto en pantalla */}
              </Pressable>{/* Cierra bloque de componente Pressable */}

              <Pressable // Inicia declaración de área táctil personalizable
                onPress={() => router.push('/favorites')} // Navega agregando la nueva pantalla al historial
                style={[styles.actionBtn, styles.secondaryActionBtn]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text style={styles.actionBtnText}>{/* Abre componente para renderizar texto en pantalla */}
                  ♥ Favoritos ({activeFavoritesCount}){/* Texto o expresión visible dentro del componente ("♥ Favoritos ({activeFavoritesCount})") */}
                </Text>{/* Cierra bloque de componente Text */}
              </Pressable>{/* Cierra bloque de componente Pressable */}

              <Pressable // Inicia declaración de área táctil personalizable
                onPress={() => router.push('/settings')} // Navega agregando la nueva pantalla al historial
                style={[styles.actionBtn, styles.neutralActionBtn]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text style={styles.actionBtnText}>⚙️ Ajustes</Text>{/* Abre componente para renderizar texto en pantalla */}
              </Pressable>{/* Cierra bloque de componente Pressable */}

              <Pressable // Inicia declaración de área táctil personalizable
                onPress={() => handleLogout()} // Prop onPress: ejecuta acción al tocar el elemento
                style={[styles.actionBtn, styles.dangerActionBtn]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text style={styles.actionBtnText}>Cerrar sesión</Text>{/* Abre componente para renderizar texto en pantalla */}
              </Pressable>{/* Cierra bloque de componente Pressable */}
            </View>{/* Cierra bloque de componente View */}

            <SearchFilterBar // Inicia declaración de barra reutilizable de búsqueda y filtros
              filters={filters} // Asigna prop "filters" al componente
              totalResults={filteredRecipes.length} // Asigna prop "totalResults" al componente
              favoritesCount={activeFavoritesCount} // Asigna prop "favoritesCount" al componente
              darkMode={isDark} // Asigna prop "darkMode" al componente
              onChangeSearch={(text: string) => { // Asigna prop "onChangeSearch" al componente
                setFilters((prev) => ({ ...prev, searchQuery: text })); // Actualiza filters
                setCurrentPage(1); // Actualiza current page
                if (text.trim() === '' && serverSearchActiveRef.current) { // Evalúa condición lógica antes de ejecutar este bloque
                  serverSearchActiveRef.current = false; // Actualiza bandera interna en useRef sin disparar nuevo renderizado
                  getRecipes() // Consulta el listado de recetas desde el servicio (JSON o caché)
                    .then(setRecipes) // Encadena acción cuando la promesa se resuelve correctamente
                    .catch(() => {}); // Captura silenciosa o manejada si la promesa falla
                } // Cierra rama del condicional if/else
              }} // Cierra bloque o expresión anterior
              onSubmitServerSearch={handleServerSearch} // Asigna prop "onSubmitServerSearch" al componente
              onSelectCategory={(category: RecipeCategory) => { // Prop onSelectCategory: actualiza la categoría seleccionada
                setFilters((prev) => ({ ...prev, category })); // Actualiza filters
                setCurrentPage(1); // Actualiza current page
              }} // Cierra bloque o expresión anterior
              onSelectDifficulty={(difficulty: RecipeDifficulty) => { // Asigna prop "onSelectDifficulty" al componente
                setFilters((prev) => ({ ...prev, difficulty })); // Actualiza filters
                setCurrentPage(1); // Actualiza current page
              }} // Cierra bloque o expresión anterior
              onSelectSort={(sortBy: SortOption) => { // Asigna prop "onSelectSort" al componente
                setFilters((prev) => ({ ...prev, sortBy })); // Actualiza filters
                setCurrentPage(1); // Actualiza current page
              }} // Cierra bloque o expresión anterior
              onToggleOnlyFavorites={() => { // Asigna prop "onToggleOnlyFavorites" al componente
                setFilters((prev) => ({ // Actualiza filters
                  ...prev, // Copia propiedades existentes (...prev) mediante spread operator
                  onlyFavorites: !prev.onlyFavorites, // Define propiedad "onlyFavorites" en el objeto actual
                })); // Cierra bloque o expresión anterior
                setCurrentPage(1); // Actualiza current page
              }} // Cierra bloque o expresión anterior
              onResetFilters={handleResetAllFilters} // Prop onResetFilters: limpia búsqueda y filtros activos
            />{/* Cierra etiqueta autocontenida de componente */}
          </View> // Cierra bloque de componente View
        } // Cierra bloque o expresión anterior
        renderItem={({ item }) => ( // Prop renderItem: función que dibuja cada tarjeta o fila de la lista
          <View style={numColumns > 1 ? styles.gridItem : styles.singleItem}>{/* Abre caja contenedora de diseño (layout) */}
            <Card // Inicia declaración de tarjeta reutilizable de receta
              title={item.title} // Asigna prop "title" al componente
              image={item.image} // Asigna prop "image" al componente
              description={item.description} // Asigna prop "description" al componente
              category={item.category} // Asigna prop "category" al componente
              difficulty={item.difficulty} // Asigna prop "difficulty" al componente
              prepareTime={item.prepareTime} // Asigna prop "prepareTime" al componente
              likeRate={item.likeRate} // Asigna prop "likeRate" al componente
              isFavorite={favoriteIds.includes(item.id)} // Asigna prop "isFavorite" al componente
              compact={ // Prop compact: indica si debe mostrarse en diseño compacto
                userSettings.compactCards || (isLandscape && height < 480) // Activa tarjetas compactas por preferencia del usuario o pantalla horizontal baja
              } // Cierra bloque o expresión anterior
              darkMode={isDark} // Asigna prop "darkMode" al componente
              onToggleFavorite={() => handleToggleFavorite(item.id)} // Prop onToggleFavorite: alterna favorito de la tarjeta
              onPress={() => navigateToDetail(item)} // Prop onPress: ejecuta acción al tocar el elemento
            />{/* Cierra etiqueta autocontenida de componente */}
          </View> // Cierra bloque de componente View
        )} // Cierra bloque de renderizado condicional o iteración JSX
        ListEmptyComponent={ // Prop ListEmptyComponent: vista mostrada cuando la lista está vacía
          <View style={[styles.emptyBox, isDark && styles.emptyBoxDark]}>{/* Abre caja contenedora de diseño (layout) */}
            <Text style={[styles.emptyTitle, isDark && styles.messageDark]}>{/* Abre componente para renderizar texto en pantalla */}
              No se encontraron recetas con los filtros seleccionados.{/* Texto o expresión visible dentro del componente ("No se encontraron recetas con los filtros ") */}
            </Text>{/* Cierra bloque de componente Text */}
            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleResetAllFilters} // Prop onPress: ejecuta acción al tocar el elemento
              style={styles.retryButton} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={styles.retryText}>Mostrar todas las recetas</Text>{/* Abre componente para renderizar texto en pantalla */}
            </Pressable>{/* Cierra bloque de componente Pressable */}
          </View> // Cierra bloque de componente View
        } // Cierra bloque o expresión anterior
        ListFooterComponent={ // Prop ListFooterComponent: pie incluido al final de la lista
          <PaginationBar // Inicia declaración de barra reutilizable de paginación
            currentPage={safeCurrentPage} // Prop currentPage: número de página actual
            totalPages={totalPages} // Prop totalPages: total de páginas calculadas
            totalItems={filteredRecipes.length} // Prop totalItems: total de elementos encontrados
            itemsPerPage={itemsPerPage} // Asigna prop "itemsPerPage" al componente
            darkMode={isDark} // Asigna prop "darkMode" al componente
            onPageChange={(page: number) => setCurrentPage(page)} // Prop onPageChange: cambia a la página seleccionada
            onItemsPerPageChange={handleItemsPerPageChange} // Asigna prop "onItemsPerPageChange" al componente
          /> // Cierra etiqueta autocontenida de componente
        } // Cierra bloque o expresión anterior
      />{/* Cierra etiqueta autocontenida de componente */}
    </View> // Cierra bloque de componente View
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función HomeScreen

const styles = StyleSheet.create({ // Inicia definición optimizada de estilos visuales con StyleSheet.create
  container: { // Define grupo de estilos para "container"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    backgroundColor: '#FAF7F5', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  containerDark: { // Define grupo de estilos para "containerDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  listContent: { // Define grupo de estilos para "listContent"
    padding: 16, // Estilo padding: espaciado interno en los cuatro lados
    maxWidth: 1200, // Estilo maxWidth: ancho máximo permitido
    width: '100%', // Estilo width: ancho fijo o porcentual
    alignSelf: 'center', // Estilo alignSelf: anula alineación propia dentro del padre
  }, // Cierra objeto literal
  columnWrapper: { // Define grupo de estilos para "columnWrapper"
    gap: 16, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  gridItem: { // Define grupo de estilos para "gridItem"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
  }, // Cierra objeto literal
  singleItem: { // Define grupo de estilos para "singleItem"
    width: '100%', // Estilo width: ancho fijo o porcentual
  }, // Cierra objeto literal
  centered: { // Define grupo de estilos para "centered"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    padding: 24, // Estilo padding: espaciado interno en los cuatro lados
    backgroundColor: '#FAF7F5', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  centeredDark: { // Define grupo de estilos para "centeredDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  message: { // Define grupo de estilos para "message"
    marginTop: 12, // Estilo marginTop: margen externo superior
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#333333', // Estilo color: color de texto o icono
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  messageDark: { // Define grupo de estilos para "messageDark"
    color: '#F7F2F0', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  errorText: { // Define grupo de estilos para "errorText"
    color: '#C0392B', // Estilo color: color de texto o icono
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    textAlign: 'center', // Estilo textAlign: alineación horizontal del texto
    marginBottom: 16, // Estilo marginBottom: margen externo inferior
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  errorTextDark: { // Define grupo de estilos para "errorTextDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  retryButton: { // Define grupo de estilos para "retryButton"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    paddingHorizontal: 20, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 12, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
  }, // Cierra objeto literal
  retryText: { // Define grupo de estilos para "retryText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontSize: 15, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  headerActions: { // Define grupo de estilos para "headerActions"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    flexWrap: 'wrap', // Estilo flexWrap: permite saltar a nueva línea si no cabe
    gap: 8, // Estilo gap: espacio uniforme entre elementos hijos
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  actionBtn: { // Define grupo de estilos para "actionBtn"
    paddingHorizontal: 14, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 10, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
  }, // Cierra objeto literal
  primaryActionBtn: { // Define grupo de estilos para "primaryActionBtn"
    backgroundColor: '#27AE60', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  secondaryActionBtn: { // Define grupo de estilos para "secondaryActionBtn"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  neutralActionBtn: { // Define grupo de estilos para "neutralActionBtn"
    backgroundColor: '#753333', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  dangerActionBtn: { // Define grupo de estilos para "dangerActionBtn"
    backgroundColor: '#4A3833', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  actionBtnText: { // Define grupo de estilos para "actionBtnText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  emptyBox: { // Define grupo de estilos para "emptyBox"
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
    borderRadius: 12, // Estilo borderRadius: redondeo de esquinas
    padding: 28, // Estilo padding: espaciado interno en los cuatro lados
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#EAE2DF', // Estilo borderColor: color del borde
    marginVertical: 16, // Estilo marginVertical: margen externo vertical
  }, // Cierra objeto literal
  emptyBoxDark: { // Define grupo de estilos para "emptyBoxDark"
    backgroundColor: '#241D1B', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  emptyTitle: { // Define grupo de estilos para "emptyTitle"
    fontSize: 15, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#555555', // Estilo color: color de texto o icono
    textAlign: 'center', // Estilo textAlign: alineación horizontal del texto
    marginBottom: 14, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
}); // Cierra bloque o expresión anterior
