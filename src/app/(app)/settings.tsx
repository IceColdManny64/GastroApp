import { useFocusEffect, useRouter } from 'expo-router'; // Importa hooks de Expo Router: useFocusEffect re-ejecuta lógica al enfocar la pestaña y useRouter navega tras cerrar sesión
import { useCallback, useState } from 'react'; // Importa useCallback para memorizar la carga de preferencias y useState para controlar formularios y banners
import { // Inicia importación de componentes visuales y APIs responsivas de React Native
  ActivityIndicator, // Indicador giratorio usado mientras cargan las preferencias o se envían credenciales al servidor
  KeyboardAvoidingView, // Contenedor que ajusta el desplazamiento vertical cuando el teclado móvil cubre los inputs de contraseña
  Platform, // API para distinguir iOS, Android o Web en el comportamiento del teclado y cálculo de sombras
  Pressable, // Botón táctil reutilizado para chips de preferencias, guardar credenciales, restablecer caché y salir
  ScrollView, // Permite desplazar verticalmente todas las tarjetas de ajustes en pantallas pequeñas
  StyleSheet, // Compila la hoja de estilos de tarjetas, chips, banners y cuadrícula responsiva
  Switch, // Interruptor nativo para activar o desactivar al instante el modo de tarjetas compactas
  Text, // Renderiza encabezados de sección, etiquetas de formularios, textos auxiliares y mensajes de estado
  TextInput, // Campo de entrada para contraseña actual, nuevo correo y contraseña nueva opcional
  View, // Contenedor base para organizar filas de opciones, tarjetas, banners y layout de dos columnas
  useWindowDimensions, // Hook reactivo que entrega ancho y alto actuales de ventana para activar la vista ancha
} from 'react-native'; // Cierra importaciones de React Native necesarias para la pantalla de ajustes
import { // Importa servicios HTTP/híbridos de gestión del usuario autenticado
  getUserProfile, // Consulta el perfil remoto (GET /users/:id) para sincronizar el correo más reciente
  updateCredentials, // Envía actualización de correo y/o contraseña (PATCH /users/:id)
  verifyPassword, // Valida con el servidor o respaldo local la contraseña actual antes de permitir cambios
} from '@/services/user'; // Cierra importaciones del módulo de servicio de usuario
import { PageSizeOption, UserSession, UserSettings } from '@/types/Auth'; // Importa tipos de paginación permitida (10|20|30), sesión activa y preferencias del usuario
import { RECIPE_CATEGORIES, RecipeCategory } from '@/types/RecipeItem'; // Importa catálogo fijo de categorías de GastroLab para seleccionar el filtro inicial por defecto
import { showAlert } from '@/utils/alerts'; // Helper multiplataforma para mostrar alertas nativas o window.alert en Web
import { // Importa helpers de persistencia local de preferencias y tema global
  DEFAULT_USER_SETTINGS, // Objeto base usado mientras termina la lectura asíncrona de AsyncStorage/localStorage
  getUserSettings, // Lee preferencias guardadas del usuario (tamaño de página, categoría, tema y modo compacto)
  resetLocalRecipeChanges, // Limpia altas/ediciones/borrados cacheados localmente para recargar recipes.json limpio
  saveUserSettings, // Persiste en almacenamiento local las preferencias actualizadas y notifica a useThemeMode
  useThemeMode, // Hook suscrito en tiempo real al tema claro u oscuro elegido por el usuario
} from '@/utils/preferencesStorage'; // Cierra importaciones de utilidades de preferencias
import { // Importa utilidades de almacenamiento seguro de sesión y token
  deleteToken, // Borra token JWT y sesión guardada al pulsar "Cerrar sesión"
  getUserSession, // Recupera id y correo del usuario autenticado almacenados localmente
  saveUserSession, // Actualiza la sesión local cuando el usuario cambia su correo electrónico
} from '@/utils/tokenStorage'; // Cierra importaciones de utilidades de sesión
import { validateCredentialsForm } from '@/utils/validators'; // Función pura que valida formato de correo, contraseña actual obligatoria y longitud mínima

const PAGE_SIZES: PageSizeOption[] = [10, 20, 30]; // Opciones de paginación ofrecidas al usuario para mostrar en el catálogo principal

