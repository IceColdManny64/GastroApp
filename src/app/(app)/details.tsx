import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useFocusEffect, useLocalSearchParams, useRouter })
import { useCallback, useMemo, useState } from 'react'; // Importa React y sus hooks ({ useCallback, useMemo, useState }) para estado y ciclo de vida
import { // Continúa o inicia bloque de importación de módulos
  ActivityIndicator, // Importa "ActivityIndicator" desde react-native
  Image, // Importa "Image" desde react-native
  Platform, // Importa "Platform" desde react-native
  Pressable, // Importa "Pressable" desde react-native
  ScrollView, // Importa "ScrollView" desde react-native
  StyleSheet, // Importa "StyleSheet" desde react-native
  Text, // Importa "Text" desde react-native
  View, // Importa "View" desde react-native
  useWindowDimensions, // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
} from 'react-native'; // Finaliza importación múltiple desde react-native
import { // Continúa o inicia bloque de importación de módulos
  DEFAULT_RECIPE_IMAGE, // Importa "DEFAULT_RECIPE_IMAGE" desde @/services/recipes
  deleteRecipe, // Importa "deleteRecipe" desde @/services/recipes
  getRecipe, // Importa "getRecipe" desde @/services/recipes
} from '@/services/recipes'; // Finaliza importación múltiple desde @/services/recipes
import { RecipeItem } from '@/types/RecipeItem'; // Importa tipos TypeScript de dominio desde @/types/RecipeItem
import { confirmAction, showAlert } from '@/utils/alerts'; // Importa utilidades auxiliares compartidas (@/utils/alerts)
import { safeGoBack } from '@/utils/navigation'; // Importa utilidades auxiliares compartidas (@/utils/navigation)
import { // Continúa o inicia bloque de importación de módulos
  getFavorites, // Importa "getFavorites" desde @/utils/preferencesStorage
  getUserSettings, // Importa "getUserSettings" desde @/utils/preferencesStorage
  toggleFavorite, // Importa "toggleFavorite" desde @/utils/preferencesStorage
  useThemeMode, // Importa "useThemeMode" desde @/utils/preferencesStorage
} from '@/utils/preferencesStorage'; // Finaliza importación múltiple desde @/utils/preferencesStorage

