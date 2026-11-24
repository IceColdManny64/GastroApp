import * as ImagePicker from 'expo-image-picker'; // API de Expo SDK 58 para pedir permisos y abrir la galería de fotos
import { useLocalSearchParams, useRouter } from 'expo-router'; // Lee id/recipe en modo Editar y maneja navegación de regreso
import { useEffect, useMemo, useState } from 'react'; // Hooks para cargar receta en edición, parsear params y controlar inputs
import { // Componentes nativos de React Native para formulario, vista previa de foto y chips
  ActivityIndicator, // Spinner mientras carga datos iniciales de edición o guarda la receta
  Image, // Previsualiza en vivo la fotografía seleccionada de galería o escrita por URL
  KeyboardAvoidingView, // Desplaza los campos hacia arriba cuando abre el teclado virtual en iOS
  Platform, // Distingue Web vs iOS/Android para compresión en canvas, permisos y sombras
  Pressable, // Botones de selector de foto, chips de categoría/dificultad, Cancelar y Guardar
  ScrollView, // Permite recorrer todo el formulario sin cortar campos en pantallas pequeñas
  StyleSheet, // Compila estilos claro/oscuro, errores por campo y botones
  Text, // Etiquetas de campos, mensajes de validación en rojo y textos de botones
  TextInput, // Entradas controladas de título, descripción, URL, tiempo y aprobación
  View, // Contenedores de tarjeta, filas de 2 columnas y filas de chips
  useWindowDimensions, // Detecta pantallas muy estrechas (< 380px) para apilar Tiempo y Aprobación
} from 'react-native'; // Fin de importaciones desde react-native
import { createRecipe, getRecipe, updateRecipe } from '@/services/recipes'; // Operaciones Crear, Leer por ID y Editar receta en server.js/caché
import { // Tipos de payload, modelo y catálogos estrictos sin la opción 'Todas'
  RecipeFormPayload, // Estructura limpia enviada a createRecipe() o updateRecipe()
  RecipeItem, // Modelo usado al recibir una receta existente para editar
  VALID_RECIPE_CATEGORIES, // Lista de 6 categorías reales permitidas en recetas nuevas/editadas
  VALID_RECIPE_DIFFICULTIES, // Lista de 4 niveles reales de dificultad permitidos
} from '@/types/RecipeItem'; // Fin de importaciones desde types/RecipeItem
import { showAlert } from '@/utils/alerts'; // Muestra alertas de permiso denegado o validación en Web y móvil
import { safeGoBack } from '@/utils/navigation'; // Regresa a Detalle/Home sin arrojar error GO_BACK si recargaron la página
import { useThemeMode } from '@/utils/preferencesStorage'; // Suscribe el formulario al tema claro u oscuro global
import { validateRecipeForm } from '@/utils/validators'; // Valida textos obligatorios, formato HH:MM:SS y entero 0..100

async function normalizePickedAssetToUri( // Convierte fotos de galería en Data URI JPEG persistente para recipes.json
  asset: ImagePicker.ImagePickerAsset // Objeto seleccionado devuelto por ImagePicker.launchImageLibraryAsync
): Promise<string> { // Retorna Data URI Base64 durable (evita URLs blob: que expiran al recargar)
  if (Platform.OS === 'web' && typeof document !== 'undefined') { // En navegador Web redimensiona y comprime usando <canvas>
    try { // Protege el procesamiento gráfico en memoria del navegador
      const sourceUri = asset.uri; // Blob URI temporal generada por el navegador al elegir archivo local
      const img = new window.Image(); // Crea elemento HTMLImageElement para decodificar dimensiones reales
      img.crossOrigin = 'anonymous'; // Permite dibujar en canvas sin bloquear por políticas de origen
      await new Promise<void>((resolve, reject) => { // Espera de forma asíncrona a que la imagen termine de cargar en memoria
        img.onload = () => resolve(); // Continúa cuando img.width e img.height ya están disponibles
        img.onerror = () => reject(new Error('No se pudo procesar la imagen.')); // Falla controlada si el archivo no es imagen válida
        img.src = sourceUri; // Dispara la carga de la imagen seleccionada
      }); // Fin de promesa de carga de imagen
      const maxWidth = 720; // Limita ancho máximo a 720px para mantener ligero recipes.json y localStorage
      const scale = img.width > maxWidth ? maxWidth / img.width : 1; // Calcula factor de reducción proporcional sin agrandar fotos chicas
      const canvas = document.createElement('canvas'); // Lienzo temporal fuera de pantalla para reescalar
      canvas.width = Math.max(1, Math.round(img.width * scale)); // Ancho final entero mínimo 1px
      canvas.height = Math.max(1, Math.round(img.height * scale)); // Alto final proporcional mínimo 1px
      const ctx = canvas.getContext('2d'); // Contexto 2D para dibujar la foto reescalada
      if (ctx) { // Si el navegador entregó contexto 2D válido
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Dibuja la foto reescalada sobre el lienzo
        return canvas.toDataURL('image/jpeg', 0.65); // Exporta Data URI JPEG comprimido al 65% de calidad
      } // Fin exportación canvas Web
    } catch (err) { // Si falla la compresión Web cae al respaldo base64/uri
      console.warn('[form.tsx] Usando fallback de imagen en Web:', err); // Avisa en consola sin romper la selección
    } // Fin try/catch de Web
  } // Fin rama Web

  if (asset.base64) { // En Android/iOS (o fallback Web) usa el Base64 entregado por Expo ImagePicker
    const mime = asset.mimeType || 'image/jpeg'; // Toma el MIME original o asume JPEG por defecto
    return `data:${mime};base64,${asset.base64}`; // Construye Data URI autónomo persistente en JSON
  } // Fin rama base64

  return asset.uri; // Último respaldo directo si no hubo base64 disponible
} // Fin de normalizePickedAssetToUri

