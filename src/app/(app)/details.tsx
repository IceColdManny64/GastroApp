import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'; // Hooks para refrescar receta al volver de Editar, leer params e ir atrás
import { useCallback, useMemo, useState } from 'react'; // Hooks para memoizar JSON inicial, callback en foco y estado de receta/favorito
import { // Componentes visuales nativos para la ficha completa de receta
  ActivityIndicator, // Spinner mientras carga el detalle si se abrió por URL sin item serializado
  Image, // Fotografía hero del platillo con fallback onError
  Platform, // Ajusta boxShadow en Web vs shadow* en móvil para la tarjeta de detalle
  Pressable, // Botones de Favorito, Editar, Eliminar y Volver al catálogo
  ScrollView, // Permite leer descripciones largas desplazando verticalmente
  StyleSheet, // Compila estilos claros/oscuros y diseño vertical vs lateral (wide)
  Text, // Textos de título, insignias y descripción
  View, // Contenedores de tarjeta, fila de insignias y botones CRUD
  useWindowDimensions, // Detecta ancho/orientación para pasar a layout horizontal de 2 columnas
} from 'react-native'; // Fin de importaciones desde react-native
import { // Constante fallback y operaciones de lectura/borrado del servicio de recetas
  DEFAULT_RECIPE_IMAGE, // URL de imagen culinaria usada si la foto de la receta falla al cargar
  deleteRecipe, // Envía DELETE /api/recipes/:id (o borra en caché offline) y limpia favoritos
  getRecipe, // Consulta GET /api/recipes/:id para traer la receta recién editada desde disco
} from '@/services/recipes'; // Fin de importaciones de services/recipes
import { RecipeItem } from '@/types/RecipeItem'; // Tipado estricto del objeto receta normalizado
import { confirmAction, showAlert } from '@/utils/alerts'; // Diálogos multiplataforma (confirmación de borrado y avisos de error)
import { safeGoBack } from '@/utils/navigation'; // Regresa a la pantalla previa o cae a /home si recargaron la página directo
import { // Funciones de favoritos, ajustes de tema y hook reactivo global
  getFavorites, // Lee lista de IDs favoritos para saber si esta receta tiene ♥ activo
  getUserSettings, // Consulta preferencias para sincronizar tema oscuro
  toggleFavorite, // Alterna el ID actual en favoritos al pulsar el botón ♥
  useThemeMode, // Suscribe la vista en vivo al tema claro u oscuro
} from '@/utils/preferencesStorage'; // Fin de importaciones de preferencesStorage

