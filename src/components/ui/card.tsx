import { useState, useEffect } from 'react'; // Hooks React para estado local de imagen y sincronía con props
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native'; // Core Components de React Native
import { DEFAULT_RECIPE_IMAGE } from '../../services/recipes'; // URL segura usada si falla la imagen de la receta

export interface CardProps { // Contrato de propiedades que recibe cada tarjeta desde Home o Favoritos
  title: string; // Título del platillo
  image: string; // URL o Data URI de la fotografía
  description: string; // Resumen descriptivo mostrado en 1 o 2 líneas
  category: string; // Nombre de la categoría para la insignia superior izquierda
  difficulty: string; // Nivel de dificultad para elegir color semántico de píldora
  prepareTime: string; // Tiempo formateado HH:MM:SS
  likeRate: number; // Porcentaje numérico de aprobación
  isFavorite?: boolean; // Indica si el usuario marcó esta receta con ♥
  compact?: boolean; // Si es true reduce imagen y líneas para mostrar más tarjetas
  darkMode?: boolean; // Activa paleta de colores oscuros cuando está en true
  onToggleFavorite?: () => void; // Callback ejecutado al tocar el corazón ♥
  onPress?: () => void; // Callback ejecutado al tocar la tarjeta completa para ir a Detalle
} // Fin de interfaz CardProps

const getDifficultyColors = (difficulty: string, darkMode: boolean) => { // Devuelve colores de fondo y texto según dificultad y tema
  const normalized = difficulty.toLowerCase(); // Normaliza texto a minúsculas para comparar sin acentos/mayúsculas
  if (normalized.includes('dificil')) { // Dificultad alta -> tonos rojos
    return darkMode // Elige paleta oscura o clara
      ? { bg: '#3A1F1E', text: '#EC7063' } // Rojo suave en modo oscuro
      : { bg: '#FDEDEC', text: '#C0392B' }; // Rojo pastel en modo claro
  } // Fin rama difícil
  if (normalized.includes('medio')) { // Dificultad intermedia -> tonos ámbar
    return darkMode // Elige paleta oscura o clara
      ? { bg: '#33261A', text: '#F5B041' } // Ámbar oscuro
      : { bg: '#FEF5E7', text: '#B9770E' }; // Ámbar claro
  } // Fin rama medio
  return darkMode // Dificultad fácil o muy fácil -> tonos verdes albaca
    ? { bg: '#1B3124', text: '#58D68D' } // Verde oscuro
    : { bg: '#E8F8F0', text: '#1E8449' }; // Verde claro
}; // Fin de getDifficultyColors