export default function DetailScreen() { // Declara y exporta la pantalla principal DetailScreen
  const { id, item: itemString } = useLocalSearchParams<{ // Lee los parámetros dinámicos recibidos en la URL de esta ruta
    id?: string; // Declara propiedad tipada "id?: string"
    item?: string; // Declara propiedad tipada "item?: string"
  }>(); // Especifica tipado TypeScript de retorno, parámetro o estado genérico

  const initialItem: RecipeItem | null = useMemo(() => { // Declara constante local initialItem: RecipeItem | null
    if (!itemString) return null; // Evalúa condición lógica antes de ejecutar este bloque
    try { // Inicia bloque try para capturar posibles errores de ejecución
      return JSON.parse(itemString) as RecipeItem; // Devuelve resultado o detiene ejecución temprana de la función
    } catch { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      return null; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra bloque de captura catch
  }, [itemString]); // Cierra efecto o memoización; se re-ejecuta si cambia [itemString]

  const [recipe, setRecipe] = useState<RecipeItem | null>(initialItem); // Declara estado reactivo para el objeto completo de la receta actual
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDarkTheme = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width, height } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isWideLayout = width >= 660 || (width > height && width >= 560); // Declara constante local isWideLayout

  const [loading, setLoading] = useState<boolean>(!initialItem); // Declara estado reactivo para el indicador de carga
  const [isFavorite, setIsFavorite] = useState(false); // Declara estado reactivo para el estado de receta favorita
  const [darkMode, setDarkMode] = useState(isDarkTheme); // Declara estado reactivo para dark mode
  const [imageUri, setImageUri] = useState<string>( // Declara estado reactivo para la imagen seleccionada o escrita
    initialItem?.image || DEFAULT_RECIPE_IMAGE // Lee valor opcional de forma segura con respaldo por defecto
  ); // Cierra bloque o expresión anterior

  const isDark = isDarkTheme || darkMode; // Declara constante local isDark

  useFocusEffect( // Ejecuta recarga automática cada vez que esta pantalla recupera el foco
    useCallback(() => { // Inicia callback o cálculo memorizado para evitar trabajo repetido
      let isActive = true; // Declara variable local mutable is active

      (async () => { // Inicia función asíncrona autoejecutable dentro del efecto
        try { // Inicia bloque try para capturar posibles errores de ejecución
          const numericId = Number(id ?? initialItem?.id); // Lee valor opcional de forma segura con respaldo por defecto
          if (!numericId) return; // Evalúa condición lógica antes de ejecutar este bloque

          const [fresh, favs, settings] = await Promise.all([ // Ejecuta múltiples peticiones asíncronas en paralelo y espera todas
            getRecipe(numericId), // Obtiene del servicio el detalle completo de la receta por ID
            getFavorites(), // Carga los identificadores o recetas marcadas como favoritas
            getUserSettings(), // Carga preferencias de usuario guardadas localmente
          ]); // Cierra bloque o expresión anterior

          if (isActive) { // Evalúa condición lógica antes de ejecutar este bloque
            setRecipe(fresh); // Actualiza el objeto completo de la receta actual
            setImageUri(fresh.image || DEFAULT_RECIPE_IMAGE); // Actualiza la imagen seleccionada o escrita
            setIsFavorite(favs.includes(fresh.id)); // Actualiza el estado de receta favorita
            setDarkMode(settings.themeMode === 'dark'); // Actualiza dark mode
          } // Cierra rama del condicional if/else
        } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
          console.error('[details.tsx] Error al cargar detalle:', err); // Registra detalle de error en consola para depuración
          if (isActive) { // Evalúa condición lógica antes de ejecutar este bloque
            setRecipe(null); // Actualiza el objeto completo de la receta actual
          } // Cierra rama del condicional if/else
          if (!initialItem) { // Evalúa condición lógica antes de ejecutar este bloque
            showAlert('Error', 'No se pudo cargar la receta.'); // Muestra alerta multiplataforma informativa o de error al usuario
          } // Cierra rama del condicional if/else
        } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
          if (isActive) setLoading(false); // Evalúa condición lógica antes de ejecutar este bloque
        } // Cierra bloque try o finally
      })(); // Ejecuta de inmediato y cierra la función asíncrona

      return () => { // Devuelve resultado o detiene ejecución temprana de la función
        isActive = false; // Desactiva bandera al desmontar componente para evitar actualizaciones tardías
      }; // Finaliza sentencia de retorno
    }, [id, initialItem]) // Cierra efecto o memoización; se re-ejecuta si cambia [id, initialItem]
  ); // Cierra bloque o expresión anterior

  const handleToggleFavorite = async () => { // Define manejador o función handleToggleFavorite
    if (!recipe) return; // Evalúa condición lógica antes de ejecutar este bloque
    const updated = await toggleFavorite(recipe.id); // Alterna y persiste el estado de receta favorita
    setIsFavorite(updated.includes(recipe.id)); // Actualiza el estado de receta favorita
  }; // Cierra bloque o expresión anterior

  const handleEdit = () => { // Define manejador o función handleEdit
    if (!recipe) return; // Evalúa condición lógica antes de ejecutar este bloque
    const safeRecipePayload = // Declara constante local safeRecipePayload
      recipe.image && recipe.image.startsWith('data:') // Detecta URI data: base64 pesada heredada para sustituir por respaldo
        ? { ...recipe, image: '', imageURL: '' } // Valor o rama devuelta cuando la condición ternaria es verdadera
        : recipe; // Rama alternativa que conserva el objeto receta sin modificaciones
    router.push({ // Navega agregando la nueva pantalla al historial
      pathname: '/form', // Define propiedad "pathname" en el objeto actual
      params: { // Inicia objeto de propiedad "params"
        id: String(recipe.id), // Define propiedad "id" en el objeto actual
        recipe: JSON.stringify(safeRecipePayload), // Define propiedad "recipe" en el objeto actual
      }, // Cierra objeto literal
    }); // Cierra bloque o expresión anterior
  }; // Cierra bloque o expresión anterior

  const executeDeletion = async () => { // Define manejador o función executeDeletion
    if (!recipe) return; // Evalúa condición lógica antes de ejecutar este bloque
    try { // Inicia bloque try para capturar posibles errores de ejecución
      await deleteRecipe(recipe.id); // Solicita eliminar la receta del almacenamiento
      safeGoBack(router, '/home'); // Regresa de forma segura a la pantalla anterior o al inicio
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      showAlert( // Muestra alerta multiplataforma informativa o de error al usuario
        'Error', // Cadena de texto usada como parámetro o mensaje ("Error")
        err instanceof Error ? err.message : 'No se pudo eliminar la receta.' // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
      ); // Cierra bloque o expresión anterior
    } // Cierra bloque de captura catch
  }; // Cierra bloque o expresión anterior

  const handleDelete = () => { // Define manejador o función handleDelete
    if (!recipe) return; // Evalúa condición lógica antes de ejecutar este bloque
    confirmAction( // Solicita confirmación del usuario antes de una acción destructiva
      'Confirmar', // Cadena de texto usada como parámetro o mensaje ("Confirmar")
      '¿Seguro que quieres eliminar esta receta?', // Cadena de texto usada como parámetro o mensaje ("¿Seguro que quieres eliminar esta receta?")
      executeDeletion // Pasa execute deletion como argumento a confirmAction
    ); // Cierra bloque o expresión anterior
  }; // Cierra bloque o expresión anterior

  if (loading) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Abre caja contenedora de diseño (layout) */}
        <ActivityIndicator // Inicia declaración de indicador giratorio de carga
          size="large" // Prop size: tamaño del icono o indicador de carga
          color={isDark ? '#E74C3C' : '#333333'} // Prop color: color del icono o spinner
        />{/* Cierra etiqueta autocontenida de componente */}
        <Text style={[styles.loadingText, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
          Cargando detalle de la receta...{/* Texto o expresión visible dentro del componente ("Cargando detalle de la receta...") */}
        </Text>{/* Cierra bloque de componente Text */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  if (!recipe) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Abre caja contenedora de diseño (layout) */}
        <Text style={[styles.emptyText, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
          No se encontró la receta{/* Texto o expresión visible dentro del componente ("No se encontró la receta") */}
        </Text>{/* Cierra bloque de componente Text */}
        <Pressable // Inicia declaración de área táctil personalizable
          onPress={() => safeGoBack(router, '/home')} // Regresa de forma segura a la pantalla anterior o al inicio
          style={[styles.button, styles.editButton]} // Prop style: aplica estilos visuales al componente
        >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
          <Text style={styles.buttonText}>Volver al catálogo</Text>{/* Abre componente para renderizar texto en pantalla */}
        </Pressable>{/* Cierra bloque de componente Pressable */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  return ( // Inicia el árbol JSX retornado por el componente
    <ScrollView // Inicia declaración de contenedor con desplazamiento vertical
      style={[styles.screen, isDark && styles.screenDark]} // Prop style: aplica estilos visuales al componente
      contentContainerStyle={styles.container} // Prop contentContainerStyle: estilos del contenedor interno desplazable
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <View // Inicia declaración de caja contenedora de diseño (layout)
        style={[ // Prop style: aplica estilos visuales al componente
          styles.detailCard, // Aplica estilo base "detailCard"
          isDark && styles.detailCardDark, // Aplica estilo condicional "detailCardDark" cuando se cumple isDark
          isWideLayout && styles.detailCardWide, // Aplica estilo condicional "detailCardWide" cuando se cumple isWideLayout
        ]} // Cierra lista combinada de estilos del componente
      >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
        <Image // Inicia declaración de componente visual para mostrar imágenes
          source={{ uri: imageUri }} // Prop source: origen de la imagen (URI remota o local)
          style={[ // Prop style: aplica estilos visuales al componente
            styles.heroImage, // Aplica estilo base "heroImage"
            isDark && styles.heroImageDark, // Aplica estilo condicional "heroImageDark" cuando se cumple isDark
            isWideLayout && styles.heroImageWide, // Aplica estilo condicional "heroImageWide" cuando se cumple isWideLayout
          ]} // Cierra lista combinada de estilos del componente
          onError={() => setImageUri(DEFAULT_RECIPE_IMAGE)} // Asigna prop "onError" al componente
        />{/* Cierra etiqueta autocontenida de componente */}

        <View // Inicia declaración de caja contenedora de diseño (layout)
          style={[styles.bodyContent, isWideLayout && styles.bodyContentWide]} // Prop style: aplica estilos visuales al componente
        >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
          <View style={styles.topRow}>{/* Abre caja contenedora de diseño (layout) */}
            <View // Inicia declaración de caja contenedora de diseño (layout)
              style={[ // Prop style: aplica estilos visuales al componente
                styles.categoryBadge, // Aplica estilo base "categoryBadge"
                isDark && styles.categoryBadgeDark, // Aplica estilo condicional "categoryBadgeDark" cuando se cumple isDark
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={styles.categoryText}>{recipe.category}</Text>{/* Abre componente para renderizar texto en pantalla */}
            </View>{/* Cierra bloque de componente View */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleToggleFavorite} // Prop onPress: ejecuta acción al tocar el elemento
              style={[ // Prop style: aplica estilos visuales al componente
                styles.favoriteButton, // Aplica estilo base "favoriteButton"
                isDark && styles.favoriteButtonDark, // Aplica estilo condicional "favoriteButtonDark" cuando se cumple isDark
                isFavorite && // Evalúa condición basada en isFavorite && para filtrar o aplicar estilos
                  (isDark // Inicia subexpresión condicional (isDark)
                    ? styles.favoriteButtonActiveDark // Selecciona o combina estilos condicionales para el componente
                    : styles.favoriteButtonActive), // Selecciona o combina estilos condicionales para el componente
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text // Inicia declaración de componente para renderizar texto en pantalla
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.favoriteButtonText, // Aplica estilo base "favoriteButtonText"
                  isDark && styles.favoriteButtonTextDark, // Aplica estilo condicional "favoriteButtonTextDark" cuando se cumple isDark
                  isFavorite && // Evalúa condición basada en isFavorite && para filtrar o aplicar estilos
                    (isDark // Inicia subexpresión condicional (isDark)
                      ? styles.favoriteButtonTextActiveDark // Selecciona o combina estilos condicionales para el componente
                      : styles.favoriteButtonTextActive), // Selecciona o combina estilos condicionales para el componente
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                {isFavorite ? '♥ En tus favoritos' : '♡ Agregar a favoritos'}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
              </Text>{/* Cierra bloque de componente Text */}
            </Pressable>{/* Cierra bloque de componente Pressable */}
          </View>{/* Cierra bloque de componente View */}

          <Text style={[styles.title, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            {recipe.title}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
          </Text>{/* Cierra bloque de componente Text */}

          <View style={styles.badgesRow}>{/* Abre caja contenedora de diseño (layout) */}
            <View // Inicia declaración de caja contenedora de diseño (layout)
              style={[ // Prop style: aplica estilos visuales al componente
                styles.metaBadgeTime, // Aplica estilo base "metaBadgeTime"
                isDark && styles.metaBadgeTimeDark, // Aplica estilo condicional "metaBadgeTimeDark" cuando se cumple isDark
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text // Inicia declaración de componente para renderizar texto en pantalla
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.metaBadgeTimeText, // Aplica estilo base "metaBadgeTimeText"
                  isDark && styles.metaBadgeTimeTextDark, // Aplica estilo condicional "metaBadgeTimeTextDark" cuando se cumple isDark
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                ⏱️ Tiempo: {recipe.prepareTime}{/* Texto o expresión visible dentro del componente ("⏱️ Tiempo: {recipe.prepareTime}") */}
              </Text>{/* Cierra bloque de componente Text */}
            </View>{/* Cierra bloque de componente View */}
            <View // Inicia declaración de caja contenedora de diseño (layout)
              style={[ // Prop style: aplica estilos visuales al componente
                styles.metaBadgeDifficulty, // Aplica estilo base "metaBadgeDifficulty"
                isDark && styles.metaBadgeDifficultyDark, // Aplica estilo condicional "metaBadgeDifficultyDark" cuando se cumple isDark
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text // Inicia declaración de componente para renderizar texto en pantalla
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.metaBadgeDifficultyText, // Aplica estilo base "metaBadgeDifficultyText"
                  isDark && styles.metaBadgeDifficultyTextDark, // Aplica estilo condicional "metaBadgeDifficultyTextDark" cuando se cumple isDark
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                📊 Dificultad: {recipe.difficulty}{/* Texto o expresión visible dentro del componente ("📊 Dificultad: {recipe.difficulty}") */}
              </Text>{/* Cierra bloque de componente Text */}
            </View>{/* Cierra bloque de componente View */}
            <View // Inicia declaración de caja contenedora de diseño (layout)
              style={[ // Prop style: aplica estilos visuales al componente
                styles.metaBadgeLikes, // Aplica estilo base "metaBadgeLikes"
                isDark && styles.metaBadgeLikesDark, // Aplica estilo condicional "metaBadgeLikesDark" cuando se cumple isDark
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text // Inicia declaración de componente para renderizar texto en pantalla
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.metaBadgeLikesText, // Aplica estilo base "metaBadgeLikesText"
                  isDark && styles.metaBadgeLikesTextDark, // Aplica estilo condicional "metaBadgeLikesTextDark" cuando se cumple isDark
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                👍 Aprobación: {recipe.likeRate}%{/* Texto o expresión visible dentro del componente ("👍 Aprobación: {recipe.likeRate}%") */}
              </Text>{/* Cierra bloque de componente Text */}
            </View>{/* Cierra bloque de componente View */}
          </View>{/* Cierra bloque de componente View */}

          <Text style={[styles.sectionHeader, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Descripción y preparación{/* Texto o expresión visible dentro del componente ("Descripción y preparación") */}
          </Text>{/* Cierra bloque de componente Text */}
          <Text style={[styles.description, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
            {recipe.description}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
          </Text>{/* Cierra bloque de componente Text */}

          <View style={styles.actions}>{/* Abre caja contenedora de diseño (layout) */}
            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleEdit} // Prop onPress: ejecuta acción al tocar el elemento
              style={[styles.button, styles.editButton]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={styles.buttonText}>Editar</Text>{/* Abre componente para renderizar texto en pantalla */}
            </Pressable>{/* Cierra bloque de componente Pressable */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleDelete} // Prop onPress: ejecuta acción al tocar el elemento
              style={[styles.button, styles.deleteButton]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={styles.buttonText}>Eliminar</Text>{/* Abre componente para renderizar texto en pantalla */}
            </Pressable>{/* Cierra bloque de componente Pressable */}
          </View>{/* Cierra bloque de componente View */}
        </View>{/* Cierra bloque de componente View */}
      </View>{/* Cierra bloque de componente View */}
    </ScrollView> // Cierra bloque de componente ScrollView
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función DetailScreen

const styles = StyleSheet.create({ // Inicia definición optimizada de estilos visuales con StyleSheet.create
  screen: { // Define grupo de estilos para "screen"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    backgroundColor: '#FAF7F5', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  screenDark: { // Define grupo de estilos para "screenDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  container: { // Define grupo de estilos para "container"
    padding: 16, // Estilo padding: espaciado interno en los cuatro lados
    maxWidth: 1024, // Estilo maxWidth: ancho máximo permitido
    width: '100%', // Estilo width: ancho fijo o porcentual
    alignSelf: 'center', // Estilo alignSelf: anula alineación propia dentro del padre
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
  loadingText: { // Define grupo de estilos para "loadingText"
    marginTop: 12, // Estilo marginTop: margen externo superior
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#333333', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  emptyText: { // Define grupo de estilos para "emptyText"
    fontSize: 18, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#333333', // Estilo color: color de texto o icono
    marginBottom: 16, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  textDark: { // Define grupo de estilos para "textDark"
    color: '#F7F2F0', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  subTextDark: { // Define grupo de estilos para "subTextDark"
    color: '#B8A9A4', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  detailCard: { // Define grupo de estilos para "detailCard"
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
    borderRadius: 14, // Estilo borderRadius: redondeo de esquinas
    overflow: 'hidden', // Estilo overflow: comportamiento si el contenido desborda
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#EAE2DF', // Estilo borderColor: color del borde
    ...Platform.select({ // Selecciona valores específicos según la plataforma (Web/iOS/Android)
      web: { // Define grupo de estilos para "web"
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Define propiedad "boxShadow" en el objeto actual
      }, // Cierra objeto literal
      default: { // Define grupo de estilos para "default"
        shadowColor: '#4f2c21', // Estilo shadowColor: color de sombra en iOS/web
        shadowOffset: { width: 0, height: 2 }, // Estilo shadowOffset: desplazamiento X/Y de la sombra
        shadowOpacity: 0.15, // Estilo shadowOpacity: intensidad de la sombra
        shadowRadius: 4, // Estilo shadowRadius: difuminado de la sombra
        elevation: 3, // Estilo elevation: elevación y sombra en Android
      }, // Cierra objeto literal
    }), // Cierra objeto de "detailCard"
  }, // Cierra objeto literal
  detailCardDark: { // Define grupo de estilos para "detailCardDark"
    backgroundColor: '#241D1B', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  detailCardWide: { // Define grupo de estilos para "detailCardWide"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    alignItems: 'stretch', // Estilo alignItems: alinea hijos en el eje cruzado
  }, // Cierra objeto literal
  heroImage: { // Define grupo de estilos para "heroImage"
    width: '100%', // Estilo width: ancho fijo o porcentual
    height: 250, // Estilo height: alto fijo o porcentual
    resizeMode: 'cover', // Define propiedad "resizeMode" en el objeto actual
    backgroundColor: '#E5DDD9', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  heroImageDark: { // Define grupo de estilos para "heroImageDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  heroImageWide: { // Define grupo de estilos para "heroImageWide"
    width: '44%', // Estilo width: ancho fijo o porcentual
    height: 'auto', // Estilo height: alto fijo o porcentual
    minHeight: 320, // Estilo minHeight: altura mínima garantizada
  }, // Cierra objeto literal
  bodyContent: { // Define grupo de estilos para "bodyContent"
    padding: 20, // Estilo padding: espaciado interno en los cuatro lados
  }, // Cierra objeto literal
  bodyContentWide: { // Define grupo de estilos para "bodyContentWide"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
  }, // Cierra objeto literal
  topRow: { // Define grupo de estilos para "topRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    justifyContent: 'space-between', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    flexWrap: 'wrap', // Estilo flexWrap: permite saltar a nueva línea si no cabe
    gap: 8, // Estilo gap: espacio uniforme entre elementos hijos
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  categoryBadge: { // Define grupo de estilos para "categoryBadge"
    backgroundColor: '#753333', // Estilo backgroundColor: color de fondo
    paddingHorizontal: 12, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 6, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 16, // Estilo borderRadius: redondeo de esquinas
  }, // Cierra objeto literal
  categoryBadgeDark: { // Define grupo de estilos para "categoryBadgeDark"
    backgroundColor: '#E74C3C', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  categoryText: { // Define grupo de estilos para "categoryText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  favoriteButton: { // Define grupo de estilos para "favoriteButton"
    paddingHorizontal: 14, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 8, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 20, // Estilo borderRadius: redondeo de esquinas
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#C0392B', // Estilo borderColor: color del borde
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  favoriteButtonDark: { // Define grupo de estilos para "favoriteButtonDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
    borderColor: '#E74C3C', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  favoriteButtonActive: { // Define grupo de estilos para "favoriteButtonActive"
    backgroundColor: '#FDEDEC', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  favoriteButtonActiveDark: { // Define grupo de estilos para "favoriteButtonActiveDark"
    backgroundColor: '#3A1F1E', // Estilo backgroundColor: color de fondo
    borderColor: '#E74C3C', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  favoriteButtonText: { // Define grupo de estilos para "favoriteButtonText"
    color: '#C0392B', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  favoriteButtonTextDark: { // Define grupo de estilos para "favoriteButtonTextDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  favoriteButtonTextActive: { // Define grupo de estilos para "favoriteButtonTextActive"
    color: '#C0392B', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  favoriteButtonTextActiveDark: { // Define grupo de estilos para "favoriteButtonTextActiveDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  title: { // Define grupo de estilos para "title"
    fontSize: 24, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  badgesRow: { // Define grupo de estilos para "badgesRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    flexWrap: 'wrap', // Estilo flexWrap: permite saltar a nueva línea si no cabe
    gap: 8, // Estilo gap: espacio uniforme entre elementos hijos
    marginBottom: 20, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  metaBadgeTime: { // Define grupo de estilos para "metaBadgeTime"
    backgroundColor: '#FEF5E7', // Estilo backgroundColor: color de fondo
    paddingHorizontal: 12, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 6, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 10, // Estilo borderRadius: redondeo de esquinas
  }, // Cierra objeto literal
  metaBadgeTimeDark: { // Define grupo de estilos para "metaBadgeTimeDark"
    backgroundColor: '#33261A', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  metaBadgeTimeText: { // Define grupo de estilos para "metaBadgeTimeText"
    color: '#B9770E', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  metaBadgeTimeTextDark: { // Define grupo de estilos para "metaBadgeTimeTextDark"
    color: '#F5B041', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  metaBadgeDifficulty: { // Define grupo de estilos para "metaBadgeDifficulty"
    backgroundColor: '#F3ECE9', // Estilo backgroundColor: color de fondo
    paddingHorizontal: 12, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 6, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 10, // Estilo borderRadius: redondeo de esquinas
  }, // Cierra objeto literal
  metaBadgeDifficultyDark: { // Define grupo de estilos para "metaBadgeDifficultyDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  metaBadgeDifficultyText: { // Define grupo de estilos para "metaBadgeDifficultyText"
    color: '#4A3833', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  metaBadgeDifficultyTextDark: { // Define grupo de estilos para "metaBadgeDifficultyTextDark"
    color: '#F7F2F0', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  metaBadgeLikes: { // Define grupo de estilos para "metaBadgeLikes"
    backgroundColor: '#E8F8F0', // Estilo backgroundColor: color de fondo
    paddingHorizontal: 12, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 6, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 10, // Estilo borderRadius: redondeo de esquinas
  }, // Cierra objeto literal
  metaBadgeLikesDark: { // Define grupo de estilos para "metaBadgeLikesDark"
    backgroundColor: '#1B3124', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  metaBadgeLikesText: { // Define grupo de estilos para "metaBadgeLikesText"
    color: '#27AE60', // Estilo color: color de texto o icono
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  metaBadgeLikesTextDark: { // Define grupo de estilos para "metaBadgeLikesTextDark"
    color: '#58D68D', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  sectionHeader: { // Define grupo de estilos para "sectionHeader"
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
    marginBottom: 8, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  description: { // Define grupo de estilos para "description"
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    lineHeight: 24, // Estilo lineHeight: altura de línea para legibilidad
    color: '#555555', // Estilo color: color de texto o icono
    marginBottom: 24, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  actions: { // Define grupo de estilos para "actions"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    gap: 12, // Estilo gap: espacio uniforme entre elementos hijos
    marginTop: 8, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  button: { // Define grupo de estilos para "button"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
  }, // Cierra objeto literal
  editButton: { // Define grupo de estilos para "editButton"
    backgroundColor: '#27AE60', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  deleteButton: { // Define grupo de estilos para "deleteButton"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  buttonText: { // Define grupo de estilos para "buttonText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
}); // Cierra bloque o expresión anterior
