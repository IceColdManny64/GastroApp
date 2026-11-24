import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'; // Core Components para barra y desplazamiento horizontal de chips
import { // Importa listas constantes y tipos de filtros desde el dominio
  RECIPE_CATEGORIES, // Arreglo ['Todas', 'Mexicanas', ...]
  RECIPE_DIFFICULTIES, // Arreglo ['Todas', 'Muy facil', ...]
  RecipeCategory, // Tipo unión categoría
  RecipeDifficulty, // Tipo unión dificultad
  RecipeFilterState, // Objeto completo del estado de filtros
  SortOption, // Claves permitidas de ordenamiento
} from '../../types/RecipeItem'; // Desde módulo de tipos

export interface SearchFilterBarProps { // Props controladas recibidas desde HomeScreen
  filters: RecipeFilterState; // Estado actual de búsqueda, categoría, dificultad, orden y favoritos
  totalResults: number; // Total de recetas coincidentes tras filtrar
  favoritesCount: number; // Cantidad actual de recetas favoritas activas
  darkMode?: boolean; // Activa estilos de Modo Oscuro
  onChangeSearch: (text: string) => void; // Actualiza búsqueda al escribir letra por letra
  onSubmitServerSearch: () => void; // Ejecuta búsqueda contra server.js al presionar Buscar/Enter
  onSelectCategory: (category: RecipeCategory) => void; // Cambia filtro de categoría
  onSelectDifficulty: (difficulty: RecipeDifficulty) => void; // Cambia filtro de dificultad
  onSelectSort: (sortBy: SortOption) => void; // Cambia criterio de ordenamiento
  onToggleOnlyFavorites: () => void; // Activa o desactiva filtro "Solo favoritos"
  onResetFilters: () => void; // Reinicia todos los filtros a su estado inicial
} // Fin de SearchFilterBarProps

const SORT_OPTIONS: { value: SortOption; label: string }[] = [ // Opciones visibles para ordenar el catálogo
  { value: 'default', label: 'Por defecto' }, // Orden original tal como viene del JSON
  { value: 'likes_desc', label: 'Mayor aprobación (%)' }, // Orden descendente por likeRate
  { value: 'time_asc', label: 'Menor tiempo' }, // Orden ascendente por prepareTime
  { value: 'title_asc', label: 'Nombre (A-Z)' }, // Orden alfabético por título
]; // Fin de SORT_OPTIONS