const Card = ({ // Componente visual de tarjeta de receta desestructurando sus props
  title, // Título del platillo
  image, // URI de foto recibida
  description, // Texto descriptivo
  category, // Categoría culinaria
  difficulty, // Dificultad textual
  prepareTime, // Duración HH:MM:SS
  likeRate, // Porcentaje de likes
  isFavorite = false, // Valor por defecto false si no se envía
  compact = false, // Valor por defecto false si no es modo compacto
  darkMode = false, // Modo claro por defecto
  onToggleFavorite, // Handler opcional para favoritos
  onPress, // Handler opcional al abrir detalle
}: CardProps) => { // Tipado estricto CardProps
  const [imageSourceUri, setImageSourceUri] = useState(image || DEFAULT_RECIPE_IMAGE); // Estado local para permitir cambiar a fallback si falla descarga

  useEffect(() => { // Sincroniza estado interno cuando el padre actualiza la prop image tras una edición
    setImageSourceUri(image || DEFAULT_RECIPE_IMAGE); // Reemplaza fuente actual por la nueva URL o fallback
  }, [image]); // Se re-ejecuta únicamente si cambia prop image

  const diffColors = getDifficultyColors(difficulty, darkMode); // Calcula colores exactos de la píldora de dificultad

  return ( // Árbol JSX visual de la tarjeta
    <Pressable // Contenedor principal táctil de toda la tarjeta
      onPress={onPress} // Navega al detalle cuando el usuario toca la tarjeta
      style={({ pressed }) => [ // Aplica arreglo de estilos con retroalimentación visual al presionar
        styles.card, // Estilo base blanco con bordes redondeados y sombra
        darkMode && styles.cardDark, // Aplica fondo oscuro si darkMode es true
        pressed && styles.cardPressed, // Reduce opacidad y escala ligeramente mientras está presionada
      ]} // Fin función de estilo
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <View style={styles.imageWrapper}>{/* Contenedor relativo para superponer badges encima de la foto */}
        <Image // Fotografía superior de la receta
          source={{ uri: imageSourceUri }} // Fuente actual (URL original o imagen de respaldo)
          style={[ // Combinación condicional de estilos de imagen
            styles.image, // Tamaño normal 200px de altura
            compact && styles.imageCompact, // Reduce a 130px si compact es true
            darkMode && styles.imageDark, // Fondo placeholder oscuro mientras carga
          ]} // Fin estilos Image
          onError={() => setImageSourceUri(DEFAULT_RECIPE_IMAGE)} // Si la URL externa falla o está caída, sustituye automáticamente por imagen de respaldo
        />{/* Cierra etiqueta autocontenida de componente */}
        <View style={[styles.categoryBadge, darkMode && styles.categoryBadgeDark]}>{/* Insignia flotante superior izquierda de categoría */}
          <Text style={styles.categoryBadgeText}>{category}</Text>{/* Texto blanco con el nombre de la categoría */}
        </View>{/* Cierra bloque de componente View */}
        {onToggleFavorite && ( // Solo dibuja botón de corazón si el padre pasó onToggleFavorite
          <Pressable // Botón circular superior derecho para alternar favorito ♥
            onPress={(e) => { // Maneja toque directo en el corazón
              e.stopPropagation(); // Detiene la propagación para que tocar ♥ NO abra el detalle de la tarjeta padre
              onToggleFavorite(); // Dispara el cambio de favorito en el padre
            }} // Fin onPress
            style={[ // Estilos del botón de corazón según estado y tema
              styles.favoriteButton, // Estilo base claro circular
              darkMode && styles.favoriteButtonDark, // Fondo oscuro en tema nocturno
              isFavorite && // Cuando la receta ya es favorita resalta el botón en rojo
                (darkMode // Elige variante activa oscura o clara
                  ? styles.favoriteButtonActiveDark // Fondo rojo vino oscuro
                  : styles.favoriteButtonActive), // Fondo rosado claro
            ]} // Fin style botón favorito
            accessibilityLabel={ // Etiqueta descriptiva para lectores de pantalla
              isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos' // Cambia según estado actual
            } // Fin accessibilityLabel
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text // Ícono textual de corazón relleno o contorno
              style={[ // Colores del ícono según estado activo y tema
                styles.favoriteIcon, // Tamaño 18 gris base
                darkMode && styles.favoriteIconDark, // Gris cálido en tema oscuro
                isFavorite && // Resalta ícono en rojo cuando está marcado
                  (darkMode // Elige rojo claro en oscuro o intenso en claro
                    ? styles.favoriteIconActiveDark // Rojo claro
                    : styles.favoriteIconActive), // Terracota intenso
              ]} // Fin style ícono
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              {isFavorite ? '♥' : '♡'}{/* Corazón lleno si es favorito, hueco si no */}
            </Text>{/* Cierra bloque de componente Text */}
          </Pressable> // Fin botón favorito
        )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
      </View>{/* Fin contenedor imagen y badges */}

      <View style={styles.content}>{/* Cuerpo inferior de la tarjeta con padding */}
        <Text // Título principal del platillo
          style={[styles.title, darkMode && styles.titleDark]} // Tipografía en negrita adaptada al tema
          numberOfLines={1} // Trunca con "..." si supera 1 renglón
        >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
          {title}{/* Muestra nombre de la receta */}
        </Text>{/* Cierra bloque de componente Text */}
        <Text // Descripción breve de la receta
          style={[styles.description, darkMode && styles.descriptionDark]} // Color gris medio o claro según tema
          numberOfLines={compact ? 1 : 2} // Muestra 1 línea en modo compacto o 2 en normal
        >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
          {description}{/* Muestra resumen de preparación */}
        </Text>{/* Cierra bloque de componente Text */}

        <View style={styles.metaRow}>{/* Fila horizontal ajustable con 3 píldoras de metadatos */}
          <View style={[styles.timePill, darkMode && styles.timePillDark]}>{/* Píldora amarilla de tiempo de preparación */}
            <Text // Texto de tiempo
              style={[styles.timePillText, darkMode && styles.timePillTextDark]} // Color ámbar adaptado al tema
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              ⏱️ {prepareTime}{/* Ícono reloj + tiempo HH:MM:SS */}
            </Text>{/* Cierra bloque de componente Text */}
          </View>{/* Cierra bloque de componente View */}

          <View // Píldora semántica de dificultad
            style={[ // Aplica forma de píldora y color calculado arriba
              styles.difficultyPill, // Padding y esquinas redondeadas
              { backgroundColor: diffColors.bg }, // Fondo dinámico verde/ámbar/rojo
            ]} // Fin style difficultyPill
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text style={[styles.difficultyPillText, { color: diffColors.text }]}>{/* Texto con color contrastante dinámico */}
              {difficulty}{/* Muestra Muy facil, Facil, Medio o Dificil */}
            </Text>{/* Cierra bloque de componente Text */}
          </View>{/* Cierra bloque de componente View */}

          <View style={[styles.likePill, darkMode && styles.likePillDark]}>{/* Píldora verde de porcentaje de aprobación */}
            <Text // Texto del porcentaje
              style={[styles.likePillText, darkMode && styles.likePillTextDark]} // Color verde esmeralda
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              👍 {likeRate}% {/* Pulgar arriba + número de porcentaje */}
            </Text>{/* Cierra bloque de componente Text */}
          </View>{/* Cierra bloque de componente View */}
        </View>{/* Fin fila metadatos */}
      </View>{/* Fin contenido textual */}
    </Pressable> // Fin tarjeta completa
  ); // Fin return JSX
}; // Fin componente Card

export default Card; // Exporta Card como componente por defecto

const styles = StyleSheet.create({ // Hoja de estilos compilada de React Native para la tarjeta
  card: { // Estilo base de tarjeta blanca con sombra multiplataforma
    backgroundColor: '#FFFFFF', // Fondo blanco limpio en modo claro
    borderRadius: 12, // Esquinas redondeadas de 12px
    marginBottom: 16, // Separación vertical entre tarjetas
    overflow: 'hidden', // Recorta la imagen superior respetando bordes redondeados
    borderWidth: 1, // Borde fino perimetral
    borderColor: '#EFEBE9', // Gris cálido sutil
    ...Platform.select({ // Selecciona sombra compatible según plataforma para evitar warnings en Web
      web: { // Propiedad CSS estándar en Web
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Sombra cálida suave en navegador
      }, // Fin web
      default: { // Propiedades nativas de elevación y sombra en Android e iOS
        shadowColor: '#4f2c21', // Tono espresso para sombra iOS
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento 2px abajo
        shadowOpacity: 0.15, // Transparencia suave
        shadowRadius: 4, // Difuminado
        elevation: 3, // Profundidad nativa en Android
      }, // Fin default móvil
    }), // Fin Platform.select
  }, // Fin styles.card
  cardDark: { // Variación de tarjeta para Modo Oscuro
    backgroundColor: '#241D1B', // Fondo café oscuro elegante
    borderColor: '#382E2B', // Borde oscuro cálido
  }, // Fin cardDark
  cardPressed: { // Micro-interacción táctil mientras el usuario presiona la tarjeta
    opacity: 0.85, // Ligera transparencia al tocar
    transform: [{ scale: 0.98 }], // Encoge 2% dando sensación de botón físico
  }, // Fin cardPressed
  imageWrapper: { // Contenedor posicionado para alojar badges sobre la fotografía
    position: 'relative', // Permite hijos con position: 'absolute'
    width: '100%', // Ocupa ancho total de tarjeta
  }, // Fin imageWrapper
  image: { // Tamaño estándar de imagen en tarjeta
    height: 200, // Altura fija de 200px
    width: '100%', // Ancho completo
    resizeMode: 'cover', // Recorta proporcionalmente sin deformar la fotografía
    backgroundColor: '#E5DDD9', // Color neutro visible mientras descarga
  }, // Fin image
  imageDark: { // Color neutro oscuro mientras descarga imagen en tema oscuro
    backgroundColor: '#181312', // Fondo oscuro cálido
  }, // Fin imageDark
  imageCompact: { // Altura reducida activada por Ajustes -> Modo compacto o landscape corto
    height: 130, // Reduce 70px para mostrar más platillos por pantalla
  }, // Fin imageCompact
  categoryBadge: { // Etiqueta flotante superior izquierda de categoría
    position: 'absolute', // Posiciona sobre la fotografía
    top: 12, // 12px desde arriba
    left: 12, // 12px desde la izquierda
    backgroundColor: 'rgba(117, 51, 51, 0.92)', // Vino traslúcido elegante
    paddingHorizontal: 10, // Aire lateral
    paddingVertical: 4, // Aire vertical
    borderRadius: 16, // Forma de píldora
  }, // Fin categoryBadge
  categoryBadgeDark: { // Variante vino/rojo brillante para Modo Oscuro
    backgroundColor: 'rgba(231, 76, 60, 0.92)', // Terracota luminoso
  }, // Fin categoryBadgeDark
  categoryBadgeText: { // Tipografía del badge de categoría
    color: '#FFFFFF', // Blanco legible sobre vino
    fontSize: 12, // Letra pequeña compacta
    fontWeight: '700', // Negrita marcada
  }, // Fin categoryBadgeText
  favoriteButton: { // Botón circular superior derecho de favorito
    position: 'absolute', // Posiciona sobre la esquina derecha de la foto
    top: 12, // Margen superior
    right: 12, // Margen derecho
    width: 36, // Ancho fijo circular
    height: 36, // Alto fijo circular
    borderRadius: 18, // Radio exactamente la mitad para círculo perfecto
    backgroundColor: 'rgba(255, 255, 255, 0.92)', // Fondo blanco traslúcido
    justifyContent: 'center', // Centra corazón verticalmente
    alignItems: 'center', // Centra corazón horizontalmente
  }, // Fin favoriteButton
  favoriteButtonDark: { // Botón de favorito cuando darkMode está activo
    backgroundColor: 'rgba(36, 29, 27, 0.92)', // Fondo oscuro traslúcido
    borderWidth: 1, // Borde sutil para despegarlo del fondo oscuro
    borderColor: '#4A3833', // Borde espresso
  }, // Fin favoriteButtonDark
  favoriteButtonActive: { // Fondo rosado cuando ya está marcado como favorito en tema claro
    backgroundColor: '#FDEDEC', // Tinte rojo pálido
  }, // Fin favoriteButtonActive
  favoriteButtonActiveDark: { // Fondo vino oscuro cuando ya está marcado como favorito en tema oscuro
    backgroundColor: '#3A1F1E', // Fondo rojizo oscuro
    borderColor: '#E74C3C', // Borde rojo brillante
  }, // Fin favoriteButtonActiveDark
  favoriteIcon: { // Tamaño y color neutro del corazón sin marcar
    fontSize: 18, // Tamaño cómodo al ojo
    color: '#555555', // Gris oscuro legible
  }, // Fin favoriteIcon
  favoriteIconDark: { // Color del corazón sin marcar en tema oscuro
    color: '#B8A9A4', // Gris arena claro
  }, // Fin favoriteIconDark
  favoriteIconActive: { // Color del corazón activo en tema claro
    color: '#C0392B', // Terracota intenso
  }, // Fin favoriteIconActive
  favoriteIconActiveDark: { // Color del corazón activo en tema oscuro
    color: '#EC7063', // Coral legible sobre fondo oscuro
  }, // Fin favoriteIconActiveDark
  content: { // Padding interno de la sección de texto inferior
    padding: 16, // 16px en los 4 lados
  }, // Fin content
  title: { // Estilo del título del platillo
    fontSize: 18, // Título destacado
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café muy oscuro de alto contraste
    marginBottom: 6, // Separación hacia la descripción
  }, // Fin title
  titleDark: { // Título blanco cálido para Modo Oscuro
    color: '#F7F2F0', // Blanco roto legible sin encandilar
  }, // Fin titleDark
  description: { // Descripción resumida de la receta
    fontSize: 14, // Tamaño legible de cuerpo
    lineHeight: 20, // Interlineado cómodo
    color: '#555555', // Gris oscuro suave
  }, // Fin description
  descriptionDark: { // Descripción en gris arena para Modo Oscuro
    color: '#B8A9A4', // Alto contraste sobre #241D1B
  }, // Fin descriptionDark
  metaRow: { // Contenedor flexible para acomodar píldoras en fila (con salto si falta espacio)
    flexDirection: 'row', // Acomodo horizontal
    flexWrap: 'wrap', // Salta a segunda fila en pantallas muy estrechas
    gap: 8, // Separación uniforme entre píldoras
    marginTop: 12, // Margen superior respecto a descripción
    alignItems: 'center', // Alinea verticalmente al centro
  }, // Fin metaRow
  timePill: { // Píldora de tiempo en modo claro
    backgroundColor: '#FEF5E7', // Fondo crema ámbar
    paddingHorizontal: 10, // Aire horizontal
    paddingVertical: 4, // Aire vertical
    borderRadius: 12, // Píldora suave
  }, // Fin timePill
  timePillDark: { // Píldora de tiempo en modo oscuro
    backgroundColor: '#33261A', // Ámbar oscuro sutil
  }, // Fin timePillDark
  timePillText: { // Texto de tiempo en modo claro
    color: '#B9770E', // Ámbar contrastante
    fontSize: 12, // Letra compacta
    fontWeight: '600', // Seminegrita
  }, // Fin timePillText
  timePillTextDark: { // Texto de tiempo en modo oscuro
    color: '#F5B041', // Dorado legible
  }, // Fin timePillTextDark
  difficultyPill: { // Base común de píldora de dificultad (sus colores vienen de getDifficultyColors)
    paddingHorizontal: 10, // Aire horizontal
    paddingVertical: 4, // Aire vertical
    borderRadius: 12, // Esquinas redondeadas
  }, // Fin difficultyPill
  difficultyPillText: { // Base tipográfica de dificultad
    fontSize: 12, // Letra compacta
    fontWeight: '700', // Negrita marcada
  }, // Fin difficultyPillText
  likePill: { // Píldora de likes en modo claro
    backgroundColor: '#E8F8F0', // Verde menta claro
    paddingHorizontal: 10, // Aire horizontal
    paddingVertical: 4, // Aire vertical
    borderRadius: 12, // Esquinas redondeadas
  }, // Fin likePill
  likePillDark: { // Píldora de likes en modo oscuro
    backgroundColor: '#1B3124', // Verde bosque oscuro
  }, // Fin likePillDark
  likePillText: { // Texto de likes en modo claro
    color: '#27AE60', // Verde albahaca
    fontSize: 12, // Letra compacta
    fontWeight: '700', // Negrita marcada
  }, // Fin likePillText
  likePillTextDark: { // Texto de likes en modo oscuro
    color: '#58D68D', // Verde menta brillante
  }, // Fin likePillTextDark
}); // Fin de StyleSheet Card