export default function DetailScreen() { // Pantalla protegida de detalle de una receta en /(app)/details
  const { id, item: itemString } = useLocalSearchParams<{ // Extrae parámetros de ruta enviados desde Home o Favoritos
    id?: string; // ID numérico de la receta recibido como string en la URL
    item?: string; // JSON serializado opcional para hidratar la vista al instante sin espera
  }>(); // Fin de useLocalSearchParams

  const initialItem: RecipeItem | null = useMemo(() => { // Reconstruye el objeto RecipeItem inicial una sola vez si venía en itemString
    if (!itemString) return null; // Si se abrió directo por URL (/details?id=1) inicia en null y espera a getRecipe
    try { // Protege contra JSON truncado o malformado en la URL
      return JSON.parse(itemString) as RecipeItem; // Convierte el texto JSON recibido en objeto tipado
    } catch { // Si el parámetro no es JSON válido
      return null; // Descarta el payload roto y deja que useFocusEffect lo cargue desde getRecipe
    } // Fin try/catch de parseo inicial
  }, [itemString]); // Solo recalcula si cambia el parámetro serializado

  const [recipe, setRecipe] = useState<RecipeItem | null>(initialItem); // Estado con los datos completos de la receta mostrada
  const router = useRouter(); // Router para abrir /form al editar o volver al catálogo
  const isDarkTheme = useThemeMode(); // Bandera global reactiva de Modo Oscuro
  const { width, height } = useWindowDimensions(); // Dimensiones actuales de pantalla para activar vista lado a lado
  const isWideLayout = width >= 660 || (width > height && width >= 560); // Coloca foto a la izquierda y texto a la derecha en pantallas anchas

  const [loading, setLoading] = useState<boolean>(!initialItem); // Solo muestra spinner inicial si no hubo hidratación instantánea
  const [isFavorite, setIsFavorite] = useState(false); // Indica si esta receta está guardada en favoritos del usuario
  const [darkMode, setDarkMode] = useState(isDarkTheme); // Estado local sincronizado con settings.themeMode
  const [imageUri, setImageUri] = useState<string>( // URI mostrada en la imagen hero; permite cambiar al fallback si falla
    initialItem?.image || DEFAULT_RECIPE_IMAGE // Usa imagen inicial o placeholder si venía vacía (ej. data: omitida en URL)
  ); // Fin de estado imageUri

  const isDark = isDarkTheme || darkMode; // Verdadero si el modo oscuro está activo globalmente o en ajustes

  useFocusEffect( // Recarga la ficha fresca desde server.js/caché cada vez que esta pantalla entra o recupera foco
    useCallback(() => { // Memoriza la suscripción para correr al volver de /form tras editar la receta
      let isActive = true; // Bandera de limpieza para no actualizar estado si el usuario salió antes de que responda

      (async () => { // Consulta receta actualizada, favoritos y tema en paralelo
        try { // Inicia carga fresca por ID
          const numericId = Number(id ?? initialItem?.id); // Prioriza el param id de la ruta o cae al id del item inicial
          if (!numericId) return; // Aborta si no existe un identificador válido

          const [fresh, favs, settings] = await Promise.all([ // Pide en paralelo receta fresca, favoritos y preferencias
            getRecipe(numericId), // Lee el registro actual (trae títulos editados y fotos Base64 completas)
            getFavorites(), // Comprueba si el ID sigue marcado como favorito
            getUserSettings(), // Lee tema configurado
          ]); // Fin Promise.all

          if (isActive) { // Solo actualiza la interfaz si la pantalla sigue montada y enfocada
            setRecipe(fresh); // Reemplaza con los datos frescos recién editados o consultados
            setImageUri(fresh.image || DEFAULT_RECIPE_IMAGE); // Restaura la URI real completa o imagen por defecto
            setIsFavorite(favs.includes(fresh.id)); // Marca estado visual del botón ♥
            setDarkMode(settings.themeMode === 'dark'); // Sincroniza preferencia nocturna
          } // Fin guardia isActive
        } catch (err) { // Captura 404 (si fue eliminada) u otro fallo al cargar
          console.error('[details.tsx] Error al cargar detalle:', err); // Registra traza técnica en consola
          if (isActive) { // Si la vista sigue activa
            setRecipe(null); // Muestra pantalla "No se encontró la receta" en vez de datos obsoletos
          } // Fin limpieza de receta
          if (!initialItem) { // Solo lanza alerta emergente si no había contenido previo
            showAlert('Error', 'No se pudo cargar la receta.'); // Avisa del fallo de carga
          } // Fin verificación initialItem
        } finally { // Siempre apaga spinner al concluir
          if (isActive) setLoading(false); // Evita warning de actualización sobre componente desmontado
        } // Fin try/catch/finally
      })(); // Ejecuta carga asíncrona en foco

      return () => { // Función cleanup ejecutada al desenfocar o desmontar DetailScreen
        isActive = false; // Cancela cualquier setState pendiente si el usuario retrocedió rápido
      }; // Fin cleanup
    }, [id, initialItem]) // Se re-ejecuta si cambia el ID recibido por ruta
  ); // Fin useFocusEffect

  const handleToggleFavorite = async () => { // Alterna el estado de favorito del platillo actual
    if (!recipe) return; // Guardia por seguridad si no hay receta cargada
    const updated = await toggleFavorite(recipe.id); // Guarda cambio en almacenamiento local del usuario
    setIsFavorite(updated.includes(recipe.id)); // Refleja al instante el cambio de ♥ / ♡ en el botón
  }; // Fin handleToggleFavorite

  const handleEdit = () => { // Abre el formulario /(app)/form precargado para editar esta receta
    if (!recipe) return; // Guardia si no existe receta activa
    const safeRecipePayload = // Evita enviar data: URI gigante dentro de query params de Expo Router
      recipe.image && recipe.image.startsWith('data:') // Detecta imagen Base64 pesada
        ? { ...recipe, image: '', imageURL: '' } // Limpia Base64 en URL; form.tsx recargará la imagen con getRecipe(id)
        : recipe; // Si es URL normal HTTP, la envía completa
    router.push({ // Navega al formulario enviando id y datos serializados
      pathname: '/form', // Pantalla compartida de creación y edición
      params: { // Parámetros recibidos por useLocalSearchParams en form.tsx
        id: String(recipe.id), // Indica a form.tsx que está en modo Edición
        recipe: JSON.stringify(safeRecipePayload), // Datos iniciales para rellenar los inputs sin parpadeo
      }, // Fin params
    }); // Fin router.push
  }; // Fin handleEdit

  const executeDeletion = async () => { // Ejecuta el borrado definitivo una vez confirmado por el usuario
    if (!recipe) return; // Guardia de seguridad
    try { // Llama al servicio para borrar de recipes.json (o caché) y limpiar favoritos
      await deleteRecipe(recipe.id); // Envía DELETE /api/recipes/:id y remueve su ID de favoritos
      safeGoBack(router, '/home'); // Vuelve atrás al catálogo o redirige seguro a /home
    } catch (err) { // Si falla el borrado (por ejemplo 404 o error de disco)
      showAlert( // Muestra el error al usuario sin cerrar la pantalla
        'Error', // Título del diálogo
        err instanceof Error ? err.message : 'No se pudo eliminar la receta.' // Mensaje descriptivo del error
      ); // Fin showAlert
    } // Fin try/catch de eliminación
  }; // Fin executeDeletion

  const handleDelete = () => { // Pide confirmación explícita antes de borrar la receta
    if (!recipe) return; // Guardia por si recipe es null
    confirmAction( // Usa window.confirm en Web o Alert.alert destructivo en iOS/Android
      'Confirmar', // Título en móvil
      '¿Seguro que quieres eliminar esta receta?', // Pregunta de confirmación
      executeDeletion // Callback que corre únicamente si el usuario confirma
    ); // Fin confirmAction
  }; // Fin handleDelete

  if (loading) { // Muestra pantalla de espera cuando se abrió por enlace directo sin initialItem
    return ( // Vista centrada con spinner
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo crema o café oscuro */}
        <ActivityIndicator // Rueda giratoria nativa
          size="large" // Tamaño grande
          color={isDark ? '#E74C3C' : '#333333'} // Coral en oscuro o gris en claro
        />{/* Termina indicador de carga */}
        <Text style={[styles.loadingText, isDark && styles.textDark]}>{/* Texto de espera */}
          Cargando detalle de la receta...{/* Mensaje visible mientras responde getRecipe */}
        </Text>{/* Termina texto de espera */}
      </View> // Fin vista de carga
    ); // Fin retorno temprano loading
  } // Fin guardia loading

  if (!recipe) { // Muestra estado vacío si la receta no existe o fue eliminada
    return ( // Vista centrada con botón para regresar al catálogo
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo adaptado al tema */}
        <Text style={[styles.emptyText, isDark && styles.textDark]}>{/* Mensaje de receta no hallada */}
          No se encontró la receta{/* Aviso en español latino */}
        </Text>{/* Termina mensaje vacío */}
        <Pressable // Botón seguro para volver al catálogo
          onPress={() => safeGoBack(router, '/home')} // Retrocede si hay historial o reemplaza con /home
          style={[styles.button, styles.editButton]} // Estilo verde llamativo
        >{/* Etiqueta del botón de retorno */}
          <Text style={styles.buttonText}>Volver al catálogo</Text>{/* Texto blanco */}
        </Pressable>{/* Termina botón Volver al catálogo */}
      </View> // Fin vista no encontrado
    ); // Fin retorno temprano !recipe
  } // Fin guardia !recipe

  return ( // Vista completa de detalle adaptable a vertical u horizontal ancho
    <ScrollView // Permite scroll vertical si la descripción o la pantalla son altas/bajas
      style={[styles.screen, isDark && styles.screenDark]} // Fondo general claro u oscuro
      contentContainerStyle={styles.container} // Centra el card hasta un ancho máximo de 1024px
    >{/* Tarjeta principal con fotografía hero y contenido informativo */}
      <View // Contenedor principal del detalle de la receta
        style={[ // Alterna entre layout apilado (móvil vertical) y fila de 2 columnas (tablet/escritorio)
          styles.detailCard, // Superficie blanca con bordes redondeados y sombra
          isDark && styles.detailCardDark, // Superficie café oscuro
          isWideLayout && styles.detailCardWide, // Pone heroImage a la izquierda (44%) y bodyContent a la derecha
        ]} // Fin estilos detailCard
      >{/* Fotografía superior o lateral izquierda */}
        <Image // Fotografía principal de la receta
          source={{ uri: imageUri }} // Usa URI activa o fallback si falló la descarga
          style={[ // Ajusta ancho/alto según orientación
            styles.heroImage, // En vertical: ancho 100% y alto 250px
            isDark && styles.heroImageDark, // Fondo placeholder oscuro mientras descarga
            isWideLayout && styles.heroImageWide, // En horizontal ancho: ocupa 44% izquierdo y minHeight 320px
          ]} // Fin estilos heroImage
          onError={() => setImageUri(DEFAULT_RECIPE_IMAGE)} // Sustituye automáticamente URLs rotas por imagen gastronómica de respaldo
        />{/* Termina fotografía hero */}

        <View // Columna o bloque inferior con categoría, favorito, título, metadatos, descripción y acciones CRUD
          style={[styles.bodyContent, isWideLayout && styles.bodyContentWide]} // En layout ancho toma flex: 1 restante
        >{/* Fila superior: insignia de categoría a la izquierda y botón de favorito a la derecha */}
          <View style={styles.topRow}>{/* Fila flexible con separación entre extremos */}
            <View // Píldora de categoría gastronómica
              style={[ // Vino corporativo en claro o terracota brillante en oscuro
                styles.categoryBadge, // Píldora base vino #753333
                isDark && styles.categoryBadgeDark, // Terracota #E74C3C en modo oscuro
              ]} // Fin estilo categoryBadge
            >{/* Nombre de la categoría */}
              <Text style={styles.categoryText}>{recipe.category}</Text>{/* Ej. "Mexicanas", "Italianas", "Postres" */}
            </View>{/* Termina badge de categoría */}

            <Pressable // Botón interactivo para guardar o quitar esta receta de favoritos
              onPress={handleToggleFavorite} // Alterna favorito en almacenamiento local
              style={[ // Cambia borde/fondo cuando ya está guardada en favoritos
                styles.favoriteButton, // Contorno rojo sobre fondo blanco
                isDark && styles.favoriteButtonDark, // Contorno coral sobre fondo oscuro
                isFavorite && // Resalta relleno rosado o vino oscuro si ya es favorita
                  (isDark // Elige variante oscura o clara del estado activo
                    ? styles.favoriteButtonActiveDark // Vino oscuro cuando está marcada
                    : styles.favoriteButtonActive), // Rosado suave cuando está marcada
              ]} // Fin estilos favoriteButton
            >{/* Texto con corazón relleno o hueco */}
              <Text // Etiqueta dinámica del botón de favorito
                style={[ // Color rojo/coral adaptado al estado y tema
                  styles.favoriteButtonText, // Rojo terracota en claro
                  isDark && styles.favoriteButtonTextDark, // Coral claro en oscuro
                  isFavorite && // Mantiene contraste activo
                    (isDark // Variante oscura o clara activa
                      ? styles.favoriteButtonTextActiveDark // Coral brillante
                      : styles.favoriteButtonTextActive), // Terracota intenso
                ]} // Fin estilos texto favorito
              >{/* Texto descriptivo según isFavorite */}
                {isFavorite ? '♥ En tus favoritos' : '♡ Agregar a favoritos'}{/* Muestra estado actual del favorito */}
              </Text>{/* Termina etiqueta de favorito */}
            </Pressable>{/* Termina botón de favorito */}
          </View>{/* Termina fila superior topRow */}

          <Text style={[styles.title, isDark && styles.textDark]}>{/* Nombre completo de la receta */}
            {recipe.title}{/* Título del platillo */}
          </Text>{/* Termina título */}

          <View style={styles.badgesRow}>{/* Fila de 3 píldoras informativas: tiempo, dificultad y aprobación */}
            <View // Píldora de tiempo de preparación
              style={[ // Fondo ámbar cálido en claro o café dorado en oscuro
                styles.metaBadgeTime, // Píldora amarilla suave
                isDark && styles.metaBadgeTimeDark, // Variante oscura
              ]} // Fin metaBadgeTime
            >{/* Texto de tiempo */}
              <Text // Etiqueta con reloj y duración HH:MM:SS
                style={[ // Color ámbar legible
                  styles.metaBadgeTimeText, // Ámbar oscuro en claro
                  isDark && styles.metaBadgeTimeTextDark, // Dorado claro en oscuro
                ]} // Fin metaBadgeTimeText
              >{/* Duración exacta de preparación */}
                ⏱️ Tiempo: {recipe.prepareTime}{/* Muestra HH:MM:SS */}
              </Text>{/* Termina texto de tiempo */}
            </View>{/* Termina píldora de tiempo */}
            <View // Píldora de nivel de dificultad
              style={[ // Fondo crema o negro carbón con borde en oscuro
                styles.metaBadgeDifficulty, // Píldora neutra
                isDark && styles.metaBadgeDifficultyDark, // Variante oscura con borde
              ]} // Fin metaBadgeDifficulty
            >{/* Texto de dificultad */}
              <Text // Etiqueta de dificultad del platillo
                style={[ // Color café en claro o blanco cálido en oscuro
                  styles.metaBadgeDifficultyText, // Café oscuro
                  isDark && styles.metaBadgeDifficultyTextDark, // Blanco cálido
                ]} // Fin metaBadgeDifficultyText
              >{/* Nivel de dificultad */}
                📊 Dificultad: {recipe.difficulty}{/* Muy facil, Facil, Medio o Dificil */}
              </Text>{/* Termina texto de dificultad */}
            </View>{/* Termina píldora de dificultad */}
            <View // Píldora de porcentaje de aprobación
              style={[ // Fondo verde menta suave o verde bosque oscuro
                styles.metaBadgeLikes, // Verde claro
                isDark && styles.metaBadgeLikesDark, // Verde oscuro
              ]} // Fin metaBadgeLikes
            >{/* Texto de aprobación */}
              <Text // Porcentaje numérico entre 0 y 100
                style={[ // Verde esmeralda legible
                  styles.metaBadgeLikesText, // Verde en claro
                  isDark && styles.metaBadgeLikesTextDark, // Verde menta brillante en oscuro
                ]} // Fin metaBadgeLikesText
              >{/* Muestra likeRate con % */}
                👍 Aprobación: {recipe.likeRate}%{/* Porcentaje entero */}
              </Text>{/* Termina texto de aprobación */}
            </View>{/* Termina píldora de aprobación */}
          </View>{/* Termina fila badgesRow */}

          <Text style={[styles.sectionHeader, isDark && styles.textDark]}>{/* Subtítulo de sección de descripción */}
            Descripción y preparación{/* Encabezado sobre el texto descriptivo */}
          </Text>{/* Termina encabezado de sección */}
          <Text style={[styles.description, isDark && styles.subTextDark]}>{/* Texto completo de la receta sin truncar */}
            {recipe.description}{/* Ingredientes, resumen o pasos guardados */}
          </Text>{/* Termina descripción */}

          <View style={styles.actions}>{/* Fila inferior con los botones CRUD Editar y Eliminar */}
            <Pressable // Botón verde para abrir el formulario en modo edición
              onPress={handleEdit} // Navega a /form pasando el ID y payload seguro
              style={[styles.button, styles.editButton]} // Mitad del ancho en verde albahaca #27AE60
            >{/* Etiqueta Editar */}
              <Text style={styles.buttonText}>Editar</Text>{/* Texto blanco */}
            </Pressable>{/* Termina botón Editar */}

            <Pressable // Botón rojo para eliminar la receta previa confirmación
              onPress={handleDelete} // Abre confirmAction() y si confirma llama a deleteRecipe()
              style={[styles.button, styles.deleteButton]} // Mitad del ancho en rojo terracota #C0392B
            >{/* Etiqueta Eliminar */}
              <Text style={styles.buttonText}>Eliminar</Text>{/* Texto blanco */}
            </Pressable>{/* Termina botón Eliminar */}
          </View>{/* Termina fila de acciones */}
        </View>{/* Termina bodyContent */}
      </View>{/* Termina detailCard */}
    </ScrollView> // Fin ScrollView de DetailScreen
  ); // Fin del árbol JSX principal
} // Fin de componente DetailScreen