export default function SearchFilterBar({ // Componente de barra superior de búsqueda y filtros
  filters, // Filtros activos
  totalResults, // Conteo visible
  favoritesCount, // Total favoritos
  darkMode = false, // Claro por defecto
  onChangeSearch, // Handler cambio de texto
  onSubmitServerSearch, // Handler envío búsqueda
  onSelectCategory, // Handler chip categoría
  onSelectDifficulty, // Handler chip dificultad
  onSelectSort, // Handler chip orden
  onToggleOnlyFavorites, // Handler chip favoritos
  onResetFilters, // Handler botón limpiar
}: SearchFilterBarProps) { // Tipado props
  const hasActiveFilters = // Determina si hay al menos un filtro o búsqueda aplicada para mostrar botón Limpiar
    filters.searchQuery.trim() !== '' || // Texto escrito no vacío
    filters.category !== 'Todas' || // Alguna categoría específica seleccionada
    filters.difficulty !== 'Todas' || // Alguna dificultad específica seleccionada
    filters.sortBy !== 'default' || // Algún ordenamiento distinto al default
    filters.onlyFavorites; // Filtro de solo favoritos encendido

  return ( // Árbol visual del panel de filtros
    <View style={[styles.container, darkMode && styles.containerDark]}>{/* Caja tarjeta contenedora adaptada al tema */}
      <View style={styles.searchRow}>{/* Fila superior con input de texto y botón Buscar */}
        <TextInput // Campo de texto para buscar por nombre, ingrediente o categoría
          style={[styles.searchInput, darkMode && styles.searchInputDark]} // Bordes y colores claro/oscuro
          placeholder="Buscar receta por nombre o ingrediente..." // Texto guía en español latino
          placeholderTextColor={darkMode ? '#8D7B75' : '#888888'} // Color legible del placeholder
          value={filters.searchQuery} // Valor controlado desde filters.searchQuery
          onChangeText={onChangeSearch} // Dispara actualización instantánea del filtro de texto en Home
          onSubmitEditing={onSubmitServerSearch} // Dispara búsqueda en servidor al presionar Enter/Buscar del teclado
          returnKeyType="search" // Cambia tecla Enter del teclado móvil por lupa Buscar
        />{/* Termina campo de entrada de búsqueda */}
        <Pressable onPress={onSubmitServerSearch} style={styles.searchButton}>{/* Botón rojo terracota "Buscar" */}
          <Text style={styles.searchButtonText}>Buscar</Text>{/* Etiqueta blanca del botón */}
        </Pressable>{/* Termina botón Buscar */}
      </View>{/* Fin fila búsqueda */}

      <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>{/* Encabezado pequeño de sección Categoría */}
        Categoría:{/* Etiqueta de grupo de chips de categoría */}
      </Text>{/* Termina encabezado Categoría */}
      <ScrollView // Carrusel horizontal deslizable para chips de categoría
        horizontal // Desplazamiento izquierda <-> derecha
        showsHorizontalScrollIndicator={false} // Oculta barra de scroll horizontal visual
        contentContainerStyle={styles.chipsScroll} // Acomoda chips en fila con separación gap: 8
      >{/* Lista horizontal de categorías gastronómicas */}
        {RECIPE_CATEGORIES.map((category) => { // Genera un chip interactivo por cada categoría
          const isSelected = filters.category === category; // Comprueba si es la categoría activa
          return ( // Devuelve botón chip
            <Pressable // Chip presionable de categoría
              key={category} // Clave única requerida por React al iterar listas
              onPress={() => onSelectCategory(category)} // Notifica categoría tocada al padre
              style={[ // Estilo neutro o resaltado si está seleccionado
                styles.chip, // Píldora neutra base
                darkMode && styles.chipDark, // Versión oscura
                isSelected && styles.chipActive, // Resalta en terracota #C0392B si activo
              ]} // Fin style chip
            >{/* Etiqueta del chip de categoría */}
              <Text // Nombre de categoría dentro del chip
                style={[ // Color de texto según selección y tema
                  styles.chipText, // Texto café oscuro en claro
                  darkMode && styles.chipTextDark, // Texto claro en modo oscuro
                  isSelected && styles.chipTextActive, // Blanco puro si está activo
                ]} // Fin style chipText
              >{/* Renderiza nombre de la categoría */}
                {category}{/* Texto visible del chip */}
              </Text>{/* Termina texto del chip */}
            </Pressable> // Fin chip presionable de categoría
          ); // Fin return chip
        })}{/* Cierra iteración de chips de categoría */}
      </ScrollView>{/* Fin ScrollView categorías */}

      <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>{/* Encabezado de sección Dificultad */}
        Dificultad:{/* Etiqueta de grupo de chips de dificultad */}
      </Text>{/* Termina encabezado Dificultad */}
      <ScrollView // Carrusel horizontal de chips de dificultad
        horizontal // Dirección horizontal
        showsHorizontalScrollIndicator={false} // Oculta scrollbar
        contentContainerStyle={styles.chipsScroll} // Fila con gap 8
      >{/* Lista horizontal de niveles de dificultad */}
        {RECIPE_DIFFICULTIES.map((difficulty) => { // Itera todas las dificultades disponibles
          const isSelected = filters.difficulty === difficulty; // Comprueba selección actual
          return ( // Devuelve chip de dificultad
            <Pressable // Chip presionable
              key={difficulty} // Key única
              onPress={() => onSelectDifficulty(difficulty)} // Avisa dificultad elegida
              style={[ // Resalta en verde albahaca si está seleccionado
                styles.chip, // Base
                darkMode && styles.chipDark, // Oscuro
                isSelected && styles.chipActiveSecondary, // Verde #27AE60 cuando está activo
              ]} // Fin style
            >{/* Etiqueta del chip de dificultad */}
              <Text // Texto de dificultad
                style={[ // Color dinámico
                  styles.chipText, // Base
                  darkMode && styles.chipTextDark, // Oscuro
                  isSelected && styles.chipTextActive, // Blanco activo
                ]} // Fin style
              >{/* Renderiza nombre de dificultad */}
                {difficulty}{/* Texto Muy facil, Facil, Medio, Dificil o Todas */}
              </Text>{/* Termina texto de dificultad */}
            </Pressable> // Fin chip presionable de dificultad
          ); // Fin return
        })}{/* Cierra iteración de chips de dificultad */}
      </ScrollView>{/* Fin ScrollView dificultades */}

      <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>{/* Encabezado de ordenamiento y favoritos */}
        Ordenar por:{/* Etiqueta de grupo de ordenamiento y solo favoritos */}
      </Text>{/* Termina encabezado Ordenar por */}
      <ScrollView // Carrusel horizontal de chips de ordenamiento + chip Favoritos
        horizontal // Dirección horizontal
        showsHorizontalScrollIndicator={false} // Oculta scrollbar
        contentContainerStyle={styles.chipsScroll} // Fila espaciada
      >{/* Lista horizontal de criterios de ordenamiento y filtro rápido de favoritos */}
        {SORT_OPTIONS.map((option) => { // Genera chips de ordenamiento
          const isSelected = filters.sortBy === option.value; // Comprueba si este orden está activo
          return ( // Devuelve chip de orden
            <Pressable // Botón ordenamiento
              key={option.value} // Key única
              onPress={() => onSelectSort(option.value)} // Notifica criterio elegido
              style={[ // Resalta en tono vino #753333 cuando está activo
                styles.chip, // Base
                darkMode && styles.chipDark, // Oscuro
                isSelected && styles.chipActiveAccent, // Vino cuando está activo
              ]} // Fin style
            >{/* Etiqueta legible del ordenamiento */}
              <Text // Etiqueta legible del criterio
                style={[ // Color adaptado
                  styles.chipText, // Base
                  darkMode && styles.chipTextDark, // Oscuro
                  isSelected && styles.chipTextActive, // Blanco activo
                ]} // Fin style
              >{/* Renderiza nombre legible de la opción */}
                {option.label}{/* Texto legible ("Mayor aprobación (%)", etc.) */}
              </Text>{/* Termina texto del criterio */}
            </Pressable> // Fin chip de criterio de orden
          ); // Fin return
        })}{/* Cierra iteración de chips de ordenamiento */}

        <Pressable // Chip toggle al final de la fila para mostrar solo recetas favoritas ♥
          onPress={onToggleOnlyFavorites} // Alterna booleano onlyFavorites
          style={[ // Resalta en rojo si el filtro de favoritos está encendido
            styles.chip, // Base
            darkMode && styles.chipDark, // Oscuro
            filters.onlyFavorites && styles.chipActive, // Terracota activo
          ]} // Fin style
        >{/* Contenido del chip de filtro rápido Solo favoritos */}
          <Text // Texto con contador en vivo de favoritos
            style={[ // Color adaptado
              styles.chipText, // Base
              darkMode && styles.chipTextDark, // Oscuro
              filters.onlyFavorites && styles.chipTextActive, // Blanco activo
            ]} // Fin style
          >{/* Muestra corazón, etiqueta y total de favoritos */}
            ♥ Solo favoritos ({favoritesCount}) {/* Muestra ♥ y cantidad disponible */}
          </Text>{/* Termina texto de chip favoritos */}
        </Pressable>{/* Termina chip Solo favoritos */}
      </ScrollView>{/* Fin ScrollView ordenamiento */}

      <View style={[styles.summaryRow, darkMode && styles.summaryRowDark]}>{/* Pie de barra con conteo de resultados y botón limpiar */}
        <Text style={[styles.summaryText, darkMode && styles.summaryTextDark]}>{/* Conteo en singular o plural */}
          {totalResults}{' '}{/* Número de recetas encontradas */}
          {totalResults === 1 ? 'receta encontrada' : 'recetas encontradas'}{/* Concordancia gramatical correcta */}
        </Text>{/* Termina conteo de resultados */}
        {hasActiveFilters && ( // Solo aparece cuando existe algún filtro o texto aplicado
          <Pressable // Botón compacto "Limpiar filtros"
            onPress={onResetFilters} // Restablece todos los filtros al catálogo completo
            style={[styles.clearButton, darkMode && styles.clearButtonDark]} // Fondo rosado o vino oscuro
          >{/* Texto del botón Limpiar filtros */}
            <Text // Texto del botón limpiar
              style={[ // Rojo contrastante
                styles.clearButtonText, // Rojo en modo claro
                darkMode && styles.clearButtonTextDark, // Coral en modo oscuro
              ]} // Fin style
            >{/* Etiqueta visible para restablecer búsqueda y filtros */}
              Limpiar filtros {/* Texto del botón */}
            </Text>{/* Termina etiqueta Limpiar filtros */}
          </Pressable> // Fin botón Limpiar filtros
        )}{/* Termina renderizado condicional de Limpiar filtros */}
      </View>{/* Fin fila resumen */}
    </View> // Fin contenedor principal
  ); // Fin return JSX
} // Fin SearchFilterBar