export default function SettingsScreen() { // Pantalla de configuración de catálogo, apariencia, credenciales y cierre de sesión
  const router = useRouter(); // Controlador de navegación para redirigir al login tras cerrar sesión
  const isDarkTheme = useThemeMode(); // Estado reactivo del tema global oscuro obtenido desde preferencesStorage
  const { width, height } = useWindowDimensions(); // Dimensiones vivas de la ventana para adaptar el layout en tabletas o Web
  const isWideLayout = width >= 820 || (width > height && width >= 680); // Activa cuadrícula de dos columnas en pantallas anchas (>=820px) o modo horizontal (>=680px)

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS); // Preferencias actuales mostradas y modificables en pantalla
  const [session, setSession] = useState<UserSession | null>(null); // Datos de sesión activa (id y email) necesarios para actualizar credenciales
  const [loading, setLoading] = useState<boolean>(true); // Bandera que muestra el spinner inicial hasta hidratar ajustes y sesión

  const [currentPassword, setCurrentPassword] = useState(''); // Entrada obligatoria de contraseña actual para verificar identidad antes de modificar cuenta
  const [newEmail, setNewEmail] = useState(''); // Entrada del nuevo correo electrónico (precargada con el correo actual de la sesión)
  const [newPassword, setNewPassword] = useState(''); // Entrada opcional de nueva contraseña; si queda vacía se conserva la actual
  const [updatingCredentials, setUpdatingCredentials] = useState(false); // Bloquea inputs y botón mientras se verifican y guardan credenciales
  const [credentialsMessage, setCredentialsMessage] = useState<string | null>( // Banner informativo verde con confirmación al guardar credenciales
    null // Inicia sin mensaje de éxito visible hasta completar una actualización
  ); // Fin de declaración del estado credentialsMessage
  const [credentialsError, setCredentialsError] = useState<string | null>(null); // Banner rojo con el detalle de validación o rechazo al intentar actualizar cuenta

  useFocusEffect( // Recarga preferencias y perfil cada vez que el usuario entra a la pestaña Ajustes
    useCallback(() => { // Envuelve el efecto en useCallback requerido por useFocusEffect para evitar re-suscripciones
      let isActive = true; // Bandera de seguridad que evita actualizar estados si el usuario abandona la pestaña antes de finalizar

      (async () => { // IIFE asíncrona para ejecutar carga paralela desde almacenamiento local y consulta remota
        try { // Protege el apagado del spinner en el bloque finally ante cualquier falla
          const [storedSettings, storedSession] = await Promise.all([ // Lee en paralelo preferencias y sesión guardadas localmente
            getUserSettings(), // Recupera tamaño de página, categoría inicial, tema y tarjetas compactas
            getUserSession(), // Recupera id y email de la sesión autenticada actual
          ]); // Espera a que ambas lecturas locales resuelvan

          if (isActive) { // Solo hidrata UI si la pantalla sigue enfocada tras la lectura local
            setSettings(storedSettings); // Sincroniza los chips y el interruptor Switch con las preferencias guardadas
            setSession(storedSession); // Guarda la sesión local para mostrar cuenta activa y habilitar cambios de credenciales
            if (storedSession?.email) { // Si existe correo en sesión local, lo precarga en el campo del formulario
              setNewEmail(storedSession.email); // Rellena el input de correo con el valor vigente mientras consulta el servidor
            } // Fin de precarga de correo desde sesión
          } // Fin de actualización inicial de estado cuando el foco está activo

          if (storedSession?.id) { // Si hay un identificador numérico de usuario, intenta sincronizar el email desde json-server
            try { // Aísla fallos de red para no romper la pantalla si el servidor está apagado
              const profile = await getUserProfile(storedSession.id); // Solicita GET /users/:id para obtener el email oficial del servidor
              if (isActive && profile?.email) { // Si la pestaña sigue montada y llegó un correo válido del servidor
                setNewEmail(profile.email); // Actualiza el campo de correo con el dato más reciente de users.json
                setSession((prev) => // Actualiza también el correo guardado en el estado de sesión en memoria
                  prev ? { ...prev, email: profile.email } : prev // Copia la sesión previa reemplazando únicamente email
                ); // Finaliza setSession funcional
              } // Fin de sincronización exitosa de perfil remoto
            } catch (profileErr) { // Si json-server no responde (modo offline), mantiene el email de sesión local
              console.warn( // Registra advertencia diagnóstica en consola sin mostrar error intrusivo al usuario
                '[settings.tsx] Usando email de sesión local:', // Prefijo estándar de diagnóstico para rastrear degradación offline
                profileErr // Error capturado al consultar perfil remoto
              ); // Cierra console.warn
            } // Fin del manejo offline de perfil
          } // Fin de consulta condicional de perfil remoto
        } finally { // Garantiza ocultar el ActivityIndicator aunque falle alguna lectura
          if (isActive) setLoading(false); // Libera la vista principal cuando la pantalla sigue activa
        } // Fin de bloque try/finally de hidratación
      })(); // Ejecuta inmediatamente la función asíncrona de enfoque

      return () => { // Limpieza ejecutada al perder el foco o desmontar la pantalla
        isActive = false; // Cancela cualquier setState pendiente tras salir de Ajustes
      }; // Fin de función de limpieza de useFocusEffect
    }, []) // Sin dependencias reactivas porque cada enfoque re-ejecuta la sincronización
  ); // Fin de registro de useFocusEffect

  const handleUpdateSetting = async (partial: Partial<UserSettings>) => { // Aplica cambios parciales en preferencias y los guarda al instante sin botón "Guardar"
    const nextSettings: UserSettings = { // Construye el nuevo objeto completo combinando el estado previo con la propiedad cambiada
      ...settings, // Conserva el resto de preferencias actuales (paginación, categoría, tema o compacto)
      ...partial, // Sobrescribe únicamente la preferencia tocada por el usuario
    }; // Cierra el nuevo objeto UserSettings
    setSettings(nextSettings); // Refleja el cambio de inmediato en la UI (chips, tema y Switch)
    await saveUserSettings(nextSettings); // Guarda en AsyncStorage/localStorage y dispara listeners de tema
  }; // Fin de handleUpdateSetting

  const handleUpdateCredentials = async () => { // Flujo completo: valida formulario, verifica contraseña actual, actualiza cuenta y refresca sesión
    setCredentialsError(null); // Limpia mensajes de error de un intento previo antes de revalidar
    setCredentialsMessage(null); // Limpia mensajes de éxito previos antes de iniciar nueva petición

    if (!session?.id) { // Impide actualizar si falta el id de usuario en la sesión almacenada
      setCredentialsError( // Muestra banner rojo indicando que debe volver a autenticarse
        'No se encontró el identificador de tu sesión. Inicia sesión nuevamente.' // Mensaje explicativo cuando no hay id en sesión
      ); // Cierra mensaje de error por sesión incompleta
      return; // Aborta sin llamar al servicio de usuario
    } // Fin de guardia por falta de session.id

    const effectiveNewPassword = // Si el usuario dejó vacía la nueva contraseña, conserva la contraseña actual
      newPassword.trim().length > 0 ? newPassword : currentPassword; // Garantiza que PATCH /users/:id no sobrescriba la contraseña con cadena vacía

    const validation = validateCredentialsForm( // Valida en cliente contraseña actual, formato de correo y longitud de nueva contraseña
      currentPassword, // Contraseña actual obligatoria para autorizar la operación
      newEmail, // Nuevo correo electrónico ingresado (no puede quedar vacío ni ser inválido)
      effectiveNewPassword // Contraseña nueva (o la actual si solo se cambia el correo)
    ); // Recibe { isValid, errorMessage }
    if (!validation.isValid) { // Si alguna regla local de validación no se cumple
      const msg = validation.errorMessage || 'Verifica los campos ingresados.'; // Usa el mensaje específico del validador o uno genérico de respaldo
      setCredentialsError(msg); // Muestra el error en el banner dentro de la tarjeta
      showAlert('Datos inválidos', msg); // Refuerza retroalimentación con alerta nativa o diálogo web
      return; // Detiene el flujo antes de contactar al servidor
    } // Fin de validación local de credenciales

    try { // Ejecuta verificación de contraseña actual y actualización remota/local
      setUpdatingCredentials(true); // Activa spinner en el botón y deshabilita los campos del formulario
      const passwordCheck = await verifyPassword(session.id, currentPassword); // Comprueba contra POST /auth/verify-password que la contraseña actual sea correcta
      if (!passwordCheck.valid) { // Si la contraseña actual ingresada no coincide con la registrada
        const invalidMsg = // Construye mensaje de rechazo usando respuesta del servidor si existe
          passwordCheck.message || 'La contraseña actual es incorrecta.'; // Texto de respaldo cuando el servidor no envía detalle
        setCredentialsError(invalidMsg); // Pinta banner rojo con el motivo del rechazo
        showAlert('Contraseña incorrecta', invalidMsg); // Alerta al usuario para que corrija su contraseña actual
        return; // Aborta antes de ejecutar updateCredentials
      } // Fin de verificación de contraseña actual

      const updateResult = await updateCredentials( // Envía el nuevo correo y contraseña al backend para actualizar users.json
        session.id, // ID del usuario autenticado cuya cuenta se va a modificar
        newEmail, // Nuevo correo electrónico validado
        effectiveNewPassword // Nueva contraseña o la actual conservada
      ); // Espera confirmación { id, email, message }

      const updatedSession: UserSession = { // Prepara el objeto sesión actualizado con el nuevo correo limpio
        ...session, // Conserva id y demás metadatos de sesión existentes
        email: newEmail.trim(), // Refleja inmediatamente el correo actualizado en la sesión local
      }; // Cierra objeto updatedSession
      await saveUserSession(updatedSession); // Persiste la sesión actualizada para mantener consistencia al recargar la app
      setSession(updatedSession); // Actualiza la etiqueta "Cuenta activa" mostrada en la tarjeta
      setCurrentPassword(''); // Limpia campo de contraseña actual por seguridad tras confirmar cambio
      setNewPassword(''); // Limpia campo de nueva contraseña por seguridad al completar operación

      const successMsg = // Toma el mensaje de confirmación devuelto por el servidor
        updateResult.message || 'Credenciales actualizadas correctamente'; // Mensaje por defecto si el servidor omitió texto
      setCredentialsMessage(successMsg); // Muestra el banner verde de confirmación bajo el subtítulo
      showAlert('Éxito', successMsg); // Muestra confirmación adicional en alerta nativa/web
    } catch (err) { // Captura errores de red, duplicidad de correo o respuesta HTTP no exitosa
      const msg = // Extrae un mensaje legible según si err es instancia de Error
        err instanceof Error // Comprueba si la excepción es un Error estándar con mensaje
          ? err.message // Muestra el detalle exacto enviado por user.ts o el servidor
          : 'No se pudieron actualizar las credenciales.'; // Mensaje genérico de respaldo ante errores no tipados
      setCredentialsError(msg); // Muestra el error capturado en el banner rojo
      showAlert('Error', msg); // Presenta el fallo también en alerta modal
    } finally { // Se ejecuta siempre al concluir try o catch
      setUpdatingCredentials(false); // Reactiva inputs y restaura el texto del botón "Actualizar credenciales"
    } // Fin de try/catch/finally de actualización de credenciales
  }; // Fin de handleUpdateCredentials

  const handleResetLocalData = async () => { // Botón de mantenimiento: borra overrides locales de recetas para recargar datos limpios
    await resetLocalRecipeChanges(); // Elimina cambios locales acumulados en caché sin borrar preferencias ni sesión
    showAlert( // Informa al usuario que el respaldo local de recetas fue limpiado
      'Caché restablecida', // Título de la alerta de confirmación
      'Se restableció el respaldo local. Si el servidor JSON está activo, se cargarán los registros actuales de recipes.json.' // Explicación de recarga desde servidor
    ); // Cierra showAlert
  }; // Fin de handleResetLocalData

  const handleLogout = async () => { // Cierra la sesión activa y devuelve al usuario a la pantalla de inicio de sesión
    await deleteToken(); // Limpia token JWT y sesión guardados en SecureStore/localStorage
    router.replace('/(auth)/login'); // Reemplaza la pila de navegación para impedir volver atrás con el botón Back
  }; // Fin de handleLogout

  const isDark = isDarkTheme || settings.themeMode === 'dark'; // Combina el tema reactivo global con la preferencia local de esta pantalla

  if (loading) { // Muestra pantalla de carga centrada mientras AsyncStorage lee preferencias y sesión
    return ( // Retorna indicador centrado adaptado al tema claro u oscuro
      <View style={[styles.centered, isDark && styles.centeredDark]}> {/* Contenedor centrado para el estado de carga inicial */}
        <ActivityIndicator // Renderiza spinner de carga centrado mientras llegan los datos locales
          size="large" // Usa tamaño grande para destacar el progreso de carga inicial
          color={isDark ? '#E74C3C' : '#333333'} // Adapta el color del spinner al contraste del fondo claro u oscuro
        /> {/* Cierra ActivityIndicator de carga inicial */}
      </View> // Fin de pantalla de carga
    ); // Fin del return temprano cuando loading es true
  } // Fin de guardia if (loading)

  return ( // Renderiza la vista principal de Ajustes dividida en preferencias, seguridad y acciones
    <KeyboardAvoidingView // Evita que el teclado oculte los inputs de cambio de credenciales en iOS
      style={[styles.screen, isDark && styles.screenDark]} // Aplica fondo base cálido o negro carbón según el tema activo
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Solo aplica padding en iOS donde el teclado flota sobre el ScrollView
    > {/* Abre cuerpo de KeyboardAvoidingView */}
      <ScrollView // Contenedor desplazable para recorrer todas las tarjetas en pantallas verticales
        contentContainerStyle={[ // Define padding interior, ancho máximo y centrado del contenido
          styles.container, // Ancho máximo estándar (720px) para lectura cómoda en móvil
          isWideLayout && styles.containerWide, // Amplía ancho máximo a 1120px en tabletas o Web para acomodar dos columnas
        ]} // Cierra estilos del contenido desplazable
        keyboardShouldPersistTaps="handled" // Permite tocar botones directamente sin cerrar primero el teclado
      > {/* Abre ScrollView principal */}
        <View style={isWideLayout ? styles.wideGrid : undefined}> {/* En escritorio/tablet coloca preferencias y seguridad lado a lado */}
          <View // Tarjeta izquierda: Preferencias de Visualización y Catálogo
            style={[ // Combina tarjeta base, variante oscura y flex mitad cuando hay dos columnas
              styles.card, // Fondo blanco, bordes redondeados y sombra suave
              isDark && styles.cardDark, // Fondo oscuro #241D1B y borde sutil en modo nocturno
              isWideLayout && styles.cardHalf, // Ocupa 50% del ancho de wideGrid en pantallas anchas
            ]} // Cierra estilos de la tarjeta de preferencias
          > {/* Abre contenido de la tarjeta de preferencias */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}> {/* Título de sección para las preferencias visuales */}
              Preferencias de Visualización y Catálogo
            </Text> {/* Cierra título de sección de preferencias */}

            <Text style={[styles.label, isDark && styles.textDark]}> {/* Etiqueta para elegir cuántas recetas mostrar por página */}
              Recetas por página por defecto:
            </Text> {/* Cierra etiqueta de tamaño de página */}
            <View style={styles.optionsRow}> {/* Fila envolvente para los chips de 10, 20 y 30 recetas */}
              {PAGE_SIZES.map((size) => { // Genera un chip seleccionable por cada tamaño permitido en PAGE_SIZES
                const selected = settings.itemsPerPage === size; // Determina si este chip coincide con la paginación guardada
                return ( // Retorna el botón tipo chip con estilo activo o inactivo
                  <Pressable // Botón seleccionable para fijar itemsPerPage por defecto
                    key={size} // Clave única numérica requerida por React en listas mapeadas
                    onPress={() => handleUpdateSetting({ itemsPerPage: size })} // Guarda el nuevo tamaño de página al instante
                    style={[ // Estiliza el chip considerando tema oscuro y estado seleccionado
                      styles.optionButton, // Base redondeada tipo píldora para chips de opción
                      isDark && styles.optionButtonDark, // Fondo y borde oscuros para chips inactivos en modo nocturno
                      selected && styles.optionButtonSelected, // Resalta en rojo GastroLab (#C0392B) cuando es la opción activa
                    ]} // Cierra arreglo de estilos del chip de paginación
                  > {/* Abre contenido del chip de paginación */}
                    <Text // Texto de la cantidad de recetas por página
                      style={[ // Adapta color de texto según tema oscuro y si está seleccionado
                        styles.optionText, // Tipografía semibold de tamaño 13px
                        isDark && styles.subTextDark, // Texto gris cálido en modo oscuro para contraste legible
                        selected && styles.optionTextSelected, // Texto blanco puro sobre fondo rojo cuando está activo
                      ]} // Cierra estilos del texto del chip
                    > {/* Abre texto del chip de paginación */}
                      {size} recetas
                    </Text> {/* Cierra etiqueta de cantidad de recetas */}
                  </Pressable> // Cierra botón chip de paginación
                ); // Fin del retorno del chip en PAGE_SIZES.map
              })} {/* Termina renderizado de opciones de recetas por página */}
            </View> {/* Cierra fila de chips de tamaño de página */}

            <Text style={[styles.label, isDark && styles.textDark]}> {/* Etiqueta para la categoría inicial al abrir Home */}
              Categoría inicial predeterminada:
            </Text> {/* Cierra etiqueta de categoría predeterminada */}
            <View style={styles.optionsRow}> {/* Fila de chips para elegir entre Todas, Postres, Carnes, Pastas, etc. */}
              {RECIPE_CATEGORIES.map((category: RecipeCategory) => { // Recorre el catálogo fijo de categorías de GastroLab
                const selected = settings.defaultCategory === category; // Comprueba si esta categoría es la predeterminada actual
                return ( // Retorna chip presionable para cambiar defaultCategory
                  <Pressable // Botón para seleccionar qué categoría se filtra al entrar al catálogo
                    key={category} // Identificador único de la categoría para reconciliación de React
                    onPress={() => // Dispara actualización inmediata al tocar el chip
                      handleUpdateSetting({ defaultCategory: category }) // Persiste la categoría inicial elegida
                    } // Cierra manejador onPress de categoría
                    style={[ // Combina estilos base, modo oscuro y estado activo
                      styles.optionButton, // Chip redondeado base
                      isDark && styles.optionButtonDark, // Chip oscuro en modo nocturno
                      selected && styles.optionButtonSelected, // Marca en rojo la categoría inicial seleccionada
                    ]} // Cierra estilos del chip de categoría
                  > {/* Abre texto interior del chip de categoría */}
                    <Text // Nombre visible de la categoría culinaria
                      style={[ // Ajusta color según estado seleccionado y tema
                        styles.optionText, // Fuente base del chip
                        isDark && styles.subTextDark, // Texto claro secundario en modo oscuro
                        selected && styles.optionTextSelected, // Blanco sobre rojo cuando esta categoría está elegida
                      ]} // Cierra estilo del texto del chip
                    > {/* Abre contenido de texto de categoría */}
                      {category}
                    </Text> {/* Cierra nombre de categoría */}
                  </Pressable> // Cierra chip de categoría predeterminada
                ); // Fin del retorno del chip en RECIPE_CATEGORIES.map
              })} {/* Termina mapeo de chips de categoría inicial */}
            </View> {/* Cierra contenedor de chips de categoría */}

            <Text style={[styles.label, isDark && styles.textDark]}> {/* Etiqueta para elegir entre tema claro y oscuro */}
              Tema de la interfaz:
            </Text> {/* Cierra etiqueta de selector de tema */}
            <View style={styles.optionsRow}> {/* Contenedor horizontal con los dos botones de tema */}
              <Pressable // Botón para activar el tema claro ('light')
                onPress={() => handleUpdateSetting({ themeMode: 'light' })} // Cambia temaMode a 'light' y notifica a toda la app
                style={[ // Resalta el botón cuando el tema claro está activo
                  styles.optionButton, // Estilo base de chip
                  isDark && styles.optionButtonDark, // Estilo oscuro mientras la app esté en modo nocturno
                  settings.themeMode === 'light' && styles.optionButtonSelected, // Resaltado rojo cuando el usuario seleccionó modo claro
                ]} // Cierra arreglo de estilos del botón Claro
              > {/* Abre contenido del botón de tema claro */}
                <Text // Etiqueta visual del botón Claro
                  style={[ // Ajusta contraste según tema global y selección activa
                    styles.optionText, // Estilo de texto de chip
                    isDark && styles.subTextDark, // Gris cálido cuando el fondo global está en oscuro
                    settings.themeMode === 'light' && styles.optionTextSelected, // Texto blanco sobre rojo cuando Claro está seleccionado
                  ]} // Cierra estilos del texto Claro
                > {/* Abre etiqueta visible del botón Claro */}
                  ☀️ Claro
                </Text> {/* Cierra etiqueta Claro */}
              </Pressable> {/* Cierra botón de tema claro */}

              <Pressable // Botón para activar el tema oscuro ('dark')
                onPress={() => handleUpdateSetting({ themeMode: 'dark' })} // Cambia temaMode a 'dark' y actualiza inmediatamente el contexto global
                style={[ // Resalta el botón cuando themeMode === 'dark'
                  styles.optionButton, // Estilo base de chip
                  isDark && styles.optionButtonDark, // Base oscura del chip
                  settings.themeMode === 'dark' && styles.optionButtonSelected, // Fondo rojo activo cuando el modo oscuro está elegido
                ]} // Cierra estilos del botón Oscuro
              > {/* Abre contenido del botón Oscuro */}
                <Text // Etiqueta visual del botón Oscuro
                  style={[ // Combina tipografía de chip con estado activo
                    styles.optionText, // Fuente semibold base
                    isDark && styles.subTextDark, // Gris cálido cuando aplica modo oscuro
                    settings.themeMode === 'dark' && styles.optionTextSelected, // Blanco puro cuando Oscuro está seleccionado
                  ]} // Cierra estilos de texto Oscuro
                > {/* Abre etiqueta visible del botón Oscuro */}
                  🌙 Oscuro
                </Text> {/* Cierra etiqueta Oscuro */}
              </Pressable> {/* Cierra botón de tema oscuro */}
            </View> {/* Cierra fila de selección de tema */}

            <View style={[styles.switchRow, isDark && styles.switchRowDark]}> {/* Fila inferior con línea divisoria para el interruptor de tarjetas compactas */}
              <View style={styles.switchLabelBox}> {/* Columna izquierda flexible con título y descripción del modo compacto */}
                <Text style={[styles.label, isDark && styles.textDark]}> {/* Título del ajuste de tarjetas compactas */}
                  Modo de tarjetas compactas
                </Text> {/* Cierra título del ajuste compacto */}
                <Text style={[styles.helperText, isDark && styles.subTextDark]}> {/* Descripción explicativa de cómo afecta las tarjetas de Home y Favoritos */}
                  Reduce la altura de las imágenes para ver más recetas en
                  pantalla.
                </Text> {/* Cierra descripción del modo compacto */}
              </View> {/* Cierra bloque de etiquetas del Switch */}
              <Switch // Interruptor booleano conectado a settings.compactCards
                value={settings.compactCards} // Posición actual del interruptor (activado o desactivado)
                onValueChange={(value) => // Dispara persistencia inmediata cuando el usuario desliza o pulsa el Switch
                  handleUpdateSetting({ compactCards: value }) // Guarda el nuevo estado booleano compactCards
                } // Cierra manejador onValueChange
                trackColor={{ // Define colores del riel del interruptor según estado y tema
                  false: isDark ? '#382E2B' : '#CCCCCC', // Riel apagado gris oscuro o neutro claro
                  true: '#C0392B', // Riel encendido en rojo característico de GastroLab
                }} // Cierra configuración de trackColor
              /> {/* Cierra Switch de tarjetas compactas */}
            </View> {/* Cierra fila del Switch de modo compacto */}
          </View> {/* Cierra tarjeta izquierda de Preferencias */}

          <View // Tarjeta derecha: Seguridad y Actualización de Credenciales
            style={[ // Combina tarjeta base, tema oscuro y ancho 50% en pantallas grandes
              styles.card, // Estilo estándar de tarjeta blanca
              isDark && styles.cardDark, // Fondo y borde oscuros en modo nocturno
              isWideLayout && styles.cardHalf, // Comparte ancho horizontal junto a Preferencias en modo amplio
            ]} // Cierra arreglo de estilos de tarjeta de seguridad
          > {/* Abre contenido de Seguridad y Actualización de Credenciales */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}> {/* Encabezado de la sección de seguridad de cuenta */}
              Seguridad y Actualización de Credenciales
            </Text> {/* Cierra encabezado de seguridad */}
            <Text style={[styles.helperText, isDark && styles.subTextDark]}> {/* Muestra correo e ID de sesión para identificar la cuenta en edición */}
              Cuenta activa: {session?.email || 'Usuario autenticado'} (ID:{' '}
              {session?.id ?? '-'})
            </Text> {/* Cierra resumen de cuenta activa */}

            {credentialsError && ( // Renderiza banner rojo únicamente cuando existe un error en el formulario
              <View // Contenedor del banner de error de credenciales
                style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Aplica fondo rosado o rojo oscuro con borde acorde al tema
              > {/* Abre texto del banner de error */}
                <Text // Texto rojo con el motivo específico de validación o contraseña incorrecta
                  style={[styles.errorText, isDark && styles.errorTextDark]} // Alto contraste en claro u oscuro
                > {/* Abre mensaje de error */}
                  {credentialsError}
                </Text> {/* Cierra texto de error */}
              </View> // Fin de banner errorBanner
            )} {/* Cierra renderizado condicional de error */}
            {credentialsMessage && ( // Renderiza banner verde únicamente cuando las credenciales se guardaron con éxito
              <View // Contenedor del banner de éxito de credenciales
                style={[ // Aplica paleta verde de éxito clara u oscura
                  styles.successBanner, // Verde claro por defecto
                  isDark && styles.successBannerDark, // Verde oscuro en modo nocturno
                ]} // Cierra estilos del banner de éxito
              > {/* Abre texto del banner de éxito */}
                <Text // Texto de confirmación devuelto por updateCredentials
                  style={[ // Ajusta color verde de texto al tema claro u oscuro
                    styles.successText, // Verde legible en fondo claro
                    isDark && styles.successTextDark, // Verde brillante en fondo oscuro
                  ]} // Cierra arreglo de estilos del texto de éxito
                > {/* Abre contenido de texto de éxito */}
                  {credentialsMessage}
                </Text> {/* Cierra texto de éxito */}
              </View> // Fin de banner successBanner
            )} {/* Cierra renderizado condicional de éxito */}

            <Text style={[styles.label, isDark && styles.textDark]}> {/* Etiqueta obligatoria para confirmar identidad con contraseña actual */}
              Contraseña actual *
            </Text> {/* Cierra etiqueta de contraseña actual */}
            <TextInput // Campo enmascarado para escribir la contraseña vigente
              style={[styles.input, isDark && styles.inputDark]} // Caja de texto adaptada al tema claro u oscuro
              placeholder="Ingresa tu contraseña actual" // Texto guía dentro del campo
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color legible del placeholder según tema
              secureTextEntry // Oculta los caracteres con puntos por seguridad
              autoCapitalize="none" // Evita mayúsculas automáticas que rompan la contraseña
              editable={!updatingCredentials} // Bloquea edición mientras se valida con el servidor
              value={currentPassword} // Valor controlado en el estado currentPassword
              onChangeText={setCurrentPassword} // Sincroniza cada pulsación con currentPassword
            /> {/* Cierra TextInput de contraseña actual */}

            <Text style={[styles.label, isDark && styles.textDark]}> {/* Etiqueta del nuevo correo electrónico obligatorio */}
              Nuevo correo electrónico *
            </Text> {/* Cierra etiqueta de nuevo correo */}
            <TextInput // Campo para modificar el email de inicio de sesión
              style={[styles.input, isDark && styles.inputDark]} // Caja de entrada con borde suave o estilo oscuro
              placeholder="nuevo@correo.com" // Ejemplo de formato esperado de correo
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Contraste del placeholder en tema claro u oscuro
              keyboardType="email-address" // Activa teclado móvil con arroba para escribir correos
              autoCapitalize="none" // Impide capitalizar automáticamente la primera letra del correo
              editable={!updatingCredentials} // Deshabilita cambios mientras se guarda en users.json
              value={newEmail} // Precargado con el email vigente y actualizado en tiempo real
              onChangeText={setNewEmail} // Actualiza el estado newEmail al escribir
            /> {/* Cierra TextInput de nuevo correo */}

            <Text style={[styles.label, isDark && styles.textDark]}> {/* Etiqueta opcional para cambiar también la contraseña */}
              Nueva contraseña (opcional)
            </Text> {/* Cierra etiqueta de nueva contraseña */}
            <TextInput // Campo enmascarado opcional para definir nueva clave (mín. 4 caracteres)
              style={[styles.input, isDark && styles.inputDark]} // Estilo estándar del campo de texto claro u oscuro
              placeholder="Dejar vacío para conservar la actual (mín. 4 caracteres)" // Aclara que puede dejarse en blanco si solo cambia el email
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color del texto de ayuda según tema
              secureTextEntry // Oculta caracteres escritos para la nueva contraseña
              autoCapitalize="none" // Desactiva auto-mayúsculas para evitar errores al iniciar sesión después
              editable={!updatingCredentials} // Se bloquea durante la petición en curso
              value={newPassword} // Valor controlado por newPassword
              onChangeText={setNewPassword} // Actualiza newPassword al modificar el campo
            /> {/* Cierra TextInput de nueva contraseña opcional */}

            <Pressable // Botón verde que dispara verificación de contraseña actual y PATCH /users/:id
              onPress={handleUpdateCredentials} // Invoca la validación local y actualización remota/local
              disabled={updatingCredentials} // Previene envíos duplicados mientras tarda la petición
              style={[ // Combina botón verde primario con opacidad reducida al estar cargando
                styles.primaryButton, // Fondo verde #27AE60 con bordes redondeados
                updatingCredentials && styles.buttonDisabled, // Baja opacidad a 0.6 mientras espera respuesta
              ]} // Cierra estilos del botón Actualizar credenciales
            > {/* Abre etiqueta o spinner del botón */}
              {updatingCredentials ? ( // Muestra spinner mientras se verifican y guardan credenciales
                <ActivityIndicator color="#FFFFFF" /> // Indicador blanco centrado dentro del botón verde
              ) : ( // Cuando no está procesando, muestra el texto normal del botón
                <Text style={styles.buttonText}>Actualizar credenciales</Text> // Texto blanco en negrita del botón guardar
              )} {/* Termina contenido condicional del botón de credenciales */}
            </Pressable> {/* Cierra Pressable de actualización de credenciales */}
          </View> {/* Cierra tarjeta derecha de Seguridad */}
        </View> {/* Cierra rejilla responsiva wideGrid */}

        <View style={[styles.card, isDark && styles.cardDark]}> {/* Tarjeta inferior: restablecimiento de caché de recetas y cierre de sesión */}
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}> {/* Encabezado de acciones de mantenimiento y sesión */}
            Acciones de Cuenta y Datos
          </Text> {/* Cierra encabezado de acciones */}

          <Pressable // Botón secundario para descartar cambios locales cacheados en recetas
            onPress={handleResetLocalData} // Invoca resetLocalRecipeChanges y muestra aviso
            style={styles.secondaryButton} // Color marrón cálido #753333 que diferencia mantenimiento de salida
          > {/* Abre etiqueta del botón de restablecimiento */}
            <Text style={styles.buttonText}> {/* Texto del botón de restablecer caché */}
              Restablecer datos locales de prueba
            </Text> {/* Cierra texto de restablecer datos */}
          </Pressable> {/* Cierra Pressable de restablecimiento de caché */}

          <Pressable onPress={() => handleLogout()} style={styles.dangerButton}> {/* Botón rojo para borrar token y volver al login */}
            <Text style={styles.buttonText}>Cerrar sesión</Text> {/* Texto en blanco para acción de salida */}
          </Pressable> {/* Cierra Pressable de Cerrar sesión */}
        </View> {/* Cierra tarjeta de Acciones de Cuenta y Datos */}
      </ScrollView> {/* Cierra contenedor desplazable ScrollView */}
    </KeyboardAvoidingView> // Fin de la estructura JSX de SettingsScreen
  ); // Fin del retorno JSX principal de la pantalla de Ajustes
} // Fin de componente SettingsScreen

