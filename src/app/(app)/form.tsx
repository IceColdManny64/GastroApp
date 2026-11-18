import * as ImagePicker from 'expo-image-picker'; // Importa el selector nativo de galería y cámara de Expo
import { useLocalSearchParams, useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useLocalSearchParams, useRouter })
import { useEffect, useMemo, useState } from 'react'; // Importa React y sus hooks ({ useEffect, useMemo, useState }) para estado y ciclo de vida
import { // Continúa o inicia bloque de importación de módulos
  ActivityIndicator, // Importa "ActivityIndicator" desde react-native
  Image, // Importa "Image" desde react-native
  KeyboardAvoidingView, // Importa "KeyboardAvoidingView" desde react-native
  Platform, // Importa "Platform" desde react-native
  Pressable, // Importa "Pressable" desde react-native
  ScrollView, // Importa "ScrollView" desde react-native
  StyleSheet, // Importa "StyleSheet" desde react-native
  Text, // Importa "Text" desde react-native
  TextInput, // Importa "TextInput" desde react-native
  View, // Importa "View" desde react-native
  useWindowDimensions, // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
} from 'react-native'; // Finaliza importación múltiple desde react-native
import { createRecipe, getRecipe, updateRecipe } from '@/services/recipes'; // Importa funciones del servicio de datos (@/services/recipes)
import { // Continúa o inicia bloque de importación de módulos
  RecipeFormPayload, // Importa "RecipeFormPayload" desde @/types/RecipeItem
  RecipeItem, // Importa "RecipeItem" desde @/types/RecipeItem
  VALID_RECIPE_CATEGORIES, // Importa "VALID_RECIPE_CATEGORIES" desde @/types/RecipeItem
  VALID_RECIPE_DIFFICULTIES, // Importa "VALID_RECIPE_DIFFICULTIES" desde @/types/RecipeItem
} from '@/types/RecipeItem'; // Finaliza importación múltiple desde @/types/RecipeItem
import { showAlert } from '@/utils/alerts'; // Importa utilidades auxiliares compartidas (@/utils/alerts)
import { safeGoBack } from '@/utils/navigation'; // Importa utilidades auxiliares compartidas (@/utils/navigation)
import { useThemeMode } from '@/utils/preferencesStorage'; // Importa utilidades auxiliares compartidas (@/utils/preferencesStorage)
import { validateRecipeForm } from '@/utils/validators'; // Importa utilidades auxiliares compartidas (@/utils/validators)