export default function FormScreen() { // Pantalla dual para Crear nueva receta o Editar existente en /(app)/form
  const { recipe, id } = useLocalSearchParams<{ // Lee parámetros de ruta: vacíos en Crear, presentes en Editar
    recipe?: string; // JSON serializado enviado desde DetailScreen para prellenar rápido
    id?: string; // ID numérico de la receta a editar
  }>(); // Fin useLocalSearchParams
  const router = useRouter(); // Instancia de router para regresar tras guardar o cancelar
  const isDark = useThemeMode(); // Bandera reactiva de Modo Oscuro
  const { width } = useWindowDimensions(); // Ancho de pantalla para apilar columnas en móviles muy pequeños
  const isSmallScreen = width < 380; // Apila Tiempo y Aprobación en columna única debajo de 380px

  const editing: RecipeItem | null = useMemo(() => { // Parsea el objeto inicial si venimos desde Editar en Detalle
    if (!recipe) return null; // En modo Crear no llega parámetro recipe
    try { // Protege contra parámetros alterados en URL
      return JSON.parse(recipe) as RecipeItem; // Reconstruye objeto inicial para llenar estados al instante
    } catch { // Si falló el parseo JSON
      return null; // Deja que useEffect cargue los datos reales por ID
    } // Fin try/catch
  }, [recipe]); // Solo recalcula si cambia el param recipe

  const editingId = editing?.id ?? (id ? Number(id) : null); // Si tiene número estamos en modo Edición; si es null estamos en Creación

  const [title, setTitle] = useState(editing?.title ?? ''); // Campo Título de la receta
  const [description, setDescription] = useState(editing?.description ?? ''); // Campo Descripción/preparación
  const [imageUri, setImageUri] = useState<string | null>( // URI actual de la foto (galería Data URI o URL externa)
    editing?.image || null // Usa null si venía vacía (por ejemplo al omitir data: URI gigante en URL)
  ); // Fin estado imageUri
  const [prepareTime, setPrepareTime] = useState( // Campo Tiempo en formato estricto HH:MM:SS
    editing?.prepareTime ?? '00:30:00' // Valor inicial cómodo de 30 minutos al crear
  ); // Fin estado prepareTime
  const [likeRate, setLikeRate] = useState(String(editing?.likeRate ?? 90)); // Campo numérico como texto controlado (0..100)
  const [category, setCategory] = useState(editing?.category ?? 'Mexicanas'); // Chip de categoría seleccionado
  const [difficulty, setDifficulty] = useState(editing?.difficulty ?? 'Facil'); // Chip de dificultad seleccionado
  const [loadingInitial, setLoadingInitial] = useState<boolean>( // Muestra spinner solo si falta cargar datos o foto Base64 en edición
    Boolean(editingId && (!editing || !editing.image)) // Verdadero al editar por URL o cuando se omitió data: URI
  ); // Fin estado loadingInitial
  const [saving, setSaving] = useState<boolean>(false); // Deshabilita campos/botones y muestra spinner mientras guarda
  const [submitError, setSubmitError] = useState<string | null>(null); // Banner general de error encima del formulario
  const [validationErrors, setValidationErrors] = useState< // Mapa campo -> mensaje específico en rojo debajo de cada input
    Record<string, string> // Ej. { title: '...', prepareTime: '...' }
  >({}); // Inicia vacío sin errores visibles

  useEffect(() => { // En modo Edición consulta siempre la versión más reciente desde server.js/caché (incluye foto completa)
    if (!editingId) return; // En modo Crear no hay nada que consultar al servidor
    let isMounted = true; // Bandera para evitar setState si el usuario cancela antes de que responda getRecipe

    (async () => { // Pide datos frescos de la receta que se está editando
      try { // Consulta GET /api/recipes/:id
        const fresh = await getRecipe(Number(editingId)); // Recupera datos actuales (y la foto Data URI si se omitió de la URL)
        if (isMounted && fresh) { // Si el formulario sigue abierto y existe la receta
          setTitle(fresh.title); // Sincroniza título más reciente
          setDescription(fresh.description); // Sincroniza descripción más reciente
          setImageUri(fresh.image); // Carga la fotografía completa (URL o Base64)
          setPrepareTime(fresh.prepareTime); // Sincroniza tiempo HH:MM:SS
          setLikeRate(String(fresh.likeRate)); // Sincroniza calificación como texto
          setCategory(fresh.category); // Sincroniza chip de categoría
          setDifficulty(fresh.difficulty); // Sincroniza chip de dificultad
        } // Fin actualización de campos frescos
      } catch (err) { // Si no pudo consultar (ej. fallo inesperado) conserva los datos iniciales recibidos
        console.warn('[form.tsx] Usando datos iniciales de edición:', err); // Registra advertencia en consola
      } finally { // Siempre apaga spinner de carga inicial
        if (isMounted) { // Verifica que el componente siga montado
          setLoadingInitial(false); // Muestra ya los campos del formulario
        } // Fin guardia isMounted
      } // Fin try/catch/finally
    })(); // Ejecuta carga inicial de edición

    return () => { // Cleanup al desmontar el formulario
      isMounted = false; // Evita fugas o advertencias de estado tras salir de la pantalla
    }; // Fin cleanup
  }, [editingId]); // Corre al abrir el formulario con un editingId válido

  const pickImage = async () => { // Solicita permiso de galería en móvil y permite elegir una fotografía
    if (Platform.OS !== 'web') { // En Android/iOS es obligatorio pedir permiso explícito al sistema operativo
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Muestra diálogo nativo de permiso de fotos
      if (status !== 'granted') { // Si el usuario rechazó el acceso a la galería
        showAlert('Permiso denegado', 'Necesitamos acceso a tus fotos'); // Explica por qué no se abrió la galería
        return; // Aborta selección de imagen
      } // Fin guardia de permiso
    } // Fin verificación plataforma móvil
    const result = await ImagePicker.launchImageLibraryAsync({ // Abre el selector nativo de imágenes (o file picker en Web)
      mediaTypes: ['images'], // Restringe a imágenes únicamente (sintaxis actual de Expo SDK 58)
      allowsEditing: true, // Permite recortar la foto antes de confirmar en móvil
      aspect: [4, 3], // Relación de aspecto 4:3 recomendada para las tarjetas
      quality: 0.5, // Compresión moderada inicial desde el selector nativo
      base64: true, // Solicita cadena Base64 en móvil para guardarla de forma persistente
    }); // Fin launchImageLibraryAsync

    if (!result.canceled && result.assets[0]) { // Si el usuario eligió una imagen y no canceló
      const normalizedUri = await normalizePickedAssetToUri(result.assets[0]); // Convierte a Data URI JPEG durable
      setImageUri(normalizedUri); // Muestra vista previa inmediata en el recuadro del formulario
      setValidationErrors((prev) => { // Limpia el error rojo del campo imagen si estaba marcado antes
        const next = { ...prev }; // Copia mapa actual de errores
        delete next.imageUri; // Remueve únicamente el error de imageUri
        return next; // Devuelve mapa actualizado
      }); // Fin limpieza de error en imagen
    } // Fin verificación imagen seleccionada
  }; // Fin de pickImage

  const fallbackDestination = editingId ? `/details?id=${editingId}` : '/home'; // Destino seguro si recargaron directo la URL del form

  const handleSave = async () => { // Valida todos los campos y crea o actualiza la receta al pulsar Guardar
    setSubmitError(null); // Limpia banner general de error previo
    const validation = validateRecipeForm({ // Ejecuta todas las reglas obligatorias y de tipos (texto, regex HH:MM:SS, entero 0..100)
      title, // Título capturado
      description, // Descripción capturada
      imageUri, // URI de galería o URL escrita
      prepareTime, // Cadena HH:MM:SS
      likeRateInput: likeRate, // Texto numérico a validar como entero entre 0 y 100
      category, // Categoría seleccionada
      difficulty, // Dificultad seleccionada
    }); // Fin validateRecipeForm

    if (!validation.isValid) { // Si alguna regla falló
      setValidationErrors(validation.fieldErrors); // Pinta borde rojo y mensaje exacto debajo de cada campo afectado
      const msg = validation.errorMessage || 'Revisa los datos ingresados.'; // Toma el primer error para el banner y alerta
      setSubmitError(msg); // Muestra el banner rojo arriba del card
      showAlert('Campos inválidos', msg); // Avisa mediante diálogo emergente
      return; // Detiene el envío antes de llamar a server.js
    } // Fin guardia de validación

    setValidationErrors({}); // Limpia todos los bordes rojos si la validación pasó
    const cleanUri = (imageUri || '').trim(); // Quita espacios alrededor de la URL/URI
    const numericLikeRate = Math.round(Number(likeRate.trim())); // Convierte calificación válida a número entero limpio

    const payload: RecipeFormPayload = { // Arma objeto tipado esperado por createRecipe / updateRecipe
      title: title.trim(), // Título limpio
      description: description.trim(), // Descripción limpia
      imageUri: cleanUri, // Foto validada
      prepareTime: prepareTime.trim(), // Tiempo HH:MM:SS validado
      likeRate: numericLikeRate, // Calificación entera 0..100
      category: category.trim(), // Categoría válida del catálogo
      difficulty: difficulty.trim(), // Dificultad válida del catálogo
    }; // Fin payload

    try { // Envía creación (POST) o actualización (PUT) al microservicio JSON o caché local
      setSaving(true); // Bloquea inputs/chips/botones y muestra spinner en el botón guardar
      if (editingId) { // Si existe editingId actualiza la receta existente
        await updateRecipe(editingId, payload); // Envía PUT /api/recipes/:id (propaga error 404 si no existe)
      } else { // Si no había ID crea una receta nueva
        await createRecipe(payload); // Envía POST /api/recipes y obtiene el nuevo ID asignado por server.js
      } // Fin bifurcación Crear vs Editar

      safeGoBack(router, fallbackDestination); // Vuelve atrás; useFocusEffect en Detalle/Home recargará el cambio al instante
    } catch (err) { // Captura errores del servidor o disco al guardar
      const msg = // Lee mensaje legible del fallo
        err instanceof Error ? err.message : 'No se pudo guardar la receta.'; // Respaldo en español
      setSubmitError(msg); // Muestra error en el banner superior
      showAlert('Error al guardar', msg); // Lanza alerta nativa/Web con el error
    } finally { // Siempre reactiva el formulario al concluir
      setSaving(false); // Desbloquea inputs y oculta spinner
    } // Fin try/catch/finally
  }; // Fin de handleSave

  if (loadingInitial) { // Muestra spinner centrado mientras carga los datos completos de edición
    return ( // Vista centrada de carga inicial
      <View // Contenedor pantalla completa centrado
        style={[ // Fondo crema o café oscuro
          styles.keyboardWrapper, // Flex: 1 y fondo claro
          styles.centered, // Centra vertical y horizontalmente
          isDark && styles.keyboardWrapperDark, // Fondo oscuro si aplica
        ]} // Fin estilos
      >{/* Indicador de carga y mensaje */}
        <ActivityIndicator // Rueda giratoria nativa
          size="large" // Tamaño grande
          color={isDark ? '#E74C3C' : '#C0392B'} // Rojo terracota según tema
        />{/* Termina spinner */}
        <Text style={[styles.placeholderText, isDark && styles.subTextDark]}>{/* Texto informativo */}
          Cargando datos de la receta...{/* Aviso visible mientras llega getRecipe() */}
        </Text>{/* Termina texto */}
      </View> // Fin vista de carga inicial
    ); // Fin retorno temprano loadingInitial
  } // Fin guardia loadingInitial

  return ( // Renderiza el formulario completo de creación/edición de receta
    <KeyboardAvoidingView // Evita que el teclado virtual tape los inputs inferiores en iOS
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]} // Fondo general claro u oscuro
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Padding automático solo en iOS
    >{/* ScrollView para recorrer todos los campos cómodamente */}
      <ScrollView // Contenedor desplazable vertical
        contentContainerStyle={styles.container} // Centra el card hasta 860px con relleno de 16px
        keyboardShouldPersistTaps="handled" // Permite tocar chips o Guardar directo aunque el teclado esté abierto
      >{/* Tarjeta contenedora del formulario */}
        <View style={[styles.card, isDark && styles.cardDark]}>{/* Superficie blanca u oscura con sombra */}
          <Text style={[styles.heading, isDark && styles.textDark]}>{/* Encabezado dinámico según modo */}
            {editingId ? 'Editar receta' : 'Crear nueva receta'}{/* Cambia título automáticamente por modo */}
          </Text>{/* Termina encabezado del formulario */}

          {submitError && ( // Muestra banner rojo superior cuando falla validación o petición HTTP
            <View // Caja rojiza de alerta
              style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Variante clara u oscura
            >{/* Texto de error general */}
              <Text // Mensaje de error
                style={[styles.fieldError, isDark && styles.fieldErrorDark]} // Rojo terracota o coral
              >{/* Contenido de submitError */}
                {submitError}{/* Muestra el error activo */}
              </Text>{/* Termina texto del banner */}
            </View> // Fin errorBanner
          )}{/* Termina banner condicional submitError */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta del campo Título */}
            Título de la receta *{/* Campo obligatorio */}
          </Text>{/* Termina etiqueta Título */}
          <TextInput // Campo controlado para el nombre del platillo (3 a 80 caracteres)
            style={[ // Aplica borde rojo automático si validationErrors.title existe
              styles.input, // Estilo base claro
              isDark && styles.inputDark, // Variante oscura
              validationErrors.title && // Resalta borde y fondo en rojo si falló validación
                (isDark ? styles.inputErrorDark : styles.inputError), // Estilo de error según tema
            ]} // Fin style título
            placeholder="Ejemplo: Enchiladas suizas tradicionales" // Guía de ejemplo para el usuario
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color legible del placeholder
            editable={!saving} // Bloquea edición mientras saving es true
            value={title} // Enlazado al estado title
            onChangeText={setTitle} // Actualiza estado title al escribir
          />{/* Termina input de Título */}
          {validationErrors.title && ( // Muestra motivo exacto debajo del campo si falló validación
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Texto rojo de error */}
              {validationErrors.title}{/* Ej. "El título es obligatorio (mínimo 3 caracteres)." */}
            </Text> // Fin error título
          )}{/* Termina error condicional de título */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta del campo Descripción */}
            Descripción y pasos de preparación *{/* Campo obligatorio */}
          </Text>{/* Termina etiqueta Descripción */}
          <TextInput // Área de texto multilínea para ingredientes y preparación (mínimo 10 caracteres)
            style={[ // Combina caja base, altura mínima textArea y borde rojo si tiene error
              styles.input, // Estilo base claro
              styles.textArea, // Altura de 100px y texto alineado arriba (textAlignVertical: 'top')
              isDark && styles.inputDark, // Variante oscura
              validationErrors.description && // Marca error visual si falta texto o es muy corto
                (isDark ? styles.inputErrorDark : styles.inputError), // Borde rojo claro u oscuro
            ]} // Fin style descripción
            placeholder="Describe los ingredientes y la preparación del platillo (mínimo 10 caracteres)..." // Texto guía
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color del placeholder
            multiline // Permite múltiples renglones y saltos de línea
            numberOfLines={4} // Sugiere altura inicial de 4 líneas en Android
            editable={!saving} // Bloquea mientras guarda
            value={description} // Enlazado al estado description
            onChangeText={setDescription} // Actualiza description al teclear
          />{/* Termina input de Descripción */}
          {validationErrors.description && ( // Error específico debajo de Descripción
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Texto rojo de error */}
              {validationErrors.description}{/* Ej. mínimo 10 caracteres */}
            </Text> // Fin error descripción
          )}{/* Termina error condicional de descripción */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta de la sección Fotografía */}
            Fotografía del platillo *{/* Obligatoria (por galería o URL) */}
          </Text>{/* Termina etiqueta Fotografía */}
          <Pressable // Recuadro interactivo con borde punteado para abrir la galería de fotos
            onPress={pickImage} // Dispara solicitud de permisos y selector nativo ImagePicker
            disabled={saving} // Deshabilitado mientras guarda
            style={[ // Muestra borde punteado o rojo si falta imagen
              styles.imagePicker, // Recuadro punteado de 200px de alto
              isDark && styles.imagePickerDark, // Variante oscura
              validationErrors.imageUri && // Resalta borde rojo si no se eligió imagen ni URL
                (isDark ? styles.inputErrorDark : styles.inputError), // Estilo de error adaptado al tema
            ]} // Fin style imagePicker
          >{/* Muestra vista previa si ya hay imageUri o invitación con cámara si está vacío */}
            {imageUri ? ( // Si ya seleccionó foto o escribió URL muestra previsualización instantánea
              <Image source={{ uri: imageUri }} style={styles.previewImage} /> // Cubre el recuadro completo
            ) : ( // Estado vacío inicial sin foto seleccionada
              <View style={styles.placeholderBox}>{/* Centro visual con ícono e instrucción */}
                <Text style={styles.placeholderIcon}>📷</Text>{/* Ícono de cámara */}
                <Text // Texto de ayuda dentro del selector
                  style={[styles.placeholderText, isDark && styles.subTextDark]} // Gris medio o arena
                >{/* Instrucción para abrir galería */}
                  Toca para elegir una foto de tu galería{/* Invitación táctil */}
                </Text>{/* Termina texto placeholder */}
              </View> // Fin placeholderBox
            )}{/* Termina alternancia preview vs placeholder */}
          </Pressable>{/* Termina selector táctil de galería */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Opción alternativa para pegar URL web */}
            O ingresa una URL de imagen:{/* Permite usar fotos remotas igual que el catálogo base */}
          </Text>{/* Termina etiqueta URL */}
          <TextInput // Campo sincronizado con el mismo estado imageUri para pegar enlaces HTTP
            style={[ // Marca borde rojo si imageUri quedó inválido o vacío
              styles.input, // Estilo base
              isDark && styles.inputDark, // Variante oscura
              validationErrors.imageUri && // Marca borde rojo si falló validación
                (isDark ? styles.inputErrorDark : styles.inputError), // Borde rojo según tema
            ]} // Fin style input URL
            placeholder="https://ejemplo.com/mi-receta.jpg" // Ejemplo de URL válida
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color placeholder
            autoCapitalize="none" // Evita mayúsculas en URLs
            editable={!saving} // Bloqueado mientras guarda
            value={imageUri ?? ''} // Convierte null a cadena vacía para TextInput controlado
            onChangeText={(text) => setImageUri(text)} // Actualiza imageUri y refresca la vista previa arriba
          />{/* Termina input de URL de imagen */}
          {validationErrors.imageUri && ( // Error debajo del campo de imagen si está vacío
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Texto rojo de error */}
              {validationErrors.imageUri}{/* Mensaje explicando que falta imagen o URL */}
            </Text> // Fin error imageUri
          )}{/* Termina error condicional de imagen */}

          <View // Agrupa Tiempo y Aprobación lado a lado (o apilados en pantallas < 380px)
            style={[ // Usa fila de 2 columnas por defecto o columna si isSmallScreen
              styles.twoColRow, // Fila horizontal con gap 12
              isSmallScreen && styles.twoColRowStacked, // Cambia a columna en pantallas muy estrechas
            ]} // Fin style contenedor de dos campos
          >{/* Columna 1: Tiempo de preparación + Columna 2: Porcentaje de aprobación */}
            <View style={styles.col}>{/* Columna izquierda: Tiempo HH:MM:SS */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta de tiempo */}
                Tiempo (HH:MM:SS) *{/* Indica formato exacto exigido por TIME_REGEX */}
              </Text>{/* Termina etiqueta Tiempo */}
              <TextInput // Campo controlado validado contra /^\d{2}:[0-5]\d:[0-5]\d$/
                style={[ // Marca borde rojo si el formato no cumple HH:MM:SS
                  styles.input, // Estilo base
                  isDark && styles.inputDark, // Oscuro
                  validationErrors.prepareTime && // Resalta error si falló regex
                    (isDark ? styles.inputErrorDark : styles.inputError), // Borde error según tema
                ]} // Fin style Tiempo
                placeholder="00:45:00" // Ejemplo claro de 45 minutos
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color placeholder
                editable={!saving} // Bloquea mientras guarda
                value={prepareTime} // Enlazado a prepareTime
                onChangeText={setPrepareTime} // Actualiza prepareTime al escribir
              />{/* Termina input Tiempo */}
              {validationErrors.prepareTime && ( // Mensaje de error si minutos/segundos >= 60 o formato incorrecto
                <Text // Texto de error bajo Tiempo
                  style={[styles.fieldError, isDark && styles.fieldErrorDark]} // Rojo o coral
                >{/* Detalle del error de formato */}
                  {validationErrors.prepareTime}{/* Ej. formato HH:MM:SS */}
                </Text> // Fin error Tiempo
              )}{/* Termina error condicional de prepareTime */}
            </View>{/* Termina columna Tiempo */}

            <View style={styles.col}>{/* Columna derecha: Aprobación entera 0..100 */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta de porcentaje */}
                Aprobación (0 - 100) *{/* Indica rango entero permitido */}
              </Text>{/* Termina etiqueta Aprobación */}
              <TextInput // Campo numérico validado como entero finito >= 0 y <= 100
                style={[ // Marca error si escriben letras, decimales o > 100
                  styles.input, // Estilo base
                  isDark && styles.inputDark, // Oscuro
                  validationErrors.likeRate && // Resalta error numérico
                    (isDark ? styles.inputErrorDark : styles.inputError), // Borde error según tema
                ]} // Fin style Aprobación
                placeholder="90" // Ejemplo de calificación inicial
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color placeholder
                keyboardType="numeric" // Abre teclado numérico en dispositivos móviles
                editable={!saving} // Bloquea mientras guarda
                value={likeRate} // Valor como texto para permitir editar/borrar libremente
                onChangeText={setLikeRate} // Actualiza texto likeRate al teclear
              />{/* Termina input Aprobación */}
              {validationErrors.likeRate && ( // Error debajo de Aprobación si está fuera de 0..100 o no es entero
                <Text // Texto rojo de error numérico
                  style={[styles.fieldError, isDark && styles.fieldErrorDark]} // Color de alerta
                >{/* Detalle de error numérico */}
                  {validationErrors.likeRate}{/* Ej. entero entre 0 y 100 */}
                </Text> // Fin error Aprobación
              )}{/* Termina error condicional de likeRate */}
            </View>{/* Termina columna Aprobación */}
          </View>{/* Termina fila Tiempo y Aprobación */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta de selector de Categoría */}
            Categoría *{/* Obligatoria entre las 6 categorías del catálogo */}
          </Text>{/* Termina etiqueta Categoría */}
          <View style={styles.chipsRow}>{/* Fila envolvente con chips seleccionables de categoría */}
            {VALID_RECIPE_CATEGORIES.map((cat) => { // Genera chips desde RecipeItem.ts (sin 'Todas')
              const selected = category === cat; // Comprueba si este chip es la categoría elegida
              return ( // Renderiza chip táctil
                <Pressable // Chip de categoría
                  key={cat} // Clave única por nombre de categoría
                  onPress={() => setCategory(cat)} // Cambia el estado category al tocar el chip
                  disabled={saving} // Deshabilitado mientras guarda
                  style={[ // Resalta en terracota #C0392B el chip activo
                    styles.chip, // Píldora neutra
                    isDark && styles.chipDark, // Variante oscura
                    selected && styles.chipSelected, // Fondo rojo terracota si está seleccionado
                  ]} // Fin style chip categoría
                >{/* Nombre de la categoría */}
                  <Text // Texto del chip
                    style={[ // Blanco puro si está activo, café o arena si no
                      styles.chipText, // Base café oscuro
                      isDark && styles.chipTextDark, // Arena en modo oscuro
                      selected && styles.chipTextSelected, // Blanco activo
                    ]} // Fin style texto chip
                  >{/* Muestra nombre de categoría */}
                    {cat}{/* Mexicanas, Italianas, Orientales, etc. */}
                  </Text>{/* Termina texto de chip */}
                </Pressable> // Fin chip categoría
              ); // Fin return chip
            })}{/* Termina iteración de VALID_RECIPE_CATEGORIES */}
          </View>{/* Termina fila de chips de categoría */}
          {validationErrors.category && ( // Error defensivo si llegara una categoría inválida
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Texto rojo de error */}
              {validationErrors.category}{/* Mensaje de categoría inválida */}
            </Text> // Fin error categoría
          )}{/* Termina error condicional de categoría */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta de selector de Dificultad */}
            Dificultad *{/* Obligatoria entre los 4 niveles válidos */}
          </Text>{/* Termina etiqueta Dificultad */}
          <View style={styles.chipsRow}>{/* Fila envolvente con chips de dificultad */}
            {VALID_RECIPE_DIFFICULTIES.map((diff) => { // Genera chips desde VALID_RECIPE_DIFFICULTIES
              const selected = difficulty === diff; // Verdadero si esta dificultad está activa
              return ( // Renderiza chip de dificultad
                <Pressable // Chip seleccionable de dificultad
                  key={diff} // Clave única por nivel
                  onPress={() => setDifficulty(diff)} // Asigna dificultad seleccionada
                  disabled={saving} // Bloqueado durante guardado
                  style={[ // Resalta en verde albahaca #27AE60 cuando está activo
                    styles.chip, // Píldora neutra
                    isDark && styles.chipDark, // Variante oscura
                    selected && styles.chipSelectedSecondary, // Verde albahaca si está seleccionado
                  ]} // Fin style chip dificultad
                >{/* Etiqueta de dificultad */}
                  <Text // Texto dentro del chip
                    style={[ // Blanco si activo, café o arena si inactivo
                      styles.chipText, // Base café
                      isDark && styles.chipTextDark, // Arena oscuro
                      selected && styles.chipTextSelected, // Blanco activo
                    ]} // Fin style texto chip
                  >{/* Nombre del nivel */}
                    {diff}{/* Muy facil, Facil, Medio o Dificil */}
                  </Text>{/* Termina texto del chip */}
                </Pressable> // Fin chip dificultad
              ); // Fin return chip
            })}{/* Termina iteración de VALID_RECIPE_DIFFICULTIES */}
          </View>{/* Termina fila de chips de dificultad */}
          {validationErrors.difficulty && ( // Error defensivo si dificultad no fuera válida
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Texto rojo de error */}
              {validationErrors.difficulty}{/* Mensaje de dificultad inválida */}
            </Text> // Fin error dificultad
          )}{/* Termina error condicional de dificultad */}

          <View style={styles.actionsRow}>{/* Fila inferior de botones Cancelar y Guardar/Actualizar */}
            <Pressable // Botón secundario para descartar y volver atrás
              onPress={() => safeGoBack(router, fallbackDestination)} // Regresa seguro a Detalle o Home
              disabled={saving} // Deshabilitado mientras está enviando cambios
              style={[styles.cancelButton, saving && styles.buttonDisabled]} // Vino #753333; atenuado al guardar
            >{/* Etiqueta Cancelar */}
              <Text style={styles.cancelButtonText}>Cancelar</Text>{/* Texto blanco */}
            </Pressable>{/* Termina botón Cancelar */}

            <Pressable // Botón principal que valida y guarda en JSON/caché
              onPress={handleSave} // Ejecuta validación y createRecipe o updateRecipe
              disabled={saving} // Evita envíos duplicados al tocar varias veces rápido
              style={[styles.saveButton, saving && styles.buttonDisabled]} // Terracota #C0392B; atenuado al guardar
            >{/* Spinner durante guardado o etiqueta dinámica según modo */}
              {saving ? ( // Mientras saving es true muestra indicador giratorio
                <ActivityIndicator color="#FFFFFF" /> // Spinner blanco
              ) : ( // Estado normal
                <Text style={styles.buttonText}>{/* Texto dinámico Crear vs Editar */}
                  {editingId ? 'Actualizar receta' : 'Guardar receta'}{/* Refleja la operación real */}
                </Text> // Fin texto del botón guardar
              )}{/* Termina alternancia spinner/texto */}
            </Pressable>{/* Termina botón Guardar/Actualizar */}
          </View>{/* Termina fila de botones de acción */}
        </View>{/* Termina card del formulario */}
      </ScrollView>{/* Termina ScrollView */}
    </KeyboardAvoidingView> // Fin KeyboardAvoidingView de FormScreen
  ); // Fin del retorno JSX principal
} // Fin de componente FormScreen