const styles = StyleSheet.create({ // Estilos de SearchFilterBar en modo claro y oscuro
  container: { // Tarjeta contenedora principal
    backgroundColor: '#FFFFFF', // Blanco en claro
    padding: 12, // Relleno interno
    borderRadius: 12, // Bordes redondeados
    marginBottom: 12, // Separación con primera tarjeta de resultados
    borderWidth: 1, // Borde fino
    borderColor: '#EAE2DF', // Arena cálido
  }, // Fin container
  containerDark: { // Tarjeta contenedora en modo oscuro
    backgroundColor: '#241D1B', // Café oscuro
    borderColor: '#382E2B', // Borde oscuro
  }, // Fin containerDark
  searchRow: { // Fila superior Input + Botón
    flexDirection: 'row', // Lado a lado horizontalmente
    gap: 8, // 8px entre input y botón
    marginBottom: 10, // Margen antes de chips
  }, // Fin searchRow
  searchInput: { // Caja de texto buscador en modo claro
    flex: 1, // Ocupa todo el ancho sobrante antes del botón
    borderWidth: 1, // Borde 1px
    borderColor: '#CCCCCC', // Gris estándar
    borderRadius: 8, // Esquinas suaves
    paddingHorizontal: 12, // Relleno horizontal
    paddingVertical: 10, // Relleno vertical
    fontSize: 15, // Letra cómoda
    backgroundColor: '#FAFAFA', // Blanco tenue
    color: '#2C1E1B', // Texto oscuro
  }, // Fin searchInput
  searchInputDark: { // Buscador en modo oscuro
    backgroundColor: '#181312', // Fondo oscuro profundo
    borderColor: '#382E2B', // Borde oscuro
    color: '#F7F2F0', // Texto claro
  }, // Fin searchInputDark
  searchButton: { // Botón rojo "Buscar"
    backgroundColor: '#C0392B', // Terracota de marca
    paddingHorizontal: 16, // Ancho cómodo
    borderRadius: 8, // Esquinas alineadas con el input
    justifyContent: 'center', // Centra texto verticalmente
    alignItems: 'center', // Centra texto horizontalmente
  }, // Fin searchButton
  searchButtonText: { // Texto blanco del botón Buscar
    color: '#FFFFFF', // Blanco puro
    fontWeight: '700', // Negrita
    fontSize: 14, // Tamaño legible
  }, // Fin searchButtonText
  sectionLabel: { // Etiquetas "Categoría:", "Dificultad:", "Ordenar por:"
    fontSize: 12, // Compacto
    fontWeight: '700', // Negrita
    color: '#555555', // Gris medio
    marginTop: 4, // Aire arriba
    marginBottom: 6, // Aire antes de chips
  }, // Fin sectionLabel
  textDark: { // Etiquetas en modo oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin textDark
  chipsScroll: { // Contenedor interno del ScrollView horizontal de chips
    flexDirection: 'row', // Fila continua
    gap: 8, // Separación uniforme entre chips
    paddingBottom: 6, // Aire inferior
  }, // Fin chipsScroll
  chip: { // Chip sin seleccionar en modo claro
    paddingHorizontal: 12, // Aire horizontal
    paddingVertical: 6, // Aire vertical
    borderRadius: 18, // Cápsula redondeada
    backgroundColor: '#F3ECE9', // Crema sutil
    borderWidth: 1, // Borde fino
    borderColor: '#E2D6D1', // Borde arena
  }, // Fin chip
  chipDark: { // Chip sin seleccionar en modo oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderColor: '#382E2B', // Borde oscuro
  }, // Fin chipDark
  chipActive: { // Chip seleccionado primario (Categoría / Solo favoritos)
    backgroundColor: '#C0392B', // Terracota
    borderColor: '#C0392B', // Mismo tono borde
  }, // Fin chipActive
  chipActiveSecondary: { // Chip seleccionado dificultad
    backgroundColor: '#27AE60', // Verde albahaca
    borderColor: '#27AE60', // Mismo tono borde
  }, // Fin chipActiveSecondary
  chipActiveAccent: { // Chip seleccionado ordenamiento
    backgroundColor: '#753333', // Vino oscuro
    borderColor: '#753333', // Mismo tono borde
  }, // Fin chipActiveAccent
  chipText: { // Texto de chip sin seleccionar claro
    fontSize: 13, // Tamaño legible
    fontWeight: '600', // Seminegrita
    color: '#4A3833', // Espresso medio
  }, // Fin chipText
  chipTextDark: { // Texto de chip sin seleccionar oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin chipTextDark
  chipTextActive: { // Texto de chip seleccionado
    color: '#FFFFFF', // Blanco sobre cualquier fondo activo
  }, // Fin chipTextActive
  summaryRow: { // Barra inferior con contador y botón limpiar
    flexDirection: 'row', // Izquierda contador, derecha botón
    justifyContent: 'space-between', // Separa a los extremos
    alignItems: 'center', // Centra verticalmente
    marginTop: 8, // Separación superior
    paddingTop: 8, // Espacio después de línea divisora
    borderTopWidth: 1, // Línea divisoria sutil
    borderTopColor: '#F0EAE7', // Color divisor claro
  }, // Fin summaryRow
  summaryRowDark: { // Borde divisor en modo oscuro
    borderTopColor: '#382E2B', // Color divisor oscuro
  }, // Fin summaryRowDark
  summaryText: { // Conteo de recetas en claro
    fontSize: 13, // Tamaño compacto
    color: '#666666', // Gris medio
    fontWeight: '600', // Seminegrita
  }, // Fin summaryText
  summaryTextDark: { // Conteo de recetas en oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin summaryTextDark
  clearButton: { // Botón "Limpiar filtros" modo claro
    paddingHorizontal: 10, // Aire horizontal
    paddingVertical: 4, // Aire vertical
    borderRadius: 6, // Bordes suaves
    backgroundColor: '#FDEDEC', // Fondo rojizo suave
  }, // Fin clearButton
  clearButtonDark: { // Botón limpiar en modo oscuro
    backgroundColor: '#3A1F1E', // Fondo vino apagado
  }, // Fin clearButtonDark
  clearButtonText: { // Texto limpiar claro
    color: '#C0392B', // Terracota
    fontSize: 12, // Compacto
    fontWeight: '700', // Negrita
  }, // Fin clearButtonText
  clearButtonTextDark: { // Texto limpiar oscuro
    color: '#EC7063', // Coral claro
  }, // Fin clearButtonTextDark
}); // Fin StyleSheet SearchFilterBar
