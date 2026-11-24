import { useFocusEffect, useRouter } from 'expo-router'; // Recarga favoritos al volver a la pantalla y permite navegar a Detalle o Home
import { useCallback, useMemo, useState } from 'react'; // Hooks para memorizar carga, filtrar favoritos y guardar estados locales
import { // Componentes visuales de React Native para cuadrícula de tarjetas favoritas y estados vacíos
  ActivityIndicator, // Spinner centrado mostrado durante la carga inicial
  FlatList, // Lista virtualizada en 1, 2 o 3 columnas reutilizando <Card />
  Pressable, // Botones "Reintentar" y "Explorar catálogo"
  StyleSheet, // Compila hoja de estilos nativa para claro/oscuro y columnas
  Text, // Textos visibles en cabecera, estado vacío y botones
  View, // Contenedores de pantalla, encabezados y celdas de cuadrícula
  useWindowDimensions, // Detecta giro portrait/landscape o cambio de tamaño en Web en tiempo real
} from 'react-native'; // Fin de importaciones de react-native
import Card from '@/components/ui/card'; // Tarjeta reutilizable de receta idéntica a la del catálogo principal
import { getRecipes } from '@/services/recipes'; // Trae todas las recetas vigentes desde server.js o caché offline
import { UserSettings } from '@/types/Auth'; // Tipado de preferencias de usuario (tema y tarjetas compactas)
import { RecipeItem } from '@/types/RecipeItem'; // Modelo normalizado de receta mostrado en cada tarjeta
import { // Funciones de almacenamiento por usuario y suscripción reactiva al tema visual
  DEFAULT_USER_SETTINGS, // Valores iniciales mientras llegan las preferencias guardadas
  getFavorites, // Lee arreglo de IDs marcados con ♥ para la cuenta activa
  getUserSettings, // Obtiene compactCards y themeMode del usuario
  toggleFavorite, // Quita o agrega un ID de receta en favoritos y devuelve la nueva lista
  useThemeMode, // Se suscribe en vivo al cambio de Modo Claro/Oscuro
} from '@/utils/preferencesStorage'; // Fin de importaciones de preferenciasStorage