const styles = StyleSheet.create({ // Hoja de estilos de DetailScreen
  screen: { // Fondo exterior del ScrollView en claro
    flex: 1, // Ocupa todo el alto disponible
    backgroundColor: '#FAF7F5', // Crema cálido
  }, // Fin screen
  screenDark: { // Fondo exterior en modo oscuro
    backgroundColor: '#181312', // Café oscuro
  }, // Fin screenDark
  container: { // Contenedor interno centrado del ScrollView
    padding: 16, // Espacio alrededor de la tarjeta
    maxWidth: 1024, // Limita el ancho máximo en escritorio para lectura cómoda
    width: '100%', // Ocupa 100% en móviles
    alignSelf: 'center', // Centra horizontalmente
  }, // Fin container
  centered: { // Contenedor centrado para estados cargando / no encontrado
    flex: 1, // Ocupa pantalla completa
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    padding: 24, // Aire alrededor
    backgroundColor: '#FAF7F5', // Crema claro
  }, // Fin centered
  centeredDark: { // Contenedor centrado en oscuro
    backgroundColor: '#181312', // Café oscuro
  }, // Fin centeredDark
  loadingText: { // Texto debajo del spinner inicial
    marginTop: 12, // Separación con el ActivityIndicator
    fontSize: 16, // Tamaño legible
    color: '#333333', // Gris oscuro
  }, // Fin loadingText
  emptyText: { // Mensaje cuando no se encuentra la receta
    fontSize: 18, // Tamaño destacado
    fontWeight: 'bold', // Negrita
    color: '#333333', // Gris oscuro
    marginBottom: 16, // Espacio antes del botón Volver
  }, // Fin emptyText
  textDark: { // Color de textos principales en modo oscuro
    color: '#F7F2F0', // Blanco cálido
  }, // Fin textDark
  subTextDark: { // Color de texto descriptivo en modo oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin subTextDark
  detailCard: { // Tarjeta contenedora del detalle en modo claro
    backgroundColor: '#FFFFFF', // Superficie blanca
    borderRadius: 14, // Esquinas redondeadas
    overflow: 'hidden', // Recorta la fotografía superior siguiendo el borderRadius del card
    borderWidth: 1, // Borde 1px
    borderColor: '#EAE2DF', // Borde arena cálido
    ...Platform.select({ // Sombra compatible entre navegador y móvil
      web: { // Regla CSS estándar en Web
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Sombra suave sin warnings
      }, // Fin sombra web
      default: { // Sombra nativa en iOS/Android
        shadowColor: '#4f2c21', // Color sombra café
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento Y 2px
        shadowOpacity: 0.15, // Opacidad suave iOS
        shadowRadius: 4, // Difuminado
        elevation: 3, // Elevación Android
      }, // Fin sombra nativa
    }), // Fin Platform.select
  }, // Fin detailCard
  detailCardDark: { // Tarjeta de detalle en modo oscuro
    backgroundColor: '#241D1B', // Café oscuro de superficie
    borderColor: '#382E2B', // Borde espresso
  }, // Fin detailCardDark
  detailCardWide: { // Convierte la tarjeta en 2 columnas (foto izquierda / texto derecha)
    flexDirection: 'row', // Coloca imagen y contenido lado a lado
    alignItems: 'stretch', // Estira ambos bloques al mismo alto
  }, // Fin detailCardWide
  heroImage: { // Fotografía superior en pantallas verticales
    width: '100%', // Ancho total de tarjeta
    height: 250, // Alto fijo de 250px en vertical
    resizeMode: 'cover', // Llena el espacio sin deformar proporciones
    backgroundColor: '#E5DDD9', // Color placeholder claro mientras carga
  }, // Fin heroImage
  heroImageDark: { // Color placeholder de la imagen en modo oscuro
    backgroundColor: '#181312', // Café oscuro
  }, // Fin heroImageDark
  heroImageWide: { // Ajuste de imagen cuando isWideLayout está activo
    width: '44%', // Ocupa el 44% izquierdo de la tarjeta
    height: 'auto', // Crece automáticamente según el alto del contenido derecho
    minHeight: 320, // Garantiza presencia visual mínima aunque la descripción sea corta
  }, // Fin heroImageWide
  bodyContent: { // Bloque textual y de acciones debajo o a la derecha de la foto
    padding: 20, // Relleno interior generoso
  }, // Fin bodyContent
  bodyContentWide: { // En diseño horizontal toma todo el ancho restante
    flex: 1, // Ocupa el 56% derecho junto a heroImageWide
  }, // Fin bodyContentWide
  topRow: { // Fila superior de categoría + botón favorito
    flexDirection: 'row', // Elementos lado a lado
    justifyContent: 'space-between', // Empuja categoría a la izquierda y favorito a la derecha
    alignItems: 'center', // Alinea verticalmente al centro
    flexWrap: 'wrap', // Permite saltar a otra línea en pantallas muy estrechas
    gap: 8, // Separación mínima si hacen wrap
    marginBottom: 12, // Espacio antes del título de la receta
  }, // Fin topRow
  categoryBadge: { // Píldora de categoría en claro
    backgroundColor: '#753333', // Vino corporativo
    paddingHorizontal: 12, // Relleno lateral
    paddingVertical: 6, // Relleno vertical
    borderRadius: 16, // Forma de píldora
  }, // Fin categoryBadge
  categoryBadgeDark: { // Píldora de categoría en oscuro
    backgroundColor: '#E74C3C', // Rojo terracota luminoso
  }, // Fin categoryBadgeDark
  categoryText: { // Texto dentro de la píldora de categoría
    color: '#FFFFFF', // Blanco legible
    fontWeight: '700', // Negrita
    fontSize: 13, // Tamaño compacto
  }, // Fin categoryText
  favoriteButton: { // Botón toggle de favorito sin marcar (modo claro)
    paddingHorizontal: 14, // Relleno lateral
    paddingVertical: 8, // Relleno vertical cómodo para tocar
    borderRadius: 20, // Borde muy redondeado
    borderWidth: 1, // Borde 1px
    borderColor: '#C0392B', // Contorno terracota
    backgroundColor: '#FFFFFF', // Fondo blanco neutro
  }, // Fin favoriteButton
  favoriteButtonDark: { // Botón toggle de favorito en modo oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderColor: '#E74C3C', // Borde rojo brillante
  }, // Fin favoriteButtonDark
  favoriteButtonActive: { // Botón cuando la receta ya es favorita (claro)
    backgroundColor: '#FDEDEC', // Relleno rosado suave
  }, // Fin favoriteButtonActive
  favoriteButtonActiveDark: { // Botón cuando la receta ya es favorita (oscuro)
    backgroundColor: '#3A1F1E', // Relleno vino oscuro
    borderColor: '#E74C3C', // Borde coral
  }, // Fin favoriteButtonActiveDark
  favoriteButtonText: { // Texto del botón favorito en claro
    color: '#C0392B', // Terracota
    fontWeight: '700', // Negrita
    fontSize: 13, // Tamaño legible
  }, // Fin favoriteButtonText
  favoriteButtonTextDark: { // Texto del botón favorito en oscuro
    color: '#EC7063', // Coral claro
  }, // Fin favoriteButtonTextDark
  favoriteButtonTextActive: { // Texto favorito activo en claro
    color: '#C0392B', // Terracota intenso
  }, // Fin favoriteButtonTextActive
  favoriteButtonTextActiveDark: { // Texto favorito activo en oscuro
    color: '#EC7063', // Coral brillante
  }, // Fin favoriteButtonTextActiveDark
  title: { // Título principal del platillo
    fontSize: 24, // Tamaño grande destacado
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café muy oscuro
    marginBottom: 12, // Separación con las píldoras de metadatos
  }, // Fin title
  badgesRow: { // Contenedor de tiempo, dificultad y likes
    flexDirection: 'row', // En fila horizontal
    flexWrap: 'wrap', // Salta de línea en pantallas pequeñas sin desbordar
    gap: 8, // Separación uniforme entre píldoras
    marginBottom: 20, // Espacio antes de "Descripción y preparación"
  }, // Fin badgesRow
  metaBadgeTime: { // Píldora de tiempo en claro
    backgroundColor: '#FEF5E7', // Crema amarillento
    paddingHorizontal: 12, // Aire lateral
    paddingVertical: 6, // Aire vertical
    borderRadius: 10, // Esquinas redondeadas
  }, // Fin metaBadgeTime
  metaBadgeTimeDark: { // Píldora de tiempo en oscuro
    backgroundColor: '#33261A', // Café dorado oscuro
  }, // Fin metaBadgeTimeDark
  metaBadgeTimeText: { // Texto de tiempo en claro
    color: '#B9770E', // Ámbar oscuro legible
    fontWeight: '700', // Negrita
    fontSize: 13, // Tamaño compacto
  }, // Fin metaBadgeTimeText
  metaBadgeTimeTextDark: { // Texto de tiempo en oscuro
    color: '#F5B041', // Dorado claro
  }, // Fin metaBadgeTimeTextDark
  metaBadgeDifficulty: { // Píldora de dificultad en claro
    backgroundColor: '#F3ECE9', // Crema arena
    paddingHorizontal: 12, // Aire lateral
    paddingVertical: 6, // Aire vertical
    borderRadius: 10, // Bordes redondeados
  }, // Fin metaBadgeDifficulty
  metaBadgeDifficultyDark: { // Píldora de dificultad en oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderWidth: 1, // Borde sutil para separarlo de detailCardDark
    borderColor: '#382E2B', // Borde espresso
  }, // Fin metaBadgeDifficultyDark
  metaBadgeDifficultyText: { // Texto de dificultad en claro
    color: '#4A3833', // Café medio
    fontWeight: '700', // Negrita
    fontSize: 13, // Tamaño compacto
  }, // Fin metaBadgeDifficultyText
  metaBadgeDifficultyTextDark: { // Texto de dificultad en oscuro
    color: '#F7F2F0', // Blanco cálido
  }, // Fin metaBadgeDifficultyTextDark
  metaBadgeLikes: { // Píldora de porcentaje de aprobación en claro
    backgroundColor: '#E8F8F0', // Verde menta muy claro
    paddingHorizontal: 12, // Aire lateral
    paddingVertical: 6, // Aire vertical
    borderRadius: 10, // Esquinas redondeadas
  }, // Fin metaBadgeLikes
  metaBadgeLikesDark: { // Píldora de aprobación en oscuro
    backgroundColor: '#1B3124', // Verde bosque oscuro
  }, // Fin metaBadgeLikesDark
  metaBadgeLikesText: { // Texto de aprobación en claro
    color: '#27AE60', // Verde albahaca
    fontWeight: '700', // Negrita
    fontSize: 13, // Tamaño compacto
  }, // Fin metaBadgeLikesText
  metaBadgeLikesTextDark: { // Texto de aprobación en oscuro
    color: '#58D68D', // Verde claro brillante
  }, // Fin metaBadgeLikesTextDark
  sectionHeader: { // Subtítulo "Descripción y preparación"
    fontSize: 16, // Tamaño medio destacado
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café oscuro
    marginBottom: 8, // Separación con el párrafo descriptivo
  }, // Fin sectionHeader
  description: { // Párrafo completo de descripción
    fontSize: 16, // Tamaño cómodo de lectura
    lineHeight: 24, // Interlineado amplio (1.5x)
    color: '#555555', // Gris medio legible
    marginBottom: 24, // Separación antes de los botones Editar/Eliminar
  }, // Fin description
  actions: { // Contenedor inferior de botones CRUD
    flexDirection: 'row', // Editar y Eliminar lado a lado
    gap: 12, // Separación de 12px entre ambos botones
    marginTop: 8, // Pequeño margen superior
  }, // Fin actions
  button: { // Estilo base compartido por los botones de acción
    flex: 1, // Ambos botones miden exactamente el mismo ancho (50% / 50%)
    paddingVertical: 14, // Altura táctil cómoda
    borderRadius: 8, // Esquinas redondeadas
    alignItems: 'center', // Centra texto horizontalmente
  }, // Fin button
  editButton: { // Color del botón Editar (y Volver al catálogo)
    backgroundColor: '#27AE60', // Verde albahaca
  }, // Fin editButton
  deleteButton: { // Color del botón Eliminar
    backgroundColor: '#C0392B', // Rojo terracota de acción destructiva
  }, // Fin deleteButton
  buttonText: { // Texto blanco dentro de los botones Editar/Eliminar
    color: '#FFFFFF', // Blanco puro
    fontWeight: '600', // Seminegrita
    fontSize: 16, // Tamaño estándar de botón
  }, // Fin buttonText
}); // Fin StyleSheet DetailScreen
