import { useFocusEffect, useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useFocusEffect, useRouter })
import { useCallback, useMemo, useState } from 'react'; // Importa React y sus hooks ({ useCallback, useMemo, useState }) para estado y ciclo de vida
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
import { getRecipes } from '@/services/recipes'; // Importa funciones del servicio de datos (@/services/recipes)
import { UserSettings } from '@/types/Auth'; // Importa tipos TypeScript de dominio desde @/types/Auth
import { RecipeItem } from '@/types/RecipeItem'; // Importa tipos TypeScript de dominio desde @/types/RecipeItem
import { // Continúa o inicia bloque de importación de módulos
  DEFAULT_USER_SETTINGS, // Importa "DEFAULT_USER_SETTINGS" desde @/utils/preferencesStorage
  getFavorites, // Importa "getFavorites" desde @/utils/preferencesStorage
  getUserSettings, // Importa "getUserSettings" desde @/utils/preferencesStorage
  toggleFavorite, // Importa "toggleFavorite" desde @/utils/preferencesStorage
  useThemeMode, // Importa "useThemeMode" desde @/utils/preferencesStorage
} from '@/utils/preferencesStorage'; // Finaliza importación múltiple desde @/utils/preferencesStorage

export default function FavoritesScreen() { // Declara y exporta la pantalla principal FavoritesScreen
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDarkTheme = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width, height } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isLandscape = width > height; // Declara constante local isLandscape
  const numColumns = width >= 980 ? 3 : width >= 620 || isLandscape ? 2 : 1; // Declara constante local numColumns

  const [recipes, setRecipes] = useState<RecipeItem[]>([]); // Declara estado reactivo para la lista paginada de recetas mostradas
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]); // Declara estado reactivo para favorite ids
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS); // Declara estado reactivo para settings
  const [loading, setLoading] = useState<boolean>(true); // Declara estado reactivo para el indicador de carga
  const [error, setError] = useState<string | null>(null); // Declara estado reactivo para el mensaje de error actual

  const loadFavoritesData = useCallback(async () => { // Memoriza la función loadFavoritesData para evitar recreaciones innecesarias
    try { // Inicia bloque try para capturar posibles errores de ejecución
      setError(null); // Actualiza el mensaje de error actual
      const [allRecipes, favs, userPrefs] = await Promise.all([ // Ejecuta múltiples peticiones asíncronas en paralelo y espera todas
        getRecipes(), // Consulta el listado de recetas desde el servicio (JSON o caché)
        getFavorites(), // Carga los identificadores o recetas marcadas como favoritas
        getUserSettings(), // Carga preferencias de usuario guardadas localmente
      ]); // Cierra bloque o expresión anterior
      setRecipes(allRecipes); // Actualiza la lista paginada de recetas mostradas
      setFavoriteIds(favs); // Actualiza favorite ids
      setSettings(userPrefs); // Actualiza settings
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      setError( // Actualiza el mensaje de error actual
        err instanceof Error // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
          ? err.message // Si es instancia Error, extrae su mensaje descriptivo
          : 'No se pudieron cargar tus recetas favoritas.' // Valor o rama devuelta cuando la condición ternaria es falsa
      ); // Cierra bloque o expresión anterior
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setLoading(false); // Actualiza el indicador de carga
    } // Cierra bloque try o finally
  }, []); // Cierra efecto o memoización; sin dependencias, corre solo al montar

  useFocusEffect( // Ejecuta recarga automática cada vez que esta pantalla recupera el foco
    useCallback(() => { // Inicia callback o cálculo memorizado para evitar trabajo repetido
      loadFavoritesData(); // Invoca la función loadFavoritesData en este punto del flujo
    }, [loadFavoritesData]) // Cierra efecto o memoización; se re-ejecuta si cambia [loadFavoritesData]
  ); // Cierra bloque o expresión anterior

  const handleToggleFavorite = async (recipeId: number) => { // Define manejador o función handleToggleFavorite
    const updated = await toggleFavorite(recipeId); // Alterna y persiste el estado de receta favorita
    setFavoriteIds(updated); // Actualiza favorite ids
  }; // Cierra bloque o expresión anterior

  const favoriteRecipes = useMemo(() => { // Memoriza valor calculado de la lista de recetas marcadas como favoritas para optimizar rendimiento
    return recipes.filter((item) => favoriteIds.includes(item.id)); // Devuelve resultado o detiene ejecución temprana de la función
  }, [recipes, favoriteIds]); // Cierra efecto o memoización; se re-ejecuta si cambia [recipes, favoriteIds]

  const isDark = isDarkTheme || settings.themeMode === 'dark'; // Declara constante local isDark

  if (loading) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Abre caja contenedora de diseño (layout) */}
        <ActivityIndicator // Inicia declaración de indicador giratorio de carga
          size="large" // Prop size: tamaño del icono o indicador de carga
          color={isDark ? '#E74C3C' : '#333333'} // Prop color: color del icono o spinner
        />{/* Cierra etiqueta autocontenida de componente */}
        <Text style={[styles.message, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
          Cargando tus recetas favoritas...{/* Texto o expresión visible dentro del componente ("Cargando tus recetas favoritas...") */}
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
        <Pressable onPress={loadFavoritesData} style={styles.primaryButton}>{/* Abre área táctil personalizable */}
          <Text style={styles.primaryButtonText}>Reintentar</Text>{/* Abre componente para renderizar texto en pantalla */}
        </Pressable>{/* Cierra bloque de componente Pressable */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  return ( // Inicia el árbol JSX retornado por el componente
    <View style={[styles.container, isDark && styles.containerDark]}>{/* Abre caja contenedora de diseño (layout) */}
      <FlatList // Inicia declaración de lista virtualizada eficiente para colecciones
        key={`favorites-grid-${numColumns}`} // Asigna prop "key" al componente
        numColumns={numColumns} // Prop numColumns: cantidad de columnas de la cuadrícula
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined} // Prop columnWrapperStyle: estilos aplicados a cada fila de columnas
        data={favoriteRecipes} // Prop data: arreglo de elementos a renderizar
        keyExtractor={(item) => String(item.id)} // Prop keyExtractor: extrae clave única para optimizar reciclaje de filas
        showsVerticalScrollIndicator={false} // Prop showsVerticalScrollIndicator: muestra u oculta la barra vertical de scroll
        contentContainerStyle={styles.listContent} // Prop contentContainerStyle: estilos del contenedor interno desplazable
        ListHeaderComponent={ // Prop ListHeaderComponent: encabezado incluido dentro del desplazamiento de la lista
          <View style={styles.headerBox}>{/* Abre caja contenedora de diseño (layout) */}
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Mis Recetas Favoritas ({favoriteRecipes.length}){/* Texto o expresión visible dentro del componente ("Mis Recetas Favoritas ({favoriteRecipes.le") */}
            </Text>{/* Cierra bloque de componente Text */}
            <Text style={[styles.headerSubtitle, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Toca el corazón para quitar una receta de tu colección o selecciona
              una tarjeta para ver el detalle completo.{/* Texto o expresión visible dentro del componente ("una tarjeta para ver el detalle completo.") */}
            </Text>{/* Cierra bloque de componente Text */}
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
              isFavorite={true} // Asigna prop "isFavorite" al componente
              compact={settings.compactCards || (isLandscape && height < 480)} // Prop compact: indica si debe mostrarse en diseño compacto
              darkMode={isDark} // Asigna prop "darkMode" al componente
              onToggleFavorite={() => handleToggleFavorite(item.id)} // Prop onToggleFavorite: alterna favorito de la tarjeta
              onPress={() => { // Prop onPress: ejecuta acción al tocar el elemento
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
              }} // Cierra bloque o expresión anterior
            />{/* Cierra etiqueta autocontenida de componente */}
          </View> // Cierra bloque de componente View
        )} // Cierra bloque de renderizado condicional o iteración JSX
        ListEmptyComponent={ // Prop ListEmptyComponent: vista mostrada cuando la lista está vacía
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>{/* Abre caja contenedora de diseño (layout) */}
            <Text style={styles.emptyIcon}>🍲</Text>{/* Abre componente para renderizar texto en pantalla */}
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Aún no tienes recetas favoritas{/* Texto o expresión visible dentro del componente ("Aún no tienes recetas favoritas") */}
            </Text>{/* Cierra bloque de componente Text */}
            <Text style={[styles.emptySubtitle, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Marca con el corazón ♥ las recetas que más te gusten en el catálogo
              para encontrarlas rápidamente aquí.{/* Texto o expresión visible dentro del componente ("para encontrarlas rápidamente aquí.") */}
            </Text>{/* Cierra bloque de componente Text */}
            <Pressable // Inicia declaración de área táctil personalizable
              onPress={() => router.replace('/home')} // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
              style={styles.primaryButton} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={styles.primaryButtonText}>Explorar catálogo</Text>{/* Abre componente para renderizar texto en pantalla */}
            </Pressable>{/* Cierra bloque de componente Pressable */}
          </View> // Cierra bloque de componente View
        } // Cierra bloque o expresión anterior
      />{/* Cierra etiqueta autocontenida de componente */}
    </View> // Cierra bloque de componente View
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función FavoritesScreen

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
  textDark: { // Define grupo de estilos para "textDark"
    color: '#F7F2F0', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  subTextDark: { // Define grupo de estilos para "subTextDark"
    color: '#B8A9A4', // Estilo color: color de texto o icono
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
  headerBox: { // Define grupo de estilos para "headerBox"
    marginBottom: 16, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  headerTitle: { // Define grupo de estilos para "headerTitle"
    fontSize: 22, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  headerSubtitle: { // Define grupo de estilos para "headerSubtitle"
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#555555', // Estilo color: color de texto o icono
    marginTop: 4, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  emptyState: { // Define grupo de estilos para "emptyState"
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
    borderRadius: 14, // Estilo borderRadius: redondeo de esquinas
    padding: 32, // Estilo padding: espaciado interno en los cuatro lados
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#EAE2DF', // Estilo borderColor: color del borde
    marginTop: 16, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  emptyStateDark: { // Define grupo de estilos para "emptyStateDark"
    backgroundColor: '#241D1B', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  emptyIcon: { // Define grupo de estilos para "emptyIcon"
    fontSize: 48, // Estilo fontSize: tamaño de fuente en píxeles
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  emptyTitle: { // Define grupo de estilos para "emptyTitle"
    fontSize: 18, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
    marginBottom: 8, // Estilo marginBottom: margen externo inferior
    textAlign: 'center', // Estilo textAlign: alineación horizontal del texto
  }, // Cierra objeto literal
  emptySubtitle: { // Define grupo de estilos para "emptySubtitle"
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#666666', // Estilo color: color de texto o icono
    textAlign: 'center', // Estilo textAlign: alineación horizontal del texto
    marginBottom: 20, // Estilo marginBottom: margen externo inferior
    lineHeight: 20, // Estilo lineHeight: altura de línea para legibilidad
  }, // Cierra objeto literal
  primaryButton: { // Define grupo de estilos para "primaryButton"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    paddingHorizontal: 22, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
  }, // Cierra objeto literal
  primaryButtonText: { // Define grupo de estilos para "primaryButtonText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 15, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
}); // Cierra bloque o expresión anterior