export default function FavoritesScreen() { // Pantalla protegida que muestra solo las recetas marcadas como favoritas
  const router = useRouter(); // Permite navegar al detalle de una receta o regresar al catálogo completo
  const isDarkTheme = useThemeMode(); // Bandera global reactiva de Modo Oscuro
  const { width, height } = useWindowDimensions(); // Medidas actuales de pantalla para calcular columnas responsivas
  const isLandscape = width > height; // Verdadero cuando el dispositivo está en orientación horizontal
  const numColumns = width >= 980 ? 3 : width >= 620 || isLandscape ? 2 : 1; // 3 cols en escritorio, 2 en tablet/landscape, 1 en móvil vertical

  const [recipes, setRecipes] = useState<RecipeItem[]>([]); // Catálogo completo necesario para cruzar contra los IDs favoritos
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]); // Lista de IDs de recetas guardadas con ♥ por el usuario
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS); // Preferencias de compacto y tema del usuario
  const [loading, setLoading] = useState<boolean>(true); // Muestra el spinner hasta completar la primera carga en paralelo
  const [error, setError] = useState<string | null>(null); // Guarda el mensaje si falla cargar recetas o favoritos

  const loadFavoritesData = useCallback(async () => { // Carga en paralelo recetas, IDs favoritos y ajustes; memorizada para useFocusEffect
    try { // Inicia consulta paralela de las 3 fuentes
      setError(null); // Limpia errores anteriores antes de reintentar
      const [allRecipes, favs, userPrefs] = await Promise.all([ // Ejecuta las 3 promesas simultáneamente para cargar más rápido
        getRecipes(), // Lista actualizada de recetas desde server.js o caché local
        getFavorites(), // IDs favoritos del usuario en sesión
        getUserSettings(), // Preferencias de visualización del usuario
      ]); // Fin de Promise.all
      setRecipes(allRecipes); // Actualiza catálogo en memoria
      setFavoriteIds(favs); // Actualiza IDs marcados con corazón
      setSettings(userPrefs); // Actualiza configuración de tarjetas compactas y tema
    } catch (err) { // Captura fallos inesperados al obtener datos
      setError( // Guarda mensaje legible para mostrar en la vista de error
        err instanceof Error // Comprueba si es instancia estándar de Error
          ? err.message // Usa el mensaje original del fallo
          : 'No se pudieron cargar tus recetas favoritas.' // Texto amigable por defecto
      ); // Fin de setError
    } finally { // Siempre apaga el spinner inicial aunque haya habido error
      setLoading(false); // Habilita el renderizado de la lista o pantalla de error
    } // Fin try/catch/finally
  }, []); // Sin dependencias externas: getRecipes/getFavorites/getUserSettings son estables

  useFocusEffect( // Se dispara cada vez que el usuario entra o vuelve a esta pantalla (ej. tras borrar en Detalle)
    useCallback(() => { // Callback memorizado exigido por Expo Router para evitar re-suscripciones infinitas
      loadFavoritesData(); // Refresca recetas y favoritos al recuperar foco
    }, [loadFavoritesData]) // Solo cambia si loadFavoritesData cambiara
  ); // Fin de useFocusEffect

  const handleToggleFavorite = async (recipeId: number) => { // Quita el corazón al tocar ♥ en una tarjeta favorita
    const updated = await toggleFavorite(recipeId); // Persiste la eliminación del ID y obtiene el arreglo resultante
    setFavoriteIds(updated); // Actualiza estado: la tarjeta desaparece al instante de favoriteRecipes
  }; // Fin de handleToggleFavorite

  const favoriteRecipes = useMemo(() => { // Filtra las recetas vigentes conservando únicamente las incluidas en favoriteIds
    return recipes.filter((item) => favoriteIds.includes(item.id)); // Excluye automáticamente recetas borradas del catálogo
  }, [recipes, favoriteIds]); // Solo recalcula cuando cambian recetas o favoritos

  const isDark = isDarkTheme || settings.themeMode === 'dark'; // Activa tema oscuro si el hook global o settings lo indican

  if (loading) { // Pantalla de espera mientras termina loadFavoritesData por primera vez
    return ( // Vista centrada con spinner y texto informativo
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo crema o café oscuro centrado */}
        <ActivityIndicator // Rueda giratoria nativa
          size="large" // Tamaño grande visible
          color={isDark ? '#E74C3C' : '#333333'} // Coral en oscuro o gris oscuro en claro
        />{/* Termina indicador de carga */}
        <Text style={[styles.message, isDark && styles.textDark]}>{/* Etiqueta debajo del spinner */}
          Cargando tus recetas favoritas...{/* Mensaje en español latino */}
        </Text>{/* Termina mensaje de carga */}
      </View> // Fin vista centrada de carga
    ); // Fin retorno temprano de carga
  } // Fin de guardia loading

  if (error) { // Pantalla de error con botón para reintentar si falló la carga
    return ( // Vista centrada de error recuperable
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo adaptado al tema */}
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{/* Texto rojo de error */}
          {error}{/* Muestra la descripción del problema */}
        </Text>{/* Termina texto de error */}
        <Pressable onPress={loadFavoritesData} style={styles.primaryButton}>{/* Botón para reintentar la carga */}
          <Text style={styles.primaryButtonText}>Reintentar</Text>{/* Texto blanco del botón */}
        </Pressable>{/* Termina botón Reintentar */}
      </View> // Fin vista centrada de error
    ); // Fin retorno temprano de error
  } // Fin de guardia error

  return ( // Vista principal con la cuadrícula de recetas favoritas
    <View style={[styles.container, isDark && styles.containerDark]}>{/* Contenedor raíz de pantalla completa */}
      <FlatList // Lista virtualizada adaptable a 1, 2 o 3 columnas
        key={`favorites-grid-${numColumns}`} // Obliga a reconstruir FlatList cuando cambia numColumns al rotar pantalla
        numColumns={numColumns} // Número dinámico de tarjetas por fila según ancho
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined} // Aplica gap horizontal solo en diseño multicolumna
        data={favoriteRecipes} // Arreglo ya filtrado con las recetas marcadas como favoritas
        keyExtractor={(item) => String(item.id)} // Identificador único de cada tarjeta para reciclaje eficiente
        showsVerticalScrollIndicator={false} // Oculta barra de scroll vertical para una vista más limpia
        contentContainerStyle={styles.listContent} // Centra la cuadrícula hasta 1200px con relleno de 16px
        ListHeaderComponent={ // Encabezado superior con conteo en vivo e instrucciones
          <View style={styles.headerBox}>{/* Contenedor de título y subtítulo */}
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>{/* Título con cantidad actual */}
              Mis Recetas Favoritas ({favoriteRecipes.length}){/* Muestra total dinámico entre paréntesis */}
            </Text>{/* Termina título de favoritos */}
            <Text style={[styles.headerSubtitle, isDark && styles.subTextDark]}>{/* Subtítulo explicativo */}
              Toca el corazón para quitar una receta de tu colección o selecciona
              una tarjeta para ver el detalle completo.{/* Guía rápida de interacción */}
            </Text>{/* Termina subtítulo */}
          </View> // Fin headerBox
        } // Fin ListHeaderComponent
        renderItem={({ item }) => ( // Dibuja cada receta favorita usando el componente reutilizable Card
          <View style={numColumns > 1 ? styles.gridItem : styles.singleItem}>{/* Celda flexible en cuadrícula o ancho total en 1 columna */}
            <Card // Tarjeta visual de receta
              title={item.title} // Título de la receta favorita
              image={item.image} // URI de fotografía (URL o Data URI)
              description={item.description} // Descripción resumida
              category={item.category} // Categoría gastronómica
              difficulty={item.difficulty} // Nivel de dificultad
              prepareTime={item.prepareTime} // Tiempo de preparación HH:MM:SS
              likeRate={item.likeRate} // Porcentaje de aprobación
              isFavorite={true} // Siempre true aquí porque todas las tarjetas listadas son favoritas
              compact={settings.compactCards || (isLandscape && height < 480)} // Activa modo compacto por ajuste o pantalla horizontal baja
              darkMode={isDark} // Pasa tema oscuro a la tarjeta
              onToggleFavorite={() => handleToggleFavorite(item.id)} // Quita la receta de favoritos sin abrir el detalle
              onPress={() => { // Navega a Detalle omitiendo data: URI gigantes de los parámetros de ruta
                const safeItemParam = // Prepara copia ligera para evitar URLs excesivamente largas en Web
                  item.image && item.image.startsWith('data:') // Detecta imágenes locales convertidas a Base64
                    ? { ...item, image: '', imageURL: '' } // Limpia Base64 en URL; Detalle recargará la foto vía getRecipe(id)
                    : item; // Conserva URLs HTTP normales para hidratación instantánea
                router.push({ // Apila /(app)/details pasando ID y objeto serializado
                  pathname: '/details', // Ruta de vista detallada
                  params: { // Parámetros serializados como texto
                    id: String(item.id), // ID numérico convertido a string
                    item: JSON.stringify(safeItemParam), // Objeto serializado para mostrar título/texto al instante
                  }, // Fin params
                }); // Fin router.push
              }} // Fin onPress tarjeta
            />{/* Termina componente Card */}
          </View> // Fin celda de cuadrícula
        )} // Fin renderItem
        ListEmptyComponent={ // Se renderiza automáticamente cuando favoriteRecipes queda vacío (0 elementos)
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>{/* Tarjeta amigable de colección vacía */}
            <Text style={styles.emptyIcon}>🍲</Text>{/* Ícono grande decorativo */}
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>{/* Mensaje principal vacío */}
              Aún no tienes recetas favoritas{/* Título cuando no hay favoritos */}
            </Text>{/* Termina título vacío */}
            <Text style={[styles.emptySubtitle, isDark && styles.subTextDark]}>{/* Instrucción para agregar favoritos */}
              Marca con el corazón ♥ las recetas que más te gusten en el catálogo
              para encontrarlas rápidamente aquí.{/* Explica cómo marcar recetas en Home */}
            </Text>{/* Termina subtítulo vacío */}
            <Pressable // Botón para volver directo al catálogo principal
              onPress={() => router.replace('/home')} // Reemplaza la ruta hacia /home para explorar recetas
              style={styles.primaryButton} // Botón rojo terracota
            >{/* Etiqueta del botón Explorar catálogo */}
              <Text style={styles.primaryButtonText}>Explorar catálogo</Text>{/* Texto blanco en negrita */}
            </Pressable>{/* Termina botón Explorar catálogo */}
          </View> // Fin emptyState
        } // Fin ListEmptyComponent
      />{/* Termina FlatList de favoritos */}
    </View> // Fin contenedor raíz de FavoritesScreen
  ); // Fin del retorno JSX principal
} // Fin de componente FavoritesScreen

