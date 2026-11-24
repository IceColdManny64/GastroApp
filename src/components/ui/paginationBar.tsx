import { Pressable, StyleSheet, Text, View } from 'react-native'; // Core Components para barra de botones de página
import { PageSizeOption } from '../../types/Auth'; // Tipo estricto 10 | 20 | 30

export interface PaginationBarProps { // Props recibidas desde HomeScreen para controlar paginación
  currentPage: number; // Página actual (comienza en 1)
  totalPages: number; // Cantidad total de páginas calculada
  totalItems: number; // Total de recetas después de filtrar
  itemsPerPage: PageSizeOption; // Cantidad seleccionada (10, 20 o 30)
  darkMode?: boolean; // Bandera Modo Oscuro
  onPageChange: (page: number) => void; // Callback al pulsar Anterior o Siguiente
  onItemsPerPageChange: (size: PageSizeOption) => void; // Callback al pulsar botones 10, 20 o 30
} // Fin de interfaz PaginationBarProps

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [10, 20, 30]; // Botones de cantidad disponibles por página

export default function PaginationBar({ // Barra inferior de paginación configurable
  currentPage, // Página activa
  totalPages, // Total de páginas
  totalItems, // Total elementos filtrados
  itemsPerPage, // Tamaño actual de página
  darkMode = false, // Claro por defecto
  onPageChange, // Handler cambio de número de página
  onItemsPerPageChange, // Handler cambio tamaño 10/20/30
}: PaginationBarProps) { // Tipado props
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1; // Índice del primer elemento mostrado (ej. 11)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems); // Índice del último elemento mostrado sin pasar el total
  const canGoPrev = currentPage > 1; // Habilita "Anterior" solo si no estamos en página 1
  const canGoNext = currentPage < totalPages; // Habilita "Siguiente" solo si quedan más páginas

  return ( // Árbol JSX del paginador
    <View style={[styles.container, darkMode && styles.containerDark]}>{/* Caja blanca u oscura contenedora */}
      <View style={[styles.pageSizeRow, darkMode && styles.pageSizeRowDark]}>{/* Fila superior para elegir 10, 20 o 30 recetas */}
        <Text style={[styles.label, darkMode && styles.labelDark]}>{/* Texto descriptivo izquierdo */}
          Elementos por página:{/* Etiqueta del selector de tamaño de página */}
        </Text>{/* Termina etiqueta de tamaño de página */}
        <View style={styles.sizeButtonsGroup}>{/* Grupo horizontal con los 3 botones numéricos */}
          {PAGE_SIZE_OPTIONS.map((size) => { // Genera botones 10, 20 y 30 dinámicamente
            const isSelected = itemsPerPage === size; // Detecta cuál opción coincide con la actual
            return ( // Devuelve botón de tamaño
              <Pressable // Botón seleccionable de tamaño
                key={size} // Clave única numérica
                onPress={() => onItemsPerPageChange(size)} // Avisa tamaño elegido y vuelve a página 1 en Home
                style={[ // Estilo neutro o resaltado en rojo terracota si activo
                  styles.sizeButton, // Base clara
                  darkMode && styles.sizeButtonDark, // Base oscura
                  isSelected && styles.sizeButtonActive, // Activo terracota
                ]} // Fin style sizeButton
              >{/* Contenido numérico del botón de tamaño */}
                <Text // Número 10, 20 o 30
                  style={[ // Color adaptado al estado
                    styles.sizeButtonText, // Café en modo claro
                    darkMode && styles.sizeButtonTextDark, // Arena en modo oscuro
                    isSelected && styles.sizeButtonTextActive, // Blanco puro si está activo
                  ]} // Fin style text
                >{/* Renderiza 10, 20 o 30 */}
                  {size}{/* Muestra 10, 20 o 30 */}
                </Text>{/* Termina texto numérico */}
              </Pressable> // Fin botón de tamaño de página
            ); // Fin return botón
          })}{/* Cierra iteración de botones 10, 20 y 30 */}
        </View>{/* Fin grupo botones tamaño */}
      </View>{/* Fin fila superior */}

      <View style={styles.navRow}>{/* Fila inferior con Anterior, Info central y Siguiente */}
        <Pressable // Botón para retroceder 1 página
          onPress={() => canGoPrev && onPageChange(currentPage - 1)} // Disminuye página solo si canGoPrev es true
          disabled={!canGoPrev} // Deshabilita interacción visual y táctil en página 1
          style={[ // Estilo botón vino o atenuado si está deshabilitado
            styles.navButton, // Estilo base vino #753333
            !canGoPrev && styles.navButtonDisabled, // Atenuado si está deshabilitado
          ]} // Fin style Anterior
        >{/* Etiqueta del botón Anterior */}
          <Text style={styles.navButtonText}>Anterior</Text>{/* Etiqueta botón */}
        </Pressable>{/* Termina botón Anterior */}

        <View style={styles.pageInfo}>{/* Bloque central informativo */}
          <Text style={[styles.pageInfoPrimary, darkMode && styles.labelDark]}>{/* Indicador principal de página actual */}
            Página {currentPage} de {totalPages}{/* Ej. "Página 1 de 3" */}
          </Text>{/* Termina indicador de página actual */}
          <Text style={[styles.pageInfoSecondary, darkMode && styles.subLabelDark]}>{/* Rango exacto mostrado */}
            Mostrando {startItem}-{endItem} de {totalItems}{/* Ej. "Mostrando 1-10 de 30" */}
          </Text>{/* Termina rango mostrado */}
        </View>{/* Fin info central */}

        <Pressable // Botón para avanzar 1 página
          onPress={() => canGoNext && onPageChange(currentPage + 1)} // Aumenta página solo si existen más páginas
          disabled={!canGoNext} // Deshabilita en la última página
          style={[ // Estilo botón vino o atenuado
            styles.navButton, // Estilo base
            !canGoNext && styles.navButtonDisabled, // Atenuado en la última página
          ]} // Fin style Siguiente
        >{/* Etiqueta del botón Siguiente */}
          <Text style={styles.navButtonText}>Siguiente</Text>{/* Etiqueta botón */}
        </Pressable>{/* Termina botón Siguiente */}
      </View>{/* Fin fila navegación */}
    </View> // Fin contenedor paginador
  ); // Fin return JSX
} // Fin PaginationBar