async function normalizePickedAssetToUri( // Declara función auxiliar normalizePickedAssetToUri
  asset: ImagePicker.ImagePickerAsset // Invoca API nativa de Expo para permisos o selección de imagen
): Promise<string> { // Especifica tipado TypeScript de retorno, parámetro o estado genérico
  if (Platform.OS === 'web' && typeof document !== 'undefined') { // Evalúa condición lógica antes de ejecutar este bloque
    try { // Inicia bloque try para capturar posibles errores de ejecución
      const sourceUri = asset.uri; // Declara constante local sourceUri
      const img = new window.Image(); // Declara constante local img
      img.crossOrigin = 'anonymous'; // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
      await new Promise<void>((resolve, reject) => { // Espera resolución asíncrona de la operación antes de continuar
        img.onload = () => resolve(); // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
        img.onerror = () => reject(new Error('No se pudo procesar la imagen.')); // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
        img.src = sourceUri; // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
      }); // Cierra bloque o expresión anterior
      const maxWidth = 720; // Declara constante local maxWidth
      const scale = img.width > maxWidth ? maxWidth / img.width : 1; // Declara constante local scale
      const canvas = document.createElement('canvas'); // Declara constante local canvas
      canvas.width = Math.max(1, Math.round(img.width * scale)); // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
      canvas.height = Math.max(1, Math.round(img.height * scale)); // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
      const ctx = canvas.getContext('2d'); // Declara constante local ctx
      if (ctx) { // Evalúa condición lógica antes de ejecutar este bloque
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Configura o dibuja imagen en canvas HTML5 para optimizar tamaño en Web
        return canvas.toDataURL('image/jpeg', 0.65); // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      console.warn('[form.tsx] Usando fallback de imagen en Web:', err); // Registra advertencia diagnóstica en consola sin detener la app
    } // Cierra bloque de captura catch
  } // Cierra rama del condicional if/else

  if (asset.base64) { // Evalúa condición lógica antes de ejecutar este bloque
    const mime = asset.mimeType || 'image/jpeg'; // Lee valor opcional de forma segura con respaldo por defecto
    return `data:${mime};base64,${asset.base64}`; // Devuelve resultado o detiene ejecución temprana de la función
  } // Cierra rama del condicional if/else

  return asset.uri; // Devuelve resultado o detiene ejecución temprana de la función
} // Cierra el cuerpo de la función normalizePickedAssetToUri

export default function FormScreen() { // Declara y exporta la pantalla principal FormScreen
  const { recipe, id } = useLocalSearchParams<{ // Lee los parámetros dinámicos recibidos en la URL de esta ruta
    recipe?: string; // Declara propiedad tipada "recipe?: string"
    id?: string; // Declara propiedad tipada "id?: string"
  }>(); // Especifica tipado TypeScript de retorno, parámetro o estado genérico
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDark = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isSmallScreen = width < 380; // Declara constante local isSmallScreen

  const editing: RecipeItem | null = useMemo(() => { // Declara constante local editing: RecipeItem | null
    if (!recipe) return null; // Evalúa condición lógica antes de ejecutar este bloque
    try { // Inicia bloque try para capturar posibles errores de ejecución
      return JSON.parse(recipe) as RecipeItem; // Devuelve resultado o detiene ejecución temprana de la función
    } catch { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      return null; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra bloque de captura catch
  }, [recipe]); // Cierra efecto o memoización; se re-ejecuta si cambia [recipe]

  const editingId = editing?.id ?? (id ? Number(id) : null); // Lee valor opcional de forma segura con respaldo por defecto

  const [title, setTitle] = useState(editing?.title ?? ''); // Declara estado reactivo para el título de la receta
  const [description, setDescription] = useState(editing?.description ?? ''); // Declara estado reactivo para la descripción del platillo
  const [imageUri, setImageUri] = useState<string | null>( // Declara estado reactivo para la imagen seleccionada o escrita
    editing?.image || null // Lee valor opcional de forma segura con respaldo por defecto
  ); // Cierra bloque o expresión anterior
  const [prepareTime, setPrepareTime] = useState( // Declara estado reactivo para prepare time
    editing?.prepareTime ?? '00:30:00' // Lee valor opcional de forma segura con respaldo por defecto
  ); // Cierra bloque o expresión anterior
  const [likeRate, setLikeRate] = useState(String(editing?.likeRate ?? 90)); // Declara estado reactivo para like rate
  const [category, setCategory] = useState(editing?.category ?? 'Mexicanas'); // Declara estado reactivo para la categoría gastronómica
  const [difficulty, setDifficulty] = useState(editing?.difficulty ?? 'Facil'); // Declara estado reactivo para el nivel de dificultad
  const [loadingInitial, setLoadingInitial] = useState<boolean>( // Declara estado reactivo para la carga inicial de datos en edición
    Boolean(editingId && (!editing || !editing.image)) // Convierte condición compuesta a booleano explícito
  ); // Cierra bloque o expresión anterior
  const [saving, setSaving] = useState<boolean>(false); // Declara estado reactivo para el estado de guardado en curso
  const [submitError, setSubmitError] = useState<string | null>(null); // Declara estado reactivo para el error general al enviar el formulario
  const [validationErrors, setValidationErrors] = useState< // Declara estado reactivo para los errores de validación por campo
    Record<string, string> // Especifica tipado TypeScript de retorno, parámetro o estado genérico
  >({}); // Especifica tipado TypeScript de retorno, parámetro o estado genérico

  useEffect(() => { // Registra efecto secundario para sincronizar datos o eventos
    if (!editingId) return; // Evalúa condición lógica antes de ejecutar este bloque
    let isMounted = true; // Declara variable local mutable is mounted

    (async () => { // Inicia función asíncrona autoejecutable dentro del efecto
      try { // Inicia bloque try para capturar posibles errores de ejecución
        const fresh = await getRecipe(Number(editingId)); // Obtiene del servicio el detalle completo de la receta por ID
        if (isMounted && fresh) { // Evalúa condición lógica antes de ejecutar este bloque
          setTitle(fresh.title); // Actualiza el título de la receta
          setDescription(fresh.description); // Actualiza la descripción del platillo
          setImageUri(fresh.image); // Actualiza la imagen seleccionada o escrita
          setPrepareTime(fresh.prepareTime); // Actualiza prepare time
          setLikeRate(String(fresh.likeRate)); // Actualiza like rate
          setCategory(fresh.category); // Actualiza la categoría gastronómica
          setDifficulty(fresh.difficulty); // Actualiza el nivel de dificultad
        } // Cierra rama del condicional if/else
      } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
        console.warn('[form.tsx] Usando datos iniciales de edición:', err); // Registra advertencia diagnóstica en consola sin detener la app
      } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
        if (isMounted) { // Evalúa condición lógica antes de ejecutar este bloque
          setLoadingInitial(false); // Actualiza la carga inicial de datos en edición
        } // Cierra rama del condicional if/else
      } // Cierra bloque try o finally
    })(); // Ejecuta de inmediato y cierra la función asíncrona

    return () => { // Devuelve resultado o detiene ejecución temprana de la función
      isMounted = false; // Desactiva bandera al desmontar componente para evitar actualizaciones tardías
    }; // Finaliza sentencia de retorno
  }, [editingId]); // Cierra efecto o memoización; se re-ejecuta si cambia [editingId]

  const pickImage = async () => { // Define manejador o función pickImage
    if (Platform.OS !== 'web') { // Evalúa condición lógica antes de ejecutar este bloque
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Invoca API nativa de Expo para permisos o selección de imagen
      if (status !== 'granted') { // Evalúa condición lógica antes de ejecutar este bloque
        showAlert('Permiso denegado', 'Necesitamos acceso a tus fotos'); // Muestra alerta multiplataforma informativa o de error al usuario
        return; // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else
    } // Cierra rama del condicional if/else
    const result = await ImagePicker.launchImageLibraryAsync({ // Invoca API nativa de Expo para permisos o selección de imagen
      mediaTypes: ['images'], // Define propiedad "mediaTypes" en el objeto actual
      allowsEditing: true, // Define propiedad "allowsEditing" en el objeto actual
      aspect: [4, 3], // Define propiedad "aspect" en el objeto actual
      quality: 0.5, // Define propiedad "quality" en el objeto actual
      base64: true, // Define propiedad "base64" en el objeto actual
    }); // Cierra bloque o expresión anterior

    if (!result.canceled && result.assets[0]) { // Evalúa condición lógica antes de ejecutar este bloque
      const normalizedUri = await normalizePickedAssetToUri(result.assets[0]); // Declara constante local normalizedUri
      setImageUri(normalizedUri); // Actualiza la imagen seleccionada o escrita
      setValidationErrors((prev) => { // Actualiza los errores de validación por campo
        const next = { ...prev }; // Declara constante local next
        delete next.imageUri; // Elimina la clave next.imageUri del objeto temporal
        return next; // Devuelve resultado o detiene ejecución temprana de la función
      }); // Cierra bloque o expresión anterior
    } // Cierra rama del condicional if/else
  }; // Cierra bloque o expresión anterior

  const fallbackDestination = editingId ? `/details?id=${editingId}` : '/home'; // Declara constante local fallbackDestination

  const handleSave = async () => { // Define manejador o función handleSave
    setSubmitError(null); // Actualiza el error general al enviar el formulario
    const validation = validateRecipeForm({ // Valida campos obligatorios y rangos del formulario de receta
      title, // Incluye propiedad abreviada "title" (el título de la receta) en el objeto
      description, // Incluye propiedad abreviada "description" (la descripción del platillo) en el objeto
      imageUri, // Incluye propiedad abreviada "imageUri" (la imagen seleccionada o escrita) en el objeto
      prepareTime, // Incluye propiedad abreviada "prepareTime" (prepare time) en el objeto
      likeRateInput: likeRate, // Define propiedad "likeRateInput" en el objeto actual
      category, // Incluye propiedad abreviada "category" (la categoría gastronómica) en el objeto
      difficulty, // Incluye propiedad abreviada "difficulty" (el nivel de dificultad) en el objeto
    }); // Cierra bloque o expresión anterior

    if (!validation.isValid) { // Evalúa condición lógica antes de ejecutar este bloque
      setValidationErrors(validation.fieldErrors); // Actualiza los errores de validación por campo
      const msg = validation.errorMessage || 'Revisa los datos ingresados.'; // Lee valor opcional de forma segura con respaldo por defecto
      setSubmitError(msg); // Actualiza el error general al enviar el formulario
      showAlert('Campos inválidos', msg); // Muestra alerta multiplataforma informativa o de error al usuario
      return; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    setValidationErrors({}); // Actualiza los errores de validación por campo
    const cleanUri = (imageUri || '').trim(); // Define manejador o función cleanUri
    const numericLikeRate = Math.round(Number(likeRate.trim())); // Declara constante local numericLikeRate

    const payload: RecipeFormPayload = { // Declara constante local payload: RecipeFormPayload
      title: title.trim(), // Define propiedad "title" en el objeto actual
      description: description.trim(), // Define propiedad "description" en el objeto actual
      imageUri: cleanUri, // Define propiedad "imageUri" en el objeto actual
      prepareTime: prepareTime.trim(), // Define propiedad "prepareTime" en el objeto actual
      likeRate: numericLikeRate, // Define propiedad "likeRate" en el objeto actual
      category: category.trim(), // Define propiedad "category" en el objeto actual
      difficulty: difficulty.trim(), // Define propiedad "difficulty" en el objeto actual
    }; // Cierra bloque o expresión anterior

    try { // Inicia bloque try para capturar posibles errores de ejecución
      setSaving(true); // Actualiza el estado de guardado en curso
      if (editingId) { // Evalúa condición lógica antes de ejecutar este bloque
        await updateRecipe(editingId, payload); // Envía cambios actualizados de la receta al microservicio
      } else { // Rama alternativa ejecutada cuando no se cumple el if
        await createRecipe(payload); // Envía nueva receta al microservicio para guardarla en JSON
      } // Cierra rama del condicional if/else

      safeGoBack(router, fallbackDestination); // Regresa de forma segura a la pantalla anterior o al inicio
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      const msg = // Declara constante local msg
        err instanceof Error ? err.message : 'No se pudo guardar la receta.'; // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
      setSubmitError(msg); // Actualiza el error general al enviar el formulario
      showAlert('Error al guardar', msg); // Muestra alerta multiplataforma informativa o de error al usuario
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setSaving(false); // Actualiza el estado de guardado en curso
    } // Cierra bloque try o finally
  }; // Cierra bloque o expresión anterior

  if (loadingInitial) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View // Inicia declaración de caja contenedora de diseño (layout)
        style={[ // Prop style: aplica estilos visuales al componente
          styles.keyboardWrapper, // Aplica estilo base "keyboardWrapper"
          styles.centered, // Aplica estilo base "centered"
          isDark && styles.keyboardWrapperDark, // Aplica estilo condicional "keyboardWrapperDark" cuando se cumple isDark
        ]} // Cierra lista combinada de estilos del componente
      >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
        <ActivityIndicator // Inicia declaración de indicador giratorio de carga
          size="large" // Prop size: tamaño del icono o indicador de carga
          color={isDark ? '#E74C3C' : '#C0392B'} // Prop color: color del icono o spinner
        />{/* Cierra etiqueta autocontenida de componente */}
        <Text style={[styles.placeholderText, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
          Cargando datos de la receta...{/* Texto o expresión visible dentro del componente ("Cargando datos de la receta...") */}
        </Text>{/* Cierra bloque de componente Text */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  return ( // Inicia el árbol JSX retornado por el componente
    <KeyboardAvoidingView // Inicia declaración de contenedor que evita que el teclado tape entradas
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]} // Prop style: aplica estilos visuales al componente
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Prop behavior: ajuste de teclado según plataforma (iOS/Android)
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <ScrollView // Inicia declaración de contenedor con desplazamiento vertical
        contentContainerStyle={styles.container} // Prop contentContainerStyle: estilos del contenedor interno desplazable
        keyboardShouldPersistTaps="handled" // Prop keyboardShouldPersistTaps: mantiene toques activos aunque el teclado esté abierto
      >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
        <View style={[styles.card, isDark && styles.cardDark]}>{/* Abre caja contenedora de diseño (layout) */}
          <Text style={[styles.heading, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            {editingId ? 'Editar receta' : 'Crear nueva receta'}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
          </Text>{/* Cierra bloque de componente Text */}

          {submitError && ( // Inicia bloque de renderizado condicional en JSX
            <View // Inicia declaración de caja contenedora de diseño (layout)
              style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text // Inicia declaración de componente para renderizar texto en pantalla
                style={[styles.fieldError, isDark && styles.fieldErrorDark]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                {submitError}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
              </Text>{/* Cierra bloque de componente Text */}
            </View> // Cierra bloque de componente View
          )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Título de la receta *{/* Texto o expresión visible dentro del componente ("Título de la receta *") */}
          </Text>{/* Cierra bloque de componente Text */}
          <TextInput // Inicia declaración de campo interactivo de entrada de texto
            style={[ // Prop style: aplica estilos visuales al componente
              styles.input, // Aplica estilo base "input"
              isDark && styles.inputDark, // Aplica estilo condicional "inputDark" cuando se cumple isDark
              validationErrors.title && // Evalúa condición basada en validationErrors.title && para filtrar o aplicar estilos
                (isDark ? styles.inputErrorDark : styles.inputError), // Selecciona o combina estilos condicionales para el componente
            ]} // Cierra lista combinada de estilos del componente
            placeholder="Ejemplo: Enchiladas suizas tradicionales" // Prop placeholder: texto guía mostrado cuando el campo está vacío
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
            editable={!saving} // Prop editable: indica si el campo permite edición
            value={title} // Prop value: valor actual controlado del campo
            onChangeText={setTitle} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
          />{/* Cierra etiqueta autocontenida de componente */}
          {validationErrors.title && ( // Inicia bloque de renderizado condicional en JSX
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Abre componente para renderizar texto en pantalla */}
              {validationErrors.title}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
            </Text> // Cierra bloque de componente Text
          )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Descripción y pasos de preparación *{/* Texto o expresión visible dentro del componente ("Descripción y pasos de preparación *") */}
          </Text>{/* Cierra bloque de componente Text */}
          <TextInput // Inicia declaración de campo interactivo de entrada de texto
            style={[ // Prop style: aplica estilos visuales al componente
              styles.input, // Aplica estilo base "input"
              styles.textArea, // Aplica estilo base "textArea"
              isDark && styles.inputDark, // Aplica estilo condicional "inputDark" cuando se cumple isDark
              validationErrors.description && // Evalúa condición basada en validationErrors.description && para filtrar o aplicar estilos
                (isDark ? styles.inputErrorDark : styles.inputError), // Selecciona o combina estilos condicionales para el componente
            ]} // Cierra lista combinada de estilos del componente
            placeholder="Describe los ingredientes y la preparación del platillo (mínimo 10 caracteres)..." // Prop placeholder: texto guía mostrado cuando el campo está vacío
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
            multiline // Prop booleana activa multiline: permite escribir múltiples líneas de texto
            numberOfLines={4} // Prop numberOfLines: número sugerido de líneas visibles
            editable={!saving} // Prop editable: indica si el campo permite edición
            value={description} // Prop value: valor actual controlado del campo
            onChangeText={setDescription} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
          />{/* Cierra etiqueta autocontenida de componente */}
          {validationErrors.description && ( // Inicia bloque de renderizado condicional en JSX
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Abre componente para renderizar texto en pantalla */}
              {validationErrors.description}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
            </Text> // Cierra bloque de componente Text
          )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Fotografía del platillo *{/* Texto o expresión visible dentro del componente ("Fotografía del platillo *") */}
          </Text>{/* Cierra bloque de componente Text */}
          <Pressable // Inicia declaración de área táctil personalizable
            onPress={pickImage} // Prop onPress: ejecuta acción al tocar el elemento
            disabled={saving} // Prop disabled: deshabilita interacción cuando la condición es verdadera
            style={[ // Prop style: aplica estilos visuales al componente
              styles.imagePicker, // Aplica estilo base "imagePicker"
              isDark && styles.imagePickerDark, // Aplica estilo condicional "imagePickerDark" cuando se cumple isDark
              validationErrors.imageUri && // Evalúa condición basada en validationErrors.imageUri && para filtrar o aplicar estilos
                (isDark ? styles.inputErrorDark : styles.inputError), // Selecciona o combina estilos condicionales para el componente
            ]} // Cierra lista combinada de estilos del componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            {imageUri ? ( // Si la imagen seleccionada o escrita es verdadero, renderiza esta rama en JSX
              <Image source={{ uri: imageUri }} style={styles.previewImage} /> // Renderiza componente visual para mostrar imágenes
            ) : ( // Rama alternativa del operador ternario cuando no se cumple la condición
              <View style={styles.placeholderBox}>{/* Abre caja contenedora de diseño (layout) */}
                <Text style={styles.placeholderIcon}>📷</Text>{/* Abre componente para renderizar texto en pantalla */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.placeholderText, isDark && styles.subTextDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  Toca para elegir una foto de tu galería{/* Texto o expresión visible dentro del componente ("Toca para elegir una foto de tu galería") */}
                </Text>{/* Cierra bloque de componente Text */}
              </View> // Cierra bloque de componente View
            )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
          </Pressable>{/* Cierra bloque de componente Pressable */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            O ingresa una URL de imagen:{/* Texto o expresión visible dentro del componente ("O ingresa una URL de imagen:") */}
          </Text>{/* Cierra bloque de componente Text */}
          <TextInput // Inicia declaración de campo interactivo de entrada de texto
            style={[ // Prop style: aplica estilos visuales al componente
              styles.input, // Aplica estilo base "input"
              isDark && styles.inputDark, // Aplica estilo condicional "inputDark" cuando se cumple isDark
              validationErrors.imageUri && // Evalúa condición basada en validationErrors.imageUri && para filtrar o aplicar estilos
                (isDark ? styles.inputErrorDark : styles.inputError), // Selecciona o combina estilos condicionales para el componente
            ]} // Cierra lista combinada de estilos del componente
            placeholder="https://ejemplo.com/mi-receta.jpg" // Prop placeholder: texto guía mostrado cuando el campo está vacío
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
            autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
            editable={!saving} // Prop editable: indica si el campo permite edición
            value={imageUri ?? ''} // Prop value: valor actual controlado del campo
            onChangeText={(text) => setImageUri(text)} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
          />{/* Cierra etiqueta autocontenida de componente */}
          {validationErrors.imageUri && ( // Inicia bloque de renderizado condicional en JSX
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Abre componente para renderizar texto en pantalla */}
              {validationErrors.imageUri}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
            </Text> // Cierra bloque de componente Text
          )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

          <View // Inicia declaración de caja contenedora de diseño (layout)
            style={[ // Prop style: aplica estilos visuales al componente
              styles.twoColRow, // Aplica estilo base "twoColRow"
              isSmallScreen && styles.twoColRowStacked, // Aplica estilo condicional "twoColRowStacked" cuando se cumple isSmallScreen
            ]} // Cierra lista combinada de estilos del componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <View style={styles.col}>{/* Abre caja contenedora de diseño (layout) */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                Tiempo (HH:MM:SS) *{/* Texto o expresión visible dentro del componente ("Tiempo (HH:MM:SS) *") */}
              </Text>{/* Cierra bloque de componente Text */}
              <TextInput // Inicia declaración de campo interactivo de entrada de texto
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.input, // Aplica estilo base "input"
                  isDark && styles.inputDark, // Aplica estilo condicional "inputDark" cuando se cumple isDark
                  validationErrors.prepareTime && // Evalúa condición basada en validationErrors.prepareTime && para filtrar o aplicar estilos
                    (isDark ? styles.inputErrorDark : styles.inputError), // Selecciona o combina estilos condicionales para el componente
                ]} // Cierra lista combinada de estilos del componente
                placeholder="00:45:00" // Prop placeholder: texto guía mostrado cuando el campo está vacío
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
                editable={!saving} // Prop editable: indica si el campo permite edición
                value={prepareTime} // Prop value: valor actual controlado del campo
                onChangeText={setPrepareTime} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
              />{/* Cierra etiqueta autocontenida de componente */}
              {validationErrors.prepareTime && ( // Inicia bloque de renderizado condicional en JSX
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.fieldError, isDark && styles.fieldErrorDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  {validationErrors.prepareTime}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                </Text> // Cierra bloque de componente Text
              )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
            </View>{/* Cierra bloque de componente View */}

            <View style={styles.col}>{/* Abre caja contenedora de diseño (layout) */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                Aprobación (0 - 100) *{/* Texto o expresión visible dentro del componente ("Aprobación (0 - 100) *") */}
              </Text>{/* Cierra bloque de componente Text */}
              <TextInput // Inicia declaración de campo interactivo de entrada de texto
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.input, // Aplica estilo base "input"
                  isDark && styles.inputDark, // Aplica estilo condicional "inputDark" cuando se cumple isDark
                  validationErrors.likeRate && // Evalúa condición basada en validationErrors.likeRate && para filtrar o aplicar estilos
                    (isDark ? styles.inputErrorDark : styles.inputError), // Selecciona o combina estilos condicionales para el componente
                ]} // Cierra lista combinada de estilos del componente
                placeholder="90" // Prop placeholder: texto guía mostrado cuando el campo está vacío
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
                keyboardType="numeric" // Prop keyboardType: tipo de teclado virtual mostrado al usuario
                editable={!saving} // Prop editable: indica si el campo permite edición
                value={likeRate} // Prop value: valor actual controlado del campo
                onChangeText={setLikeRate} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
              />{/* Cierra etiqueta autocontenida de componente */}
              {validationErrors.likeRate && ( // Inicia bloque de renderizado condicional en JSX
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.fieldError, isDark && styles.fieldErrorDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  {validationErrors.likeRate}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                </Text> // Cierra bloque de componente Text
              )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
            </View>{/* Cierra bloque de componente View */}
          </View>{/* Cierra bloque de componente View */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Categoría *{/* Texto o expresión visible dentro del componente ("Categoría *") */}
          </Text>{/* Cierra bloque de componente Text */}
          <View style={styles.chipsRow}>{/* Abre caja contenedora de diseño (layout) */}
            {VALID_RECIPE_CATEGORIES.map((cat) => { // Inicia iteración .map() para generar lista de componentes JSX
              const selected = category === cat; // Declara constante local selected
              return ( // Inicia el árbol JSX retornado por el componente
                <Pressable // Inicia declaración de área táctil personalizable
                  key={cat} // Asigna prop "key" al componente
                  onPress={() => setCategory(cat)} // Prop onPress: ejecuta acción al tocar el elemento
                  disabled={saving} // Prop disabled: deshabilita interacción cuando la condición es verdadera
                  style={[ // Prop style: aplica estilos visuales al componente
                    styles.chip, // Aplica estilo base "chip"
                    isDark && styles.chipDark, // Aplica estilo condicional "chipDark" cuando se cumple isDark
                    selected && styles.chipSelected, // Aplica estilo condicional "chipSelected" cuando se cumple selected
                  ]} // Cierra lista combinada de estilos del componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  <Text // Inicia declaración de componente para renderizar texto en pantalla
                    style={[ // Prop style: aplica estilos visuales al componente
                      styles.chipText, // Aplica estilo base "chipText"
                      isDark && styles.chipTextDark, // Aplica estilo condicional "chipTextDark" cuando se cumple isDark
                      selected && styles.chipTextSelected, // Aplica estilo condicional "chipTextSelected" cuando se cumple selected
                    ]} // Cierra lista combinada de estilos del componente
                  >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                    {cat}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                  </Text>{/* Cierra bloque de componente Text */}
                </Pressable> // Cierra bloque de componente Pressable
              ); // Finaliza sentencia de retorno
            })}{/* Texto o expresión visible dentro del componente ("})}") */}
          </View>{/* Cierra bloque de componente View */}
          {validationErrors.category && ( // Inicia bloque de renderizado condicional en JSX
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Abre componente para renderizar texto en pantalla */}
              {validationErrors.category}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
            </Text> // Cierra bloque de componente Text
          )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Dificultad *{/* Texto o expresión visible dentro del componente ("Dificultad *") */}
          </Text>{/* Cierra bloque de componente Text */}
          <View style={styles.chipsRow}>{/* Abre caja contenedora de diseño (layout) */}
            {VALID_RECIPE_DIFFICULTIES.map((diff) => { // Inicia iteración .map() para generar lista de componentes JSX
              const selected = difficulty === diff; // Declara constante local selected
              return ( // Inicia el árbol JSX retornado por el componente
                <Pressable // Inicia declaración de área táctil personalizable
                  key={diff} // Asigna prop "key" al componente
                  onPress={() => setDifficulty(diff)} // Prop onPress: ejecuta acción al tocar el elemento
                  disabled={saving} // Prop disabled: deshabilita interacción cuando la condición es verdadera
                  style={[ // Prop style: aplica estilos visuales al componente
                    styles.chip, // Aplica estilo base "chip"
                    isDark && styles.chipDark, // Aplica estilo condicional "chipDark" cuando se cumple isDark
                    selected && styles.chipSelectedSecondary, // Aplica estilo condicional "chipSelectedSecondary" cuando se cumple selected
                  ]} // Cierra lista combinada de estilos del componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  <Text // Inicia declaración de componente para renderizar texto en pantalla
                    style={[ // Prop style: aplica estilos visuales al componente
                      styles.chipText, // Aplica estilo base "chipText"
                      isDark && styles.chipTextDark, // Aplica estilo condicional "chipTextDark" cuando se cumple isDark
                      selected && styles.chipTextSelected, // Aplica estilo condicional "chipTextSelected" cuando se cumple selected
                    ]} // Cierra lista combinada de estilos del componente
                  >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                    {diff}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                  </Text>{/* Cierra bloque de componente Text */}
                </Pressable> // Cierra bloque de componente Pressable
              ); // Finaliza sentencia de retorno
            })}{/* Texto o expresión visible dentro del componente ("})}") */}
          </View>{/* Cierra bloque de componente View */}
          {validationErrors.difficulty && ( // Inicia bloque de renderizado condicional en JSX
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>{/* Abre componente para renderizar texto en pantalla */}
              {validationErrors.difficulty}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
            </Text> // Cierra bloque de componente Text
          )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

          <View style={styles.actionsRow}>{/* Abre caja contenedora de diseño (layout) */}
            <Pressable // Inicia declaración de área táctil personalizable
              onPress={() => safeGoBack(router, fallbackDestination)} // Regresa de forma segura a la pantalla anterior o al inicio
              disabled={saving} // Prop disabled: deshabilita interacción cuando la condición es verdadera
              style={[styles.cancelButton, saving && styles.buttonDisabled]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={styles.cancelButtonText}>Cancelar</Text>{/* Abre componente para renderizar texto en pantalla */}
            </Pressable>{/* Cierra bloque de componente Pressable */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleSave} // Prop onPress: ejecuta acción al tocar el elemento
              disabled={saving} // Prop disabled: deshabilita interacción cuando la condición es verdadera
              style={[styles.saveButton, saving && styles.buttonDisabled]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              {saving ? ( // Si el estado de guardado en curso es verdadero, renderiza esta rama en JSX
                <ActivityIndicator color="#FFFFFF" /> // Renderiza indicador giratorio de carga
              ) : ( // Rama alternativa del operador ternario cuando no se cumple la condición
                <Text style={styles.buttonText}>{/* Abre componente para renderizar texto en pantalla */}
                  {editingId ? 'Actualizar receta' : 'Guardar receta'}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                </Text> // Cierra bloque de componente Text
              )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
            </Pressable>{/* Cierra bloque de componente Pressable */}
          </View>{/* Cierra bloque de componente View */}
        </View>{/* Cierra bloque de componente View */}
      </ScrollView>{/* Cierra bloque de componente ScrollView */}
    </KeyboardAvoidingView> // Cierra bloque de componente KeyboardAvoidingView
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función FormScreen

const styles = StyleSheet.create({ // Inicia definición optimizada de estilos visuales con StyleSheet.create
  keyboardWrapper: { // Define grupo de estilos para "keyboardWrapper"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    backgroundColor: '#FAF7F5', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  keyboardWrapperDark: { // Define grupo de estilos para "keyboardWrapperDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  centered: { // Define grupo de estilos para "centered"
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    gap: 12, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  errorBanner: { // Define grupo de estilos para "errorBanner"
    backgroundColor: '#FDEDEC', // Estilo backgroundColor: color de fondo
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    padding: 10, // Estilo padding: espaciado interno en los cuatro lados
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#F5B7B1', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  errorBannerDark: { // Define grupo de estilos para "errorBannerDark"
    backgroundColor: '#3A1F1E', // Estilo backgroundColor: color de fondo
    borderColor: '#78281F', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  container: { // Define grupo de estilos para "container"
    padding: 16, // Estilo padding: espaciado interno en los cuatro lados
    maxWidth: 860, // Estilo maxWidth: ancho máximo permitido
    width: '100%', // Estilo width: ancho fijo o porcentual
    alignSelf: 'center', // Estilo alignSelf: anula alineación propia dentro del padre
  }, // Cierra objeto literal
  card: { // Define grupo de estilos para "card"
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
    borderRadius: 14, // Estilo borderRadius: redondeo de esquinas
    padding: 20, // Estilo padding: espaciado interno en los cuatro lados
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
    }), // Cierra objeto de "card"
  }, // Cierra objeto literal
  cardDark: { // Define grupo de estilos para "cardDark"
    backgroundColor: '#241D1B', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  heading: { // Define grupo de estilos para "heading"
    fontSize: 22, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
    marginBottom: 8, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  textDark: { // Define grupo de estilos para "textDark"
    color: '#F7F2F0', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  subTextDark: { // Define grupo de estilos para "subTextDark"
    color: '#B8A9A4', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  label: { // Define grupo de estilos para "label"
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    marginBottom: 6, // Estilo marginBottom: margen externo inferior
    marginTop: 12, // Estilo marginTop: margen externo superior
    color: '#333333', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  input: { // Define grupo de estilos para "input"
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#CCCCCC', // Estilo borderColor: color del borde
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    padding: 12, // Estilo padding: espaciado interno en los cuatro lados
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    backgroundColor: '#FAFAFA', // Estilo backgroundColor: color de fondo
    color: '#2C1E1B', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  inputDark: { // Define grupo de estilos para "inputDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
    color: '#F7F2F0', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  inputError: { // Define grupo de estilos para "inputError"
    borderColor: '#C0392B', // Estilo borderColor: color del borde
    backgroundColor: '#FFF9F9', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  inputErrorDark: { // Define grupo de estilos para "inputErrorDark"
    borderColor: '#E74C3C', // Estilo borderColor: color del borde
    backgroundColor: '#2C1918', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  textArea: { // Define grupo de estilos para "textArea"
    minHeight: 100, // Estilo minHeight: altura mínima garantizada
    textAlignVertical: 'top', // Define color de paleta temática (textAlignVertical)
  }, // Cierra objeto literal
  fieldError: { // Define grupo de estilos para "fieldError"
    color: '#C0392B', // Estilo color: color de texto o icono
    fontSize: 12, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    marginTop: 4, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  fieldErrorDark: { // Define grupo de estilos para "fieldErrorDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  imagePicker: { // Define grupo de estilos para "imagePicker"
    borderWidth: 2, // Estilo borderWidth: grosor del borde
    borderColor: '#CCCCCC', // Estilo borderColor: color del borde
    borderStyle: 'dashed', // Define propiedad "borderStyle" en el objeto actual
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    height: 200, // Estilo height: alto fijo o porcentual
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    overflow: 'hidden', // Estilo overflow: comportamiento si el contenido desborda
    backgroundColor: '#FAFAFA', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  imagePickerDark: { // Define grupo de estilos para "imagePickerDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
    borderColor: '#4A3833', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  previewImage: { // Define grupo de estilos para "previewImage"
    width: '100%', // Estilo width: ancho fijo o porcentual
    height: '100%', // Estilo height: alto fijo o porcentual
    resizeMode: 'cover', // Define propiedad "resizeMode" en el objeto actual
  }, // Cierra objeto literal
  placeholderBox: { // Define grupo de estilos para "placeholderBox"
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    padding: 16, // Estilo padding: espaciado interno en los cuatro lados
  }, // Cierra objeto literal
  placeholderIcon: { // Define grupo de estilos para "placeholderIcon"
    fontSize: 36, // Estilo fontSize: tamaño de fuente en píxeles
    marginBottom: 8, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  placeholderText: { // Define grupo de estilos para "placeholderText"
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#666666', // Estilo color: color de texto o icono
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    textAlign: 'center', // Estilo textAlign: alineación horizontal del texto
  }, // Cierra objeto literal
  twoColRow: { // Define grupo de estilos para "twoColRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    gap: 12, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  twoColRowStacked: { // Define grupo de estilos para "twoColRowStacked"
    flexDirection: 'column', // Estilo flexDirection: define dirección del eje principal (fila o columna)
  }, // Cierra objeto literal
  col: { // Define grupo de estilos para "col"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
  }, // Cierra objeto literal
  chipsRow: { // Define grupo de estilos para "chipsRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    flexWrap: 'wrap', // Estilo flexWrap: permite saltar a nueva línea si no cabe
    gap: 8, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  chip: { // Define grupo de estilos para "chip"
    paddingHorizontal: 14, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 8, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 18, // Estilo borderRadius: redondeo de esquinas
    backgroundColor: '#F3ECE9', // Estilo backgroundColor: color de fondo
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#E2D6D1', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  chipDark: { // Define grupo de estilos para "chipDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  chipSelected: { // Define grupo de estilos para "chipSelected"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    borderColor: '#C0392B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  chipSelectedSecondary: { // Define grupo de estilos para "chipSelectedSecondary"
    backgroundColor: '#27AE60', // Estilo backgroundColor: color de fondo
    borderColor: '#27AE60', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  chipText: { // Define grupo de estilos para "chipText"
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    color: '#4A3833', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  chipTextDark: { // Define grupo de estilos para "chipTextDark"
    color: '#B8A9A4', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  chipTextSelected: { // Define grupo de estilos para "chipTextSelected"
    color: '#FFFFFF', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  actionsRow: { // Define grupo de estilos para "actionsRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    gap: 12, // Estilo gap: espacio uniforme entre elementos hijos
    marginTop: 24, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  cancelButton: { // Define grupo de estilos para "cancelButton"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    backgroundColor: '#753333', // Estilo backgroundColor: color de fondo
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
  }, // Cierra objeto literal
  cancelButtonText: { // Define grupo de estilos para "cancelButtonText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  saveButton: { // Define grupo de estilos para "saveButton"
    flex: 2, // Estilo flex: ocupa espacio proporcional disponible
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
  }, // Cierra objeto literal
  buttonDisabled: { // Define grupo de estilos para "buttonDisabled"
    opacity: 0.6, // Estilo opacity: nivel de transparencia
  }, // Cierra objeto literal
  buttonText: { // Define grupo de estilos para "buttonText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
}); // Cierra bloque o expresión anterior