const styles = StyleSheet.create({ // Hoja de estilos de FavoritesScreen
  container: { // Lienzo raíz en modo claro
    flex: 1, // Ocupa todo el alto de pantalla
    backgroundColor: '#FAF7F5', // Crema cálido
  }, // Fin container
  containerDark: { // Lienzo raíz en modo oscuro
    backgroundColor: '#181312', // Café oscuro profundo
  }, // Fin containerDark
  listContent: { // Contenedor interno del FlatList
    padding: 16, // Margen interno alrededor de la cuadrícula
    maxWidth: 1200, // Evita líneas demasiado anchas en monitores grandes
    width: '100%', // Ocupa todo el ancho en pantallas menores
    alignSelf: 'center', // Centra la cuadrícula horizontalmente
  }, // Fin listContent
  columnWrapper: { // Estilo aplicado a cada fila cuando numColumns > 1
    gap: 16, // Separación horizontal uniforme de 16px entre columnas
  }, // Fin columnWrapper
  gridItem: { // Envoltorio de cada tarjeta en modo multicolumna
    flex: 1, // Distribuye el ancho equitativamente entre las columnas de la fila
  }, // Fin gridItem
  singleItem: { // Envoltorio cuando solo hay 1 columna
    width: '100%', // Ocupa el ancho completo disponible
  }, // Fin singleItem
  centered: { // Contenedor centrado para estados de carga y error en claro
    flex: 1, // Pantalla completa
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    padding: 24, // Aire alrededor
    backgroundColor: '#FAF7F5', // Crema claro
  }, // Fin centered
  centeredDark: { // Contenedor centrado en modo oscuro
    backgroundColor: '#181312', // Café oscuro
  }, // Fin centeredDark
  message: { // Texto debajo del spinner de carga
    marginTop: 12, // Separación respecto al ActivityIndicator
    fontSize: 16, // Tamaño legible
    color: '#333333', // Gris oscuro
    fontWeight: '600', // Seminegrita
  }, // Fin message
  textDark: { // Color de texto principal en modo oscuro
    color: '#F7F2F0', // Blanco cálido
  }, // Fin textDark
  subTextDark: { // Color de subtítulos en modo oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin subTextDark
  errorText: { // Texto de error en modo claro
    color: '#C0392B', // Terracota de alerta
    fontSize: 16, // Tamaño legible
    textAlign: 'center', // Centrado en pantalla
    marginBottom: 16, // Espacio antes del botón Reintentar
    fontWeight: '600', // Seminegrita
  }, // Fin errorText
  errorTextDark: { // Texto de error en modo oscuro
    color: '#EC7063', // Coral brillante
  }, // Fin errorTextDark
  headerBox: { // Bloque de título y subtítulo encima de las tarjetas
    marginBottom: 16, // Separación con la primera fila de favoritos
  }, // Fin headerBox
  headerTitle: { // Título "Mis Recetas Favoritas (N)"
    fontSize: 22, // Tamaño prominente de cabecera
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café muy oscuro
  }, // Fin headerTitle
  headerSubtitle: { // Texto guía debajo del título
    fontSize: 14, // Tamaño secundario
    color: '#555555', // Gris medio
    marginTop: 4, // Separación con el título
  }, // Fin headerSubtitle
  emptyState: { // Tarjeta mostrada cuando no hay favoritos en claro
    backgroundColor: '#FFFFFF', // Superficie blanca
    borderRadius: 14, // Esquinas redondeadas
    padding: 32, // Relleno amplio centrado
    alignItems: 'center', // Centra ícono, textos y botón
    borderWidth: 1, // Borde 1px
    borderColor: '#EAE2DF', // Arena cálido
    marginTop: 16, // Separación respecto al headerBox
  }, // Fin emptyState
  emptyStateDark: { // Tarjeta de estado vacío en modo oscuro
    backgroundColor: '#241D1B', // Superficie café oscuro
    borderColor: '#382E2B', // Borde espresso
  }, // Fin emptyStateDark
  emptyIcon: { // Emoji de olla en estado vacío
    fontSize: 48, // Tamaño grande llamativo
    marginBottom: 12, // Separación con el título vacío
  }, // Fin emptyIcon
  emptyTitle: { // Título del estado vacío
    fontSize: 18, // Tamaño destacado
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café oscuro
    marginBottom: 8, // Separación con el subtítulo
    textAlign: 'center', // Centrado
  }, // Fin emptyTitle
  emptySubtitle: { // Explicación de cómo agregar favoritos
    fontSize: 14, // Tamaño estándar
    color: '#666666', // Gris medio
    textAlign: 'center', // Centrado
    marginBottom: 20, // Espacio antes del botón Explorar catálogo
    lineHeight: 20, // Interlineado cómodo de lectura
  }, // Fin emptySubtitle
  primaryButton: { // Botón rojo reutilizado en "Reintentar" y "Explorar catálogo"
    backgroundColor: '#C0392B', // Terracota principal
    paddingHorizontal: 22, // Ancho cómodo del botón
    paddingVertical: 14, // Alto táctil
    borderRadius: 8, // Esquinas redondeadas
  }, // Fin primaryButton
  primaryButtonText: { // Texto blanco del botón primario
    color: '#FFFFFF', // Blanco puro
    fontWeight: '700', // Negrita
    fontSize: 15, // Tamaño legible
  }, // Fin primaryButtonText
}); // Fin StyleSheet FavoritesScreen