const styles = StyleSheet.create({ // Hoja de estilos de PaginationBar
  container: { // Caja principal en modo claro
    backgroundColor: '#FFFFFF', // Fondo blanco
    borderRadius: 12, // Bordes redondeados
    padding: 12, // Relleno interior
    marginTop: 8, // Margen superior
    marginBottom: 16, // Espacio al fondo de pantalla
    borderWidth: 1, // Borde 1px
    borderColor: '#EAE2DF', // Borde arena cálido
  }, // Fin container
  containerDark: { // Caja principal en modo oscuro
    backgroundColor: '#241D1B', // Fondo café oscuro
    borderColor: '#382E2B', // Borde oscuro
  }, // Fin containerDark
  pageSizeRow: { // Fila superior selectora de cantidad
    flexDirection: 'row', // Texto a la izquierda, botones a la derecha
    flexWrap: 'wrap', // Permite envolver en pantallas muy estrechas
    justifyContent: 'space-between', // Separa texto y botones
    alignItems: 'center', // Centra verticalmente
    gap: 8, // Espaciado
    marginBottom: 10, // Margen inferior
    paddingBottom: 10, // Espacio antes de línea divisora
    borderBottomWidth: 1, // Divisor entre selector y navegación
    borderBottomColor: '#F0EAE7', // Color divisor claro
  }, // Fin pageSizeRow
  pageSizeRowDark: { // Borde divisor en modo oscuro
    borderBottomColor: '#382E2B', // Borde oscuro
  }, // Fin pageSizeRowDark
  label: { // Etiqueta "Elementos por página:" en claro
    fontSize: 13, // Tamaño compacto
    fontWeight: '600', // Seminegrita
    color: '#4A3833', // Café medio
  }, // Fin label
  labelDark: { // Etiquetas principales en modo oscuro
    color: '#F7F2F0', // Blanco roto
  }, // Fin labelDark
  subLabelDark: { // Subtexto "Mostrando..." en modo oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin subLabelDark
  sizeButtonsGroup: { // Fila que agrupa 10, 20 y 30
    flexDirection: 'row', // Horizontal
    gap: 8, // 8px entre cada número
  }, // Fin sizeButtonsGroup
  sizeButton: { // Botón de tamaño sin seleccionar en claro
    paddingHorizontal: 14, // Ancho táctil cómodo
    paddingVertical: 6, // Alto cómodo
    borderRadius: 8, // Bordes suaves
    backgroundColor: '#F3ECE9', // Crema claro
    borderWidth: 1, // Borde 1px
    borderColor: '#E2D6D1', // Borde arena
  }, // Fin sizeButton
  sizeButtonDark: { // Botón de tamaño sin seleccionar en oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderColor: '#382E2B', // Borde oscuro
  }, // Fin sizeButtonDark
  sizeButtonActive: { // Botón tamaño activo
    backgroundColor: '#C0392B', // Terracota de marca
    borderColor: '#C0392B', // Borde terracota
  }, // Fin sizeButtonActive
  sizeButtonText: { // Texto tamaño sin seleccionar en claro
    fontSize: 13, // Tamaño legible
    fontWeight: '700', // Negrita
    color: '#4A3833', // Café medio
  }, // Fin sizeButtonText
  sizeButtonTextDark: { // Texto tamaño sin seleccionar en oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin sizeButtonTextDark
  sizeButtonTextActive: { // Texto del tamaño seleccionado
    color: '#FFFFFF', // Blanco puro
  }, // Fin sizeButtonTextActive
  navRow: { // Fila inferior Anterior / Info / Siguiente
    flexDirection: 'row', // Horizontal
    flexWrap: 'wrap', // Salto de línea si es pantalla ultra angosta
    justifyContent: 'space-between', // Reparte en 3 columnas
    alignItems: 'center', // Centra verticalmente
    gap: 8, // Espaciado mínimo
  }, // Fin navRow
  navButton: { // Estilo botón Anterior/Siguiente
    backgroundColor: '#753333', // Vino oscuro de marca
    paddingHorizontal: 16, // Ancho cómodo
    paddingVertical: 10, // Área táctil cómoda
    borderRadius: 8, // Esquinas suaves
  }, // Fin navButton
  navButtonDisabled: { // Estado inactivo cuando no se puede ir atrás/adelante
    opacity: 0.45, // Atenuado visual
  }, // Fin navButtonDisabled
  navButtonText: { // Texto blanco dentro de Anterior/Siguiente
    color: '#FFFFFF', // Blanco puro
    fontSize: 13, // Tamaño legible
    fontWeight: '700', // Negrita
  }, // Fin navButtonText
  pageInfo: { // Columna central de indicadores
    alignItems: 'center', // Centra ambos textos
  }, // Fin pageInfo
  pageInfoPrimary: { // Texto "Página X de Y"
    fontSize: 14, // Destacado
    fontWeight: '700', // Negrita
    color: '#2C1E1B', // Alto contraste
  }, // Fin pageInfoPrimary
  pageInfoSecondary: { // Subtexto "Mostrando A-B de Total"
    fontSize: 12, // Secundario más pequeño
    color: '#666666', // Gris medio
    marginTop: 2, // Pequeña separación
  }, // Fin pageInfoSecondary
}); // Fin StyleSheet PaginationBar