const styles = StyleSheet.create({ // Hoja de estilos de FormScreen
  keyboardWrapper: { // Contenedor raíz claro
    flex: 1, // Ocupa pantalla completa
    backgroundColor: '#FAF7F5', // Crema cálido
  }, // Fin keyboardWrapper
  keyboardWrapperDark: { // Contenedor raíz oscuro
    backgroundColor: '#181312', // Café oscuro profundo
  }, // Fin keyboardWrapperDark
  centered: { // Centrado para el estado loadingInitial
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    gap: 12, // Separación entre spinner y texto
  }, // Fin centered
  errorBanner: { // Banner superior de error claro
    backgroundColor: '#FDEDEC', // Rosado suave
    borderRadius: 8, // Bordes redondeados
    padding: 10, // Espaciado interno
    marginBottom: 12, // Espacio antes del primer campo
    borderWidth: 1, // Borde 1px
    borderColor: '#F5B7B1', // Borde rosado intenso
  }, // Fin errorBanner
  errorBannerDark: { // Banner superior de error oscuro
    backgroundColor: '#3A1F1E', // Vino oscuro
    borderColor: '#78281F', // Borde rojo oscuro
  }, // Fin errorBannerDark
  container: { // Contenedor interno del ScrollView
    padding: 16, // Relleno alrededor de la tarjeta
    maxWidth: 860, // Ancho máximo cómodo para formularios en escritorio
    width: '100%', // Ocupa 100% en móviles
    alignSelf: 'center', // Centra horizontalmente
  }, // Fin container
  card: { // Tarjeta contenedora del formulario en claro
    backgroundColor: '#FFFFFF', // Superficie blanca
    borderRadius: 14, // Esquinas redondeadas
    padding: 20, // Relleno interior
    borderWidth: 1, // Borde 1px
    borderColor: '#EAE2DF', // Arena cálido
    ...Platform.select({ // Sombra compatible entre navegador Web y dispositivos nativos
      web: { // Sombra CSS estándar
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Sombra suave sin advertencias
      }, // Fin sombra web
      default: { // Sombra nativa iOS/Android
        shadowColor: '#4f2c21', // Sombra café
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento Y 2px
        shadowOpacity: 0.15, // Opacidad en iOS
        shadowRadius: 4, // Difuminado
        elevation: 3, // Elevación en Android
      }, // Fin sombra nativa
    }), // Fin Platform.select
  }, // Fin card
  cardDark: { // Tarjeta del formulario en oscuro
    backgroundColor: '#241D1B', // Superficie café oscuro
    borderColor: '#382E2B', // Borde espresso
  }, // Fin cardDark
  heading: { // Título "Crear nueva receta" / "Editar receta"
    fontSize: 22, // Tamaño prominente
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café muy oscuro
    marginBottom: 8, // Espacio inferior
  }, // Fin heading
  textDark: { // Color de texto principal en oscuro
    color: '#F7F2F0', // Blanco cálido
  }, // Fin textDark
  subTextDark: { // Color de texto secundario en oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin subTextDark
  label: { // Etiquetas de campos obligatorios
    fontSize: 14, // Tamaño legible
    fontWeight: '600', // Seminegrita
    marginBottom: 6, // Separación antes del input o chips
    marginTop: 12, // Separación con el bloque anterior
    color: '#333333', // Gris oscuro
  }, // Fin label
  input: { // Caja de texto estándar en claro
    borderWidth: 1, // Borde 1px
    borderColor: '#CCCCCC', // Gris neutro
    borderRadius: 8, // Esquinas redondeadas
    padding: 12, // Relleno cómodo
    fontSize: 16, // Tamaño legible (evita auto-zoom en iOS)
    backgroundColor: '#FAFAFA', // Blanco grisáceo
    color: '#2C1E1B', // Texto ingresado oscuro
  }, // Fin input
  inputDark: { // Caja de texto en oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderColor: '#382E2B', // Borde espresso
    color: '#F7F2F0', // Texto blanco cálido
  }, // Fin inputDark
  inputError: { // Modificador rojo claro para campos con error de validación
    borderColor: '#C0392B', // Borde rojo terracota
    backgroundColor: '#FFF9F9', // Fondo rosado muy tenue
  }, // Fin inputError
  inputErrorDark: { // Modificador rojo oscuro para campos con error
    borderColor: '#E74C3C', // Borde rojo brillante
    backgroundColor: '#2C1918', // Fondo rojizo oscuro
  }, // Fin inputErrorDark
  textArea: { // Modificador para el campo multilínea de Descripción
    minHeight: 100, // Altura mínima para escribir varios renglones
    textAlignVertical: 'top', // En Android alinea el cursor arriba en lugar de centrado
  }, // Fin textArea
  fieldError: { // Mensaje específico debajo de cada campo en claro
    color: '#C0392B', // Terracota de error
    fontSize: 12, // Letra pequeña clara
    fontWeight: '600', // Seminegrita
    marginTop: 4, // Pegado al campo afectado
  }, // Fin fieldError
  fieldErrorDark: { // Mensaje específico debajo de cada campo en oscuro
    color: '#EC7063', // Coral brillante legible
  }, // Fin fieldErrorDark
  imagePicker: { // Recuadro de selección de foto desde galería en claro
    borderWidth: 2, // Borde más grueso para destacar área de carga
    borderColor: '#CCCCCC', // Gris neutro
    borderStyle: 'dashed', // Borde punteado clásico de zona de subida de imagen
    borderRadius: 8, // Esquinas redondeadas
    height: 200, // Alto de vista previa igual al de las tarjetas
    justifyContent: 'center', // Centra el placeholder verticalmente
    alignItems: 'center', // Centra horizontalmente
    overflow: 'hidden', // Recorta la imagen seleccionada dentro de las esquinas redondeadas
    backgroundColor: '#FAFAFA', // Fondo tenue mientras no hay foto
  }, // Fin imagePicker
  imagePickerDark: { // Recuadro de selección de foto en oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderColor: '#4A3833', // Borde espresso punteado
  }, // Fin imagePickerDark
  previewImage: { // Imagen de vista previa cuando imageUri tiene foto
    width: '100%', // Ocupa todo el ancho del recuadro
    height: '100%', // Ocupa los 200px de alto
    resizeMode: 'cover', // Cubre proporcionalmente sin deformar
  }, // Fin previewImage
  placeholderBox: { // Contenedor interno cuando aún no hay imagen
    alignItems: 'center', // Centra ícono y texto
    padding: 16, // Aire alrededor
  }, // Fin placeholderBox
  placeholderIcon: { // Emoji de cámara dentro del selector vacío
    fontSize: 36, // Tamaño grande visible
    marginBottom: 8, // Espacio antes del texto guía
  }, // Fin placeholderIcon
  placeholderText: { // Texto guía de selección de foto y carga inicial
    fontSize: 14, // Tamaño legible
    color: '#666666', // Gris medio
    fontWeight: '600', // Seminegrita
    textAlign: 'center', // Centrado
  }, // Fin placeholderText
  twoColRow: { // Fila para Tiempo y Aprobación lado a lado
    flexDirection: 'row', // Horizontal por defecto
    gap: 12, // Separación de 12px entre columnas
  }, // Fin twoColRow
  twoColRowStacked: { // Apila Tiempo y Aprobación verticalmente en pantallas < 380px
    flexDirection: 'column', // Cambia de fila a columna
  }, // Fin twoColRowStacked
  col: { // Cada columna dentro de twoColRow
    flex: 1, // Mitad y mitad del ancho disponible
  }, // Fin col
  chipsRow: { // Contenedor flexible de chips de categoría o dificultad
    flexDirection: 'row', // En fila horizontal
    flexWrap: 'wrap', // Salta a la siguiente línea automáticamente según ancho
    gap: 8, // Separación de 8px entre chips
  }, // Fin chipsRow
  chip: { // Píldora sin seleccionar en claro
    paddingHorizontal: 14, // Relleno lateral
    paddingVertical: 8, // Relleno vertical
    borderRadius: 18, // Píldora redondeada
    backgroundColor: '#F3ECE9', // Crema arena suave
    borderWidth: 1, // Borde fino
    borderColor: '#E2D6D1', // Borde cálido
  }, // Fin chip
  chipDark: { // Píldora sin seleccionar en oscuro
    backgroundColor: '#181312', // Fondo oscuro
    borderColor: '#382E2B', // Borde espresso
  }, // Fin chipDark
  chipSelected: { // Chip activo para Categoría
    backgroundColor: '#C0392B', // Rojo terracota
    borderColor: '#C0392B', // Borde a juego
  }, // Fin chipSelected
  chipSelectedSecondary: { // Chip activo para Dificultad
    backgroundColor: '#27AE60', // Verde albahaca
    borderColor: '#27AE60', // Borde a juego
  }, // Fin chipSelectedSecondary
  chipText: { // Texto de chip inactivo en claro
    fontSize: 13, // Tamaño compacto
    fontWeight: '600', // Seminegrita
    color: '#4A3833', // Café medio
  }, // Fin chipText
  chipTextDark: { // Texto de chip inactivo en oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin chipTextDark
  chipTextSelected: { // Texto blanco de cualquier chip activo
    color: '#FFFFFF', // Blanco contrastante
  }, // Fin chipTextSelected
  actionsRow: { // Fila inferior de Cancelar y Guardar/Actualizar
    flexDirection: 'row', // Lado a lado
    gap: 12, // 12px entre botones
    marginTop: 24, // Amplia separación respecto al último grupo de chips
  }, // Fin actionsRow
  cancelButton: { // Botón secundario "Cancelar"
    flex: 1, // Ocupa 1/3 del ancho total de la fila
    backgroundColor: '#753333', // Vino corporativo
    paddingVertical: 14, // Altura táctil cómoda
    borderRadius: 8, // Esquinas redondeadas
    alignItems: 'center', // Centra texto
  }, // Fin cancelButton
  cancelButtonText: { // Texto blanco del botón Cancelar
    color: '#FFFFFF', // Blanco puro
    fontWeight: '600', // Seminegrita
    fontSize: 16, // Tamaño estándar
  }, // Fin cancelButtonText
  saveButton: { // Botón primario "Guardar receta" / "Actualizar receta"
    flex: 2, // Ocupa 2/3 del ancho total para darle protagonismo visual
    backgroundColor: '#C0392B', // Rojo terracota
    paddingVertical: 14, // Altura táctil cómoda
    borderRadius: 8, // Esquinas redondeadas
    alignItems: 'center', // Centra texto o spinner
  }, // Fin saveButton
  buttonDisabled: { // Modificador mientras saving está en curso
    opacity: 0.6, // Atenúa visualmente ambos botones
  }, // Fin buttonDisabled
  buttonText: { // Texto blanco del botón guardar
    color: '#FFFFFF', // Blanco puro
    fontWeight: '600', // Seminegrita
    fontSize: 16, // Tamaño estándar
  }, // Fin buttonText
}); // Fin StyleSheet FormScreen