const styles = StyleSheet.create({ // Compila estilos visuales de tarjetas, selectores, banners y botones de SettingsScreen
  screen: { // Contenedor raíz de pantalla completa con fondo crema cálido
    flex: 1, // Ocupa todo el alto disponible debajo del encabezado
    backgroundColor: '#FAF7F5', // Fondo claro cálido consistente con Home y Favoritos
  }, // Cierra estilo screen
  screenDark: { // Modificador oscuro para el contenedor raíz
    backgroundColor: '#181312', // Fondo carbón profundo en modo nocturno
  }, // Cierra screenDark
  container: { // Márgenes interiores y ancho máximo del ScrollView en móvil
    padding: 16, // Espaciado uniforme alrededor de las tarjetas
    maxWidth: 720, // Evita líneas demasiado largas en pantallas medianas de una columna
    width: '100%', // Ocupa el ancho disponible hasta alcanzar el límite maxWidth
    alignSelf: 'center', // Centra horizontalmente el contenido dentro de pantallas anchas
  }, // Cierra container
  containerWide: { // Expansión del contenedor cuando isWideLayout activa dos columnas
    maxWidth: 1120, // Permite mostrar Preferencias y Seguridad en paralelo sin apretar campos
  }, // Cierra containerWide
  wideGrid: { // Disposición horizontal de las dos tarjetas principales en tablet/web
    flexDirection: 'row', // Coloca Preferencias a la izquierda y Seguridad a la derecha
    alignItems: 'flex-start', // Evita estirar verticalmente la tarjeta más corta al alto de la otra
    gap: 16, // Separación horizontal entre ambas columnas
  }, // Cierra wideGrid
  cardHalf: { // Reparto equitativo para cada tarjeta dentro de wideGrid
    flex: 1, // Hace que cada tarjeta ocupe la mitad exacta del espacio disponible
  }, // Cierra cardHalf
  centered: { // Contenedor centrado para el ActivityIndicator durante la carga inicial
    flex: 1, // Llena la pantalla completa mientras loading es true
    justifyContent: 'center', // Centra verticalmente el spinner de carga
    alignItems: 'center', // Centra horizontalmente el spinner de carga
    backgroundColor: '#FAF7F5', // Mantiene el mismo fondo cálido antes de renderizar tarjetas
  }, // Cierra centered
  centeredDark: { // Fondo de pantalla de carga en tema oscuro
    backgroundColor: '#181312', // Evita destello blanco mientras cargan preferencias oscuras
  }, // Cierra centeredDark
  card: { // Superficie elevada para agrupar preferencias, seguridad o mantenimiento
    backgroundColor: '#FFFFFF', // Superficie blanca en tema claro
    borderRadius: 14, // Esquinas suavizadas uniformes de tarjeta
    padding: 20, // Espacio interior generoso alrededor de controles e inputs
    marginBottom: 16, // Separación vertical entre tarjetas consecutivas
    borderWidth: 1, // Borde delgado para delimitar tarjetas sobre fondo crema
    borderColor: '#EAE2DF', // Tono arena sutil para el borde claro
    ...Platform.select({ // Selecciona propiedades de sombra nativas o CSS boxShadow en Web
      web: { // Sombra CSS para navegadores donde shadowColor nativo no aplica
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Sombra cálida discreta en Web
      }, // Cierra bloque de sombra web
      default: { // Sombra nativa aplicada en Android e iOS
        shadowColor: '#4f2c21', // Color marrón cálido de sombra en iOS
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento vertical de 2px bajo la tarjeta
        shadowOpacity: 0.15, // Transparencia suave de sombra en iOS
        shadowRadius: 4, // Difuminado de sombra en iOS
        elevation: 3, // Elevación material en Android
      }, // Cierra sombras nativas default
    }), // Esparce el objeto de sombra devuelto por Platform.select
  }, // Cierra card
  cardDark: { // Variante oscura de tarjeta
    backgroundColor: '#241D1B', // Marrón carbón elevado sobre el fondo #181312
    borderColor: '#382E2B', // Borde oscuro tenue para distinguir contorno de tarjeta
  }, // Cierra cardDark
  sectionTitle: { // Encabezado principal de cada tarjeta
    fontSize: 18, // Tamaño destacado para títulos de sección
    fontWeight: 'bold', // Negrita para jerarquía visual clara
    color: '#2C1E1B', // Tono espresso oscuro legible en fondo blanco
    marginBottom: 8, // Separación inferior respecto al subtítulo o primera etiqueta
  }, // Cierra sectionTitle
  textDark: { // Color de texto primario sobre superficies oscuras
    color: '#F7F2F0', // Blanco cálido de alto contraste en modo oscuro
  }, // Cierra textDark
  subTextDark: { // Color de texto secundario en modo oscuro
    color: '#B8A9A4', // Gris rosado tenue para descripciones y chips no seleccionados
  }, // Cierra subTextDark
  label: { // Etiqueta de campo o grupo de opciones dentro de las tarjetas
    fontSize: 14, // Tamaño legible para encabezados de controles e inputs
    fontWeight: '600', // Semibold para distinguir etiquetas de texto auxiliar
    marginBottom: 6, // Espacio pequeño encima de chips o cajas de texto
    marginTop: 12, // Separación superior respecto al grupo anterior
    color: '#333333', // Gris oscuro neutro sobre tarjetas claras
  }, // Cierra label
  helperText: { // Texto descriptivo secundario para cuenta activa o modo compacto
    fontSize: 13, // Tipografía ligeramente menor que las etiquetas principales
    color: '#666666', // Gris medio discreto en tema claro
    marginTop: 2, // Ajuste fino bajo títulos o subtítulos
  }, // Cierra helperText
  optionsRow: { // Fila flexible que envuelve chips de paginación, categorías o tema
    flexDirection: 'row', // Alinea chips horizontalmente de izquierda a derecha
    flexWrap: 'wrap', // Permite saltar a siguiente línea cuando hay muchas categorías
    gap: 8, // Espacio uniforme horizontal y vertical entre chips
    marginTop: 4, // Ligero respiro respecto a su etiqueta superior
  }, // Cierra optionsRow
  optionButton: { // Botón tipo chip en estado no seleccionado
    paddingHorizontal: 14, // Anchura interior horizontal cómoda para tocar el chip
    paddingVertical: 8, // Altura cómoda de área táctil
    borderRadius: 18, // Apariencia redondeada tipo píldora
    backgroundColor: '#F3ECE9', // Fondo arena suave cuando está inactivo
    borderWidth: 1, // Borde fino para delimitar chip inactivo
    borderColor: '#E2D6D1', // Contorno beige claro
  }, // Cierra optionButton
  optionButtonDark: { // Chip inactivo en tema oscuro
    backgroundColor: '#181312', // Fondo oscuro hundido respecto a la tarjeta
    borderColor: '#382E2B', // Borde marrón oscuro sutil
  }, // Cierra optionButtonDark
  optionButtonSelected: { // Modificador aplicado al chip actualmente activo
    backgroundColor: '#C0392B', // Rojo corporativo de GastroLab para destacar selección
    borderColor: '#C0392B', // Igualar borde al fondo elimina halo gris al seleccionarse
  }, // Cierra optionButtonSelected
  optionText: { // Texto dentro de chips inactivos en modo claro
    fontSize: 13, // Tamaño compacto para caber en múltiples chips por fila
    fontWeight: '600', // Semibold para buena legibilidad
    color: '#4A3833', // Marrón oscuro en estado normal
  }, // Cierra optionText
  optionTextSelected: { // Texto dentro del chip seleccionado
    color: '#FFFFFF', // Blanco puro para máximo contraste sobre rojo #C0392B
  }, // Cierra optionTextSelected
  switchRow: { // Fila superiormente separada que alinea descripción e interruptor Switch
    flexDirection: 'row', // Coloca texto a la izquierda y Switch a la derecha
    justifyContent: 'space-between', // Empuja ambos extremos de la fila
    alignItems: 'center', // Centra verticalmente el Switch respecto al texto descriptivo
    marginTop: 12, // Separa de la fila de selección de tema
    paddingTop: 12, // Espacio debajo de la línea divisoria
    borderTopWidth: 1, // Línea sutil que separa los chips del interruptor
    borderTopColor: '#F0EAE7', // Color crema claro de la línea divisoria
  }, // Cierra switchRow
  switchRowDark: { // Divisor oscuro del interruptor
    borderTopColor: '#382E2B', // Línea divisoria sutil sobre tarjetas oscuras
  }, // Cierra switchRowDark
  switchLabelBox: { // Contenedor izquierdo que permite envolver textos largos del Switch
    flex: 1, // Toma todo el espacio sobrante sin empujar el Switch fuera de pantalla
    paddingRight: 12, // Deja margen de seguridad entre la descripción y el interruptor
  }, // Cierra switchLabelBox
  input: { // Cajas de entrada de texto en la tarjeta de credenciales
    borderWidth: 1, // Marco visible alrededor de cada campo de entrada
    borderColor: '#CCCCCC', // Borde gris claro estándar
    borderRadius: 8, // Esquinas ligeramente redondeadas
    padding: 12, // Espacio interior cómodo para escribir y tocar
    fontSize: 16, // Evita zoom automático en Safari iOS al enfocar el input
    backgroundColor: '#FAFAFA', // Gris muy claro para distinguir el campo sobre tarjeta blanca
    color: '#2C1E1B', // Texto oscuro ingresado por el usuario
  }, // Cierra input
  inputDark: { // Variante oscura de cajas de texto
    backgroundColor: '#181312', // Fondo oscuro interno del input
    borderColor: '#382E2B', // Borde marrón oscuro del input
    color: '#F7F2F0', // Texto blanco cálido escrito por el usuario
  }, // Cierra inputDark
  errorBanner: { // Caja de alerta roja para fallos de credenciales o contraseña
    backgroundColor: '#FDEDEC', // Fondo rosado suave de error en tema claro
    borderRadius: 8, // Bordes redondeados uniformes
    padding: 10, // Margen interior alrededor del mensaje de error
    marginTop: 10, // Separación debajo del resumen de cuenta activa
    borderWidth: 1, // Contorno fino del banner de error
    borderColor: '#F5B7B1', // Borde rojo claro en tema claro
  }, // Cierra errorBanner
  errorBannerDark: { // Variante oscura del banner de error
    backgroundColor: '#3A1F1E', // Fondo rojo vinoso oscuro en modo nocturno
    borderColor: '#78281F', // Borde carmesí apagado
  }, // Cierra errorBannerDark
  errorText: { // Estilo del texto dentro de errorBanner claro
    color: '#C0392B', // Rojo intenso de alerta
    fontSize: 13, // Tamaño compacto para caber en pocas líneas
    fontWeight: '600', // Semibold para enfatizar el motivo del error
  }, // Cierra errorText
  errorTextDark: { // Texto de error legible en tema oscuro
    color: '#EC7063', // Coral claro con buen contraste sobre #3A1F1E
  }, // Cierra errorTextDark
  successBanner: { // Caja de confirmación verde tras actualizar credenciales
    backgroundColor: '#E8F8F0', // Fondo verde menta suave en tema claro
    borderRadius: 8, // Esquinas redondeadas consistentes con errorBanner
    padding: 10, // Margen interno del mensaje de éxito
    marginTop: 10, // Separación respecto al bloque superior
    borderWidth: 1, // Borde fino de contorno
    borderColor: '#A9DFBF', // Borde verde claro en modo diurno
  }, // Cierra successBanner
  successBannerDark: { // Variante oscura del banner de éxito
    backgroundColor: '#1B3124', // Fondo verde bosque oscuro
    borderColor: '#27AE60', // Borde verde esmeralda
  }, // Cierra successBannerDark
  successText: { // Texto verde de confirmación en modo claro
    color: '#1E8449', // Verde oscuro legible sobre #E8F8F0
    fontSize: 13, // Consistente con errorText
    fontWeight: '600', // Semibold para resaltar confirmación
  }, // Cierra successText
  successTextDark: { // Texto verde legible en modo oscuro
    color: '#58D68D', // Verde claro de contraste alto sobre #1B3124
  }, // Cierra successTextDark
  primaryButton: { // Botón verde para guardar cambios de correo y contraseña
    backgroundColor: '#27AE60', // Verde acción afirmativa
    paddingVertical: 14, // Altura cómoda para pulsación táctil
    borderRadius: 8, // Esquinas redondeadas acordes a los inputs
    alignItems: 'center', // Centra texto o ActivityIndicator horizontalmente
    marginTop: 18, // Espacio extra antes de enviar el formulario
  }, // Cierra primaryButton
  secondaryButton: { // Botón marrón para restablecer caché local de recetas
    backgroundColor: '#753333', // Tono tierra discreto distinto al botón destructivo de logout
    paddingVertical: 14, // Altura uniforme con primaryButton
    borderRadius: 8, // Bordes redondeados
    alignItems: 'center', // Centra etiqueta del botón
    marginTop: 10, // Separación debajo de "Acciones de Cuenta y Datos"
  }, // Cierra secondaryButton
  dangerButton: { // Botón rojo para cerrar sesión
    backgroundColor: '#C0392B', // Rojo intenso de salida segura
    paddingVertical: 14, // Altura táctil estándar de botón
    borderRadius: 8, // Esquinas redondeadas
    alignItems: 'center', // Centra etiqueta "Cerrar sesión"
    marginTop: 12, // Separación respecto al botón secundario de mantenimiento
  }, // Cierra dangerButton
  buttonDisabled: { // Estado visual atenuado mientras updatingCredentials es true
    opacity: 0.6, // Atenúa botón sin ocultarlo por completo durante la petición
  }, // Cierra buttonDisabled
  buttonText: { // Estilo compartido de texto para todos los botones de acción
    color: '#FFFFFF', // Blanco de alto contraste sobre verde, marrón y rojo
    fontWeight: '600', // Semibold legible
    fontSize: 16, // Tamaño claro y proporcional al paddingVertical
  }, // Cierra buttonText
}); // Finaliza creación de hoja de estilos de SettingsScreen
