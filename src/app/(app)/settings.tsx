import { useFocusEffect, useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useFocusEffect, useRouter })
import { useCallback, useState } from 'react'; // Importa React y sus hooks ({ useCallback, useState }) para estado y ciclo de vida
import { // Continúa o inicia bloque de importación de módulos
  ActivityIndicator, // Importa "ActivityIndicator" desde react-native
  KeyboardAvoidingView, // Importa "KeyboardAvoidingView" desde react-native
  Platform, // Importa "Platform" desde react-native
  Pressable, // Importa "Pressable" desde react-native
  ScrollView, // Importa "ScrollView" desde react-native
  StyleSheet, // Importa "StyleSheet" desde react-native
  Switch, // Importa "Switch" desde react-native
  Text, // Importa "Text" desde react-native
  TextInput, // Importa "TextInput" desde react-native
  View, // Importa "View" desde react-native
  useWindowDimensions, // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
} from 'react-native'; // Finaliza importación múltiple desde react-native
import { // Continúa o inicia bloque de importación de módulos
  getUserProfile, // Importa "getUserProfile" desde @/services/user
  updateCredentials, // Importa "updateCredentials" desde @/services/user
  verifyPassword, // Importa "verifyPassword" desde @/services/user
} from '@/services/user'; // Finaliza importación múltiple desde @/services/user
import { PageSizeOption, UserSession, UserSettings } from '@/types/Auth'; // Importa tipos TypeScript de dominio desde @/types/Auth
import { RECIPE_CATEGORIES, RecipeCategory } from '@/types/RecipeItem'; // Importa tipos TypeScript de dominio desde @/types/RecipeItem
import { showAlert } from '@/utils/alerts'; // Importa utilidades auxiliares compartidas (@/utils/alerts)
import { // Continúa o inicia bloque de importación de módulos
  DEFAULT_USER_SETTINGS, // Importa "DEFAULT_USER_SETTINGS" desde @/utils/preferencesStorage
  getUserSettings, // Importa "getUserSettings" desde @/utils/preferencesStorage
  resetLocalRecipeChanges, // Importa "resetLocalRecipeChanges" desde @/utils/preferencesStorage
  saveUserSettings, // Importa "saveUserSettings" desde @/utils/preferencesStorage
  useThemeMode, // Importa "useThemeMode" desde @/utils/preferencesStorage
} from '@/utils/preferencesStorage'; // Finaliza importación múltiple desde @/utils/preferencesStorage
import { // Continúa o inicia bloque de importación de módulos
  deleteToken, // Importa "deleteToken" desde @/utils/tokenStorage
  getUserSession, // Importa "getUserSession" desde @/utils/tokenStorage
  saveUserSession, // Importa "saveUserSession" desde @/utils/tokenStorage
} from '@/utils/tokenStorage'; // Finaliza importación múltiple desde @/utils/tokenStorage
import { validateCredentialsForm } from '@/utils/validators'; // Importa utilidades auxiliares compartidas (@/utils/validators)

const PAGE_SIZES: PageSizeOption[] = [10, 20, 30]; // Define constante de configuración PAGE_SIZES

export default function SettingsScreen() { // Declara y exporta la pantalla principal SettingsScreen
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDarkTheme = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width, height } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isWideLayout = width >= 820 || (width > height && width >= 680); // Declara constante local isWideLayout

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS); // Declara estado reactivo para settings
  const [session, setSession] = useState<UserSession | null>(null); // Declara estado reactivo para session
  const [loading, setLoading] = useState<boolean>(true); // Declara estado reactivo para el indicador de carga

  const [currentPassword, setCurrentPassword] = useState(''); // Declara estado reactivo para la contraseña actual
  const [newEmail, setNewEmail] = useState(''); // Declara estado reactivo para new email
  const [newPassword, setNewPassword] = useState(''); // Declara estado reactivo para la nueva contraseña
  const [updatingCredentials, setUpdatingCredentials] = useState(false); // Declara estado reactivo para updating credentials
  const [credentialsMessage, setCredentialsMessage] = useState<string | null>( // Declara estado reactivo para credentials message
    null // Valor nulo explícito (sin selección o sin elemento)
  ); // Cierra bloque o expresión anterior
  const [credentialsError, setCredentialsError] = useState<string | null>(null); // Declara estado reactivo para credentials error

  useFocusEffect( // Ejecuta recarga automática cada vez que esta pantalla recupera el foco
    useCallback(() => { // Inicia callback o cálculo memorizado para evitar trabajo repetido
      let isActive = true; // Declara variable local mutable is active

      (async () => { // Inicia función asíncrona autoejecutable dentro del efecto
        try { // Inicia bloque try para capturar posibles errores de ejecución
          const [storedSettings, storedSession] = await Promise.all([ // Ejecuta múltiples peticiones asíncronas en paralelo y espera todas
            getUserSettings(), // Carga preferencias de usuario guardadas localmente
            getUserSession(), // Recupera datos de la sesión activa almacenada
          ]); // Cierra bloque o expresión anterior

          if (isActive) { // Evalúa condición lógica antes de ejecutar este bloque
            setSettings(storedSettings); // Actualiza settings
            setSession(storedSession); // Actualiza session
            if (storedSession?.email) { // Evalúa condición lógica antes de ejecutar este bloque
              setNewEmail(storedSession.email); // Actualiza new email
            } // Cierra rama del condicional if/else
          } // Cierra rama del condicional if/else

          if (storedSession?.id) { // Evalúa condición lógica antes de ejecutar este bloque
            try { // Inicia bloque try para capturar posibles errores de ejecución
              const profile = await getUserProfile(storedSession.id); // Obtiene el perfil actualizado del usuario desde el servidor
              if (isActive && profile?.email) { // Evalúa condición lógica antes de ejecutar este bloque
                setNewEmail(profile.email); // Actualiza new email
                setSession((prev) => // Actualiza session
                  prev ? { ...prev, email: profile.email } : prev // Actualiza datos de sesión previos si existe sesión activa
                ); // Cierra bloque o expresión anterior
              } // Cierra rama del condicional if/else
            } catch (profileErr) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
              console.warn( // Registra advertencia diagnóstica en consola sin detener la app
                '[settings.tsx] Usando email de sesión local:', // Cadena de texto usada como parámetro o mensaje ("[settings.tsx] Usando email de sesión local:")
                profileErr // Pasa profile err como argumento a console.warn
              ); // Cierra bloque o expresión anterior
            } // Cierra bloque de captura catch
          } // Cierra rama del condicional if/else
        } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
          if (isActive) setLoading(false); // Evalúa condición lógica antes de ejecutar este bloque
        } // Cierra bloque try o finally
      })(); // Ejecuta de inmediato y cierra la función asíncrona

      return () => { // Devuelve resultado o detiene ejecución temprana de la función
        isActive = false; // Desactiva bandera al desmontar componente para evitar actualizaciones tardías
      }; // Finaliza sentencia de retorno
    }, []) // Cierra efecto o memoización; sin dependencias, corre solo al montar
  ); // Cierra bloque o expresión anterior

  const handleUpdateSetting = async (partial: Partial<UserSettings>) => { // Define manejador o función handleUpdateSetting
    const nextSettings: UserSettings = { // Declara constante local nextSettings: UserSettings
      ...settings, // Copia propiedades existentes (...settings) mediante spread operator
      ...partial, // Copia propiedades existentes (...partial) mediante spread operator
    }; // Cierra bloque o expresión anterior
    setSettings(nextSettings); // Actualiza settings
    await saveUserSettings(nextSettings); // Guarda preferencias de usuario en almacenamiento local
  }; // Cierra bloque o expresión anterior

  const handleUpdateCredentials = async () => { // Define manejador o función handleUpdateCredentials
    setCredentialsError(null); // Actualiza credentials error
    setCredentialsMessage(null); // Actualiza credentials message

    if (!session?.id) { // Evalúa condición lógica antes de ejecutar este bloque
      setCredentialsError( // Actualiza credentials error
        'No se encontró el identificador de tu sesión. Inicia sesión nuevamente.' // Cadena de texto usada como parámetro o mensaje ("No se encontró el identificador de tu sesión. In")
      ); // Cierra bloque o expresión anterior
      return; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    const effectiveNewPassword = // Declara constante local effectiveNewPassword
      newPassword.trim().length > 0 ? newPassword : currentPassword; // Elige nueva contraseña si se escribió una, o conserva la actual

    const validation = validateCredentialsForm( // Declara constante local validation
      currentPassword, // Pasa la contraseña actual como argumento a validateCredentialsForm
      newEmail, // Pasa new email como argumento a validateCredentialsForm
      effectiveNewPassword // Pasa effective new password como argumento a validateCredentialsForm
    ); // Cierra bloque o expresión anterior
    if (!validation.isValid) { // Evalúa condición lógica antes de ejecutar este bloque
      const msg = validation.errorMessage || 'Verifica los campos ingresados.'; // Lee valor opcional de forma segura con respaldo por defecto
      setCredentialsError(msg); // Actualiza credentials error
      showAlert('Datos inválidos', msg); // Muestra alerta multiplataforma informativa o de error al usuario
      return; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    try { // Inicia bloque try para capturar posibles errores de ejecución
      setUpdatingCredentials(true); // Actualiza updating credentials
      const passwordCheck = await verifyPassword(session.id, currentPassword); // Verifica que la contraseña actual coincida antes de editar
      if (!passwordCheck.valid) { // Evalúa condición lógica antes de ejecutar este bloque
        const invalidMsg = // Declara constante local invalidMsg
          passwordCheck.message || 'La contraseña actual es incorrecta.'; // Lee valor opcional de forma segura con respaldo por defecto
        setCredentialsError(invalidMsg); // Actualiza credentials error
        showAlert('Contraseña incorrecta', invalidMsg); // Muestra alerta multiplataforma informativa o de error al usuario
        return; // Devuelve resultado o detiene ejecución temprana de la función
      } // Cierra rama del condicional if/else

      const updateResult = await updateCredentials( // Actualiza correo o contraseña del usuario en el microservicio
        session.id, // Pasa session.id como argumento a updateCredentials
        newEmail, // Pasa new email como argumento a updateCredentials
        effectiveNewPassword // Pasa effective new password como argumento a updateCredentials
      ); // Cierra bloque o expresión anterior

      const updatedSession: UserSession = { // Declara constante local updatedSession: UserSession
        ...session, // Copia propiedades existentes (...session) mediante spread operator
        email: newEmail.trim(), // Define propiedad "email" en el objeto actual
      }; // Cierra bloque o expresión anterior
      await saveUserSession(updatedSession); // Guarda datos actualizados de la sesión del usuario
      setSession(updatedSession); // Actualiza session
      setCurrentPassword(''); // Actualiza la contraseña actual
      setNewPassword(''); // Actualiza la nueva contraseña

      const successMsg = // Declara constante local successMsg
        updateResult.message || 'Credenciales actualizadas correctamente'; // Lee valor opcional de forma segura con respaldo por defecto
      setCredentialsMessage(successMsg); // Actualiza credentials message
      showAlert('Éxito', successMsg); // Muestra alerta multiplataforma informativa o de error al usuario
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      const msg = // Declara constante local msg
        err instanceof Error // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
          ? err.message // Si es instancia Error, extrae su mensaje descriptivo
          : 'No se pudieron actualizar las credenciales.'; // Valor o rama devuelta cuando la condición ternaria es falsa
      setCredentialsError(msg); // Actualiza credentials error
      showAlert('Error', msg); // Muestra alerta multiplataforma informativa o de error al usuario
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setUpdatingCredentials(false); // Actualiza updating credentials
    } // Cierra bloque try o finally
  }; // Cierra bloque o expresión anterior

  const handleResetLocalData = async () => { // Define manejador o función handleResetLocalData
    await resetLocalRecipeChanges(); // Restablece cambios locales en caché al estado inicial
    showAlert( // Muestra alerta multiplataforma informativa o de error al usuario
      'Caché restablecida', // Cadena de texto usada como parámetro o mensaje ("Caché restablecida")
      'Se restableció el respaldo local. Si el servidor JSON está activo, se cargarán los registros actuales de recipes.json.' // Cadena de texto usada como parámetro o mensaje ("Se restableció el respaldo local. Si el servidor")
    ); // Cierra bloque o expresión anterior
  }; // Cierra bloque o expresión anterior

  const handleLogout = async () => { // Define manejador o función handleLogout
    await deleteToken(); // Elimina el token de sesión del almacenamiento seguro
    router.replace('/(auth)/login'); // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
  }; // Cierra bloque o expresión anterior

  const isDark = isDarkTheme || settings.themeMode === 'dark'; // Declara constante local isDark

  if (loading) { // Evalúa condición lógica antes de ejecutar este bloque
    return ( // Inicia el árbol JSX retornado por el componente
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Abre caja contenedora de diseño (layout) */}
        <ActivityIndicator // Inicia declaración de indicador giratorio de carga
          size="large" // Prop size: tamaño del icono o indicador de carga
          color={isDark ? '#E74C3C' : '#333333'} // Prop color: color del icono o spinner
        />{/* Cierra etiqueta autocontenida de componente */}
      </View> // Cierra bloque de componente View
    ); // Finaliza sentencia de retorno
  } // Cierra rama del condicional if/else

  return ( // Inicia el árbol JSX retornado por el componente
    <KeyboardAvoidingView // Inicia declaración de contenedor que evita que el teclado tape entradas
      style={[styles.screen, isDark && styles.screenDark]} // Prop style: aplica estilos visuales al componente
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Prop behavior: ajuste de teclado según plataforma (iOS/Android)
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <ScrollView // Inicia declaración de contenedor con desplazamiento vertical
        contentContainerStyle={[ // Prop contentContainerStyle: estilos del contenedor interno desplazable
          styles.container, // Aplica estilo base "container"
          isWideLayout && styles.containerWide, // Aplica estilo condicional "containerWide" cuando se cumple isWideLayout
        ]} // Cierra lista combinada de estilos del componente
        keyboardShouldPersistTaps="handled" // Prop keyboardShouldPersistTaps: mantiene toques activos aunque el teclado esté abierto
      >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
        <View style={isWideLayout ? styles.wideGrid : undefined}>{/* Abre caja contenedora de diseño (layout) */}
          <View // Inicia declaración de caja contenedora de diseño (layout)
            style={[ // Prop style: aplica estilos visuales al componente
              styles.card, // Aplica estilo base "card"
              isDark && styles.cardDark, // Aplica estilo condicional "cardDark" cuando se cumple isDark
              isWideLayout && styles.cardHalf, // Aplica estilo condicional "cardHalf" cuando se cumple isWideLayout
            ]} // Cierra lista combinada de estilos del componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Preferencias de Visualización y Catálogo{/* Texto o expresión visible dentro del componente ("Preferencias de Visualización y Catálogo") */}
            </Text>{/* Cierra bloque de componente Text */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Recetas por página por defecto:{/* Texto o expresión visible dentro del componente ("Recetas por página por defecto:") */}
            </Text>{/* Cierra bloque de componente Text */}
            <View style={styles.optionsRow}>{/* Abre caja contenedora de diseño (layout) */}
              {PAGE_SIZES.map((size) => { // Inicia iteración .map() para generar lista de componentes JSX
                const selected = settings.itemsPerPage === size; // Declara constante local selected
                return ( // Inicia el árbol JSX retornado por el componente
                  <Pressable // Inicia declaración de área táctil personalizable
                    key={size} // Asigna prop "key" al componente
                    onPress={() => handleUpdateSetting({ itemsPerPage: size })} // Prop onPress: ejecuta acción al tocar el elemento
                    style={[ // Prop style: aplica estilos visuales al componente
                      styles.optionButton, // Aplica estilo base "optionButton"
                      isDark && styles.optionButtonDark, // Aplica estilo condicional "optionButtonDark" cuando se cumple isDark
                      selected && styles.optionButtonSelected, // Aplica estilo condicional "optionButtonSelected" cuando se cumple selected
                    ]} // Cierra lista combinada de estilos del componente
                  >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                    <Text // Inicia declaración de componente para renderizar texto en pantalla
                      style={[ // Prop style: aplica estilos visuales al componente
                        styles.optionText, // Aplica estilo base "optionText"
                        isDark && styles.subTextDark, // Aplica estilo condicional "subTextDark" cuando se cumple isDark
                        selected && styles.optionTextSelected, // Aplica estilo condicional "optionTextSelected" cuando se cumple selected
                      ]} // Cierra lista combinada de estilos del componente
                    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                      {size} recetas{/* Texto o expresión visible dentro del componente ("{size} recetas") */}
                    </Text>{/* Cierra bloque de componente Text */}
                  </Pressable> // Cierra bloque de componente Pressable
                ); // Finaliza sentencia de retorno
              })}{/* Texto o expresión visible dentro del componente ("})}") */}
            </View>{/* Cierra bloque de componente View */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Categoría inicial predeterminada:{/* Texto o expresión visible dentro del componente ("Categoría inicial predeterminada:") */}
            </Text>{/* Cierra bloque de componente Text */}
            <View style={styles.optionsRow}>{/* Abre caja contenedora de diseño (layout) */}
              {RECIPE_CATEGORIES.map((category: RecipeCategory) => { // Inicia iteración .map() para generar lista de componentes JSX
                const selected = settings.defaultCategory === category; // Declara constante local selected
                return ( // Inicia el árbol JSX retornado por el componente
                  <Pressable // Inicia declaración de área táctil personalizable
                    key={category} // Asigna prop "key" al componente
                    onPress={() => // Prop onPress: ejecuta acción al tocar el elemento
                      handleUpdateSetting({ defaultCategory: category }) // Guarda y aplica inmediatamente la preferencia seleccionada en Ajustes
                    } // Cierra bloque o expresión anterior
                    style={[ // Prop style: aplica estilos visuales al componente
                      styles.optionButton, // Aplica estilo base "optionButton"
                      isDark && styles.optionButtonDark, // Aplica estilo condicional "optionButtonDark" cuando se cumple isDark
                      selected && styles.optionButtonSelected, // Aplica estilo condicional "optionButtonSelected" cuando se cumple selected
                    ]} // Cierra lista combinada de estilos del componente
                  >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                    <Text // Inicia declaración de componente para renderizar texto en pantalla
                      style={[ // Prop style: aplica estilos visuales al componente
                        styles.optionText, // Aplica estilo base "optionText"
                        isDark && styles.subTextDark, // Aplica estilo condicional "subTextDark" cuando se cumple isDark
                        selected && styles.optionTextSelected, // Aplica estilo condicional "optionTextSelected" cuando se cumple selected
                      ]} // Cierra lista combinada de estilos del componente
                    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                      {category}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                    </Text>{/* Cierra bloque de componente Text */}
                  </Pressable> // Cierra bloque de componente Pressable
                ); // Finaliza sentencia de retorno
              })}{/* Texto o expresión visible dentro del componente ("})}") */}
            </View>{/* Cierra bloque de componente View */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Tema de la interfaz:{/* Texto o expresión visible dentro del componente ("Tema de la interfaz:") */}
            </Text>{/* Cierra bloque de componente Text */}
            <View style={styles.optionsRow}>{/* Abre caja contenedora de diseño (layout) */}
              <Pressable // Inicia declaración de área táctil personalizable
                onPress={() => handleUpdateSetting({ themeMode: 'light' })} // Prop onPress: ejecuta acción al tocar el elemento
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.optionButton, // Aplica estilo base "optionButton"
                  isDark && styles.optionButtonDark, // Aplica estilo condicional "optionButtonDark" cuando se cumple isDark
                  settings.themeMode === 'light' && styles.optionButtonSelected, // Selecciona o combina estilos condicionales para el componente
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[ // Prop style: aplica estilos visuales al componente
                    styles.optionText, // Aplica estilo base "optionText"
                    isDark && styles.subTextDark, // Aplica estilo condicional "subTextDark" cuando se cumple isDark
                    settings.themeMode === 'light' && styles.optionTextSelected, // Selecciona o combina estilos condicionales para el componente
                  ]} // Cierra lista combinada de estilos del componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  ☀️ Claro{/* Texto o expresión visible dentro del componente ("☀️ Claro") */}
                </Text>{/* Cierra bloque de componente Text */}
              </Pressable>{/* Cierra bloque de componente Pressable */}

              <Pressable // Inicia declaración de área táctil personalizable
                onPress={() => handleUpdateSetting({ themeMode: 'dark' })} // Prop onPress: ejecuta acción al tocar el elemento
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.optionButton, // Aplica estilo base "optionButton"
                  isDark && styles.optionButtonDark, // Aplica estilo condicional "optionButtonDark" cuando se cumple isDark
                  settings.themeMode === 'dark' && styles.optionButtonSelected, // Selecciona o combina estilos condicionales para el componente
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[ // Prop style: aplica estilos visuales al componente
                    styles.optionText, // Aplica estilo base "optionText"
                    isDark && styles.subTextDark, // Aplica estilo condicional "subTextDark" cuando se cumple isDark
                    settings.themeMode === 'dark' && styles.optionTextSelected, // Selecciona o combina estilos condicionales para el componente
                  ]} // Cierra lista combinada de estilos del componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  🌙 Oscuro{/* Texto o expresión visible dentro del componente ("🌙 Oscuro") */}
                </Text>{/* Cierra bloque de componente Text */}
              </Pressable>{/* Cierra bloque de componente Pressable */}
            </View>{/* Cierra bloque de componente View */}

            <View style={[styles.switchRow, isDark && styles.switchRowDark]}>{/* Abre caja contenedora de diseño (layout) */}
              <View style={styles.switchLabelBox}>{/* Abre caja contenedora de diseño (layout) */}
                <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                  Modo de tarjetas compactas{/* Texto o expresión visible dentro del componente ("Modo de tarjetas compactas") */}
                </Text>{/* Cierra bloque de componente Text */}
                <Text style={[styles.helperText, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
                  Reduce la altura de las imágenes para ver más recetas en
                  pantalla.{/* Elemento o identificador "pantalla." (pantalla.) */}
                </Text>{/* Cierra bloque de componente Text */}
              </View>{/* Cierra bloque de componente View */}
              <Switch // Inicia declaración de interruptor booleano activado/desactivado
                value={settings.compactCards} // Prop value: valor actual controlado del campo
                onValueChange={(value) => // Asigna prop "onValueChange" al componente
                  handleUpdateSetting({ compactCards: value }) // Guarda y aplica inmediatamente la preferencia seleccionada en Ajustes
                } // Cierra bloque o expresión anterior
                trackColor={{ // Asigna prop "trackColor" al componente
                  false: isDark ? '#382E2B' : '#CCCCCC', // Define propiedad "false" en el objeto actual
                  true: '#C0392B', // Define propiedad "true" en el objeto actual
                }} // Cierra bloque o expresión anterior
              />{/* Cierra etiqueta autocontenida de componente */}
            </View>{/* Cierra bloque de componente View */}
          </View>{/* Cierra bloque de componente View */}

          <View // Inicia declaración de caja contenedora de diseño (layout)
            style={[ // Prop style: aplica estilos visuales al componente
              styles.card, // Aplica estilo base "card"
              isDark && styles.cardDark, // Aplica estilo condicional "cardDark" cuando se cumple isDark
              isWideLayout && styles.cardHalf, // Aplica estilo condicional "cardHalf" cuando se cumple isWideLayout
            ]} // Cierra lista combinada de estilos del componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Seguridad y Actualización de Credenciales{/* Texto o expresión visible dentro del componente ("Seguridad y Actualización de Credenciales") */}
            </Text>{/* Cierra bloque de componente Text */}
            <Text style={[styles.helperText, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Cuenta activa: {session?.email || 'Usuario autenticado'} (ID:{' '}{/* Lee valor opcional de forma segura con respaldo por defecto */}
              {session?.id ?? '-'}){/* Lee valor opcional de forma segura con respaldo por defecto */}
            </Text>{/* Cierra bloque de componente Text */}

            {credentialsError && ( // Inicia bloque de renderizado condicional en JSX
              <View // Inicia declaración de caja contenedora de diseño (layout)
                style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.errorText, isDark && styles.errorTextDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  {credentialsError}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                </Text>{/* Cierra bloque de componente Text */}
              </View> // Cierra bloque de componente View
            )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
            {credentialsMessage && ( // Inicia bloque de renderizado condicional en JSX
              <View // Inicia declaración de caja contenedora de diseño (layout)
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.successBanner, // Aplica estilo base "successBanner"
                  isDark && styles.successBannerDark, // Aplica estilo condicional "successBannerDark" cuando se cumple isDark
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[ // Prop style: aplica estilos visuales al componente
                    styles.successText, // Aplica estilo base "successText"
                    isDark && styles.successTextDark, // Aplica estilo condicional "successTextDark" cuando se cumple isDark
                  ]} // Cierra lista combinada de estilos del componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  {credentialsMessage}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                </Text>{/* Cierra bloque de componente Text */}
              </View> // Cierra bloque de componente View
            )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Contraseña actual *{/* Texto o expresión visible dentro del componente ("Contraseña actual *") */}
            </Text>{/* Cierra bloque de componente Text */}
            <TextInput // Inicia declaración de campo interactivo de entrada de texto
              style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
              placeholder="Ingresa tu contraseña actual" // Prop placeholder: texto guía mostrado cuando el campo está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
              secureTextEntry // Prop booleana activa secureTextEntry: oculta caracteres sensibles de contraseña
              autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
              editable={!updatingCredentials} // Prop editable: indica si el campo permite edición
              value={currentPassword} // Prop value: valor actual controlado del campo
              onChangeText={setCurrentPassword} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
            />{/* Cierra etiqueta autocontenida de componente */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Nuevo correo electrónico *{/* Texto o expresión visible dentro del componente ("Nuevo correo electrónico *") */}
            </Text>{/* Cierra bloque de componente Text */}
            <TextInput // Inicia declaración de campo interactivo de entrada de texto
              style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
              placeholder="nuevo@correo.com" // Prop placeholder: texto guía mostrado cuando el campo está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
              keyboardType="email-address" // Prop keyboardType: tipo de teclado virtual mostrado al usuario
              autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
              editable={!updatingCredentials} // Prop editable: indica si el campo permite edición
              value={newEmail} // Prop value: valor actual controlado del campo
              onChangeText={setNewEmail} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
            />{/* Cierra etiqueta autocontenida de componente */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Nueva contraseña (opcional){/* Texto o expresión visible dentro del componente ("Nueva contraseña (opcional)") */}
            </Text>{/* Cierra bloque de componente Text */}
            <TextInput // Inicia declaración de campo interactivo de entrada de texto
              style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
              placeholder="Dejar vacío para conservar la actual (mín. 4 caracteres)" // Prop placeholder: texto guía mostrado cuando el campo está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
              secureTextEntry // Prop booleana activa secureTextEntry: oculta caracteres sensibles de contraseña
              autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
              editable={!updatingCredentials} // Prop editable: indica si el campo permite edición
              value={newPassword} // Prop value: valor actual controlado del campo
              onChangeText={setNewPassword} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
            />{/* Cierra etiqueta autocontenida de componente */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleUpdateCredentials} // Prop onPress: ejecuta acción al tocar el elemento
              disabled={updatingCredentials} // Prop disabled: deshabilita interacción cuando la condición es verdadera
              style={[ // Prop style: aplica estilos visuales al componente
                styles.primaryButton, // Aplica estilo base "primaryButton"
                updatingCredentials && styles.buttonDisabled, // Aplica estilo condicional "buttonDisabled" cuando se cumple updatingCredentials
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              {updatingCredentials ? ( // Si updating credentials es verdadero, renderiza esta rama en JSX
                <ActivityIndicator color="#FFFFFF" /> // Renderiza indicador giratorio de carga
              ) : ( // Rama alternativa del operador ternario cuando no se cumple la condición
                <Text style={styles.buttonText}>Actualizar credenciales</Text> // Abre componente para renderizar texto en pantalla
              )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
            </Pressable>{/* Cierra bloque de componente Pressable */}
          </View>{/* Cierra bloque de componente View */}
        </View>{/* Cierra bloque de componente View */}

        <View style={[styles.card, isDark && styles.cardDark]}>{/* Abre caja contenedora de diseño (layout) */}
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Acciones de Cuenta y Datos{/* Texto o expresión visible dentro del componente ("Acciones de Cuenta y Datos") */}
          </Text>{/* Cierra bloque de componente Text */}

          <Pressable // Inicia declaración de área táctil personalizable
            onPress={handleResetLocalData} // Prop onPress: ejecuta acción al tocar el elemento
            style={styles.secondaryButton} // Prop style: aplica estilos visuales al componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text style={styles.buttonText}>{/* Abre componente para renderizar texto en pantalla */}
              Restablecer datos locales de prueba{/* Texto o expresión visible dentro del componente ("Restablecer datos locales de prueba") */}
            </Text>{/* Cierra bloque de componente Text */}
          </Pressable>{/* Cierra bloque de componente Pressable */}

          <Pressable onPress={() => handleLogout()} style={styles.dangerButton}>{/* Abre área táctil personalizable */}
            <Text style={styles.buttonText}>Cerrar sesión</Text>{/* Abre componente para renderizar texto en pantalla */}
          </Pressable>{/* Cierra bloque de componente Pressable */}
        </View>{/* Cierra bloque de componente View */}
      </ScrollView>{/* Cierra bloque de componente ScrollView */}
    </KeyboardAvoidingView> // Cierra bloque de componente KeyboardAvoidingView
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función SettingsScreen

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
    maxWidth: 720, // Estilo maxWidth: ancho máximo permitido
    width: '100%', // Estilo width: ancho fijo o porcentual
    alignSelf: 'center', // Estilo alignSelf: anula alineación propia dentro del padre
  }, // Cierra objeto literal
  containerWide: { // Define grupo de estilos para "containerWide"
    maxWidth: 1120, // Estilo maxWidth: ancho máximo permitido
  }, // Cierra objeto literal
  wideGrid: { // Define grupo de estilos para "wideGrid"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    alignItems: 'flex-start', // Estilo alignItems: alinea hijos en el eje cruzado
    gap: 16, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  cardHalf: { // Define grupo de estilos para "cardHalf"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
  }, // Cierra objeto literal
  centered: { // Define grupo de estilos para "centered"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    backgroundColor: '#FAF7F5', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  centeredDark: { // Define grupo de estilos para "centeredDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  card: { // Define grupo de estilos para "card"
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
    borderRadius: 14, // Estilo borderRadius: redondeo de esquinas
    padding: 20, // Estilo padding: espaciado interno en los cuatro lados
    marginBottom: 16, // Estilo marginBottom: margen externo inferior
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
  sectionTitle: { // Define grupo de estilos para "sectionTitle"
    fontSize: 18, // Estilo fontSize: tamaño de fuente en píxeles
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
  helperText: { // Define grupo de estilos para "helperText"
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#666666', // Estilo color: color de texto o icono
    marginTop: 2, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  optionsRow: { // Define grupo de estilos para "optionsRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    flexWrap: 'wrap', // Estilo flexWrap: permite saltar a nueva línea si no cabe
    gap: 8, // Estilo gap: espacio uniforme entre elementos hijos
    marginTop: 4, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  optionButton: { // Define grupo de estilos para "optionButton"
    paddingHorizontal: 14, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
    paddingVertical: 8, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 18, // Estilo borderRadius: redondeo de esquinas
    backgroundColor: '#F3ECE9', // Estilo backgroundColor: color de fondo
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#E2D6D1', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  optionButtonDark: { // Define grupo de estilos para "optionButtonDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
    borderColor: '#382E2B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  optionButtonSelected: { // Define grupo de estilos para "optionButtonSelected"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    borderColor: '#C0392B', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  optionText: { // Define grupo de estilos para "optionText"
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    color: '#4A3833', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  optionTextSelected: { // Define grupo de estilos para "optionTextSelected"
    color: '#FFFFFF', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  switchRow: { // Define grupo de estilos para "switchRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    justifyContent: 'space-between', // Estilo justifyContent: alinea hijos en el eje principal
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginTop: 12, // Estilo marginTop: margen externo superior
    paddingTop: 12, // Estilo paddingTop: espaciado interno superior
    borderTopWidth: 1, // Estilo borderTopWidth: grosor del borde superior
    borderTopColor: '#F0EAE7', // Define propiedad "borderTopColor" en el objeto actual
  }, // Cierra objeto literal
  switchRowDark: { // Define grupo de estilos para "switchRowDark"
    borderTopColor: '#382E2B', // Define propiedad "borderTopColor" en el objeto actual
  }, // Cierra objeto literal
  switchLabelBox: { // Define grupo de estilos para "switchLabelBox"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    paddingRight: 12, // Estilo paddingRight: espaciado interno derecho
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
  errorBanner: { // Define grupo de estilos para "errorBanner"
    backgroundColor: '#FDEDEC', // Estilo backgroundColor: color de fondo
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    padding: 10, // Estilo padding: espaciado interno en los cuatro lados
    marginTop: 10, // Estilo marginTop: margen externo superior
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#F5B7B1', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  errorBannerDark: { // Define grupo de estilos para "errorBannerDark"
    backgroundColor: '#3A1F1E', // Estilo backgroundColor: color de fondo
    borderColor: '#78281F', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  errorText: { // Define grupo de estilos para "errorText"
    color: '#C0392B', // Estilo color: color de texto o icono
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  errorTextDark: { // Define grupo de estilos para "errorTextDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  successBanner: { // Define grupo de estilos para "successBanner"
    backgroundColor: '#E8F8F0', // Estilo backgroundColor: color de fondo
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    padding: 10, // Estilo padding: espaciado interno en los cuatro lados
    marginTop: 10, // Estilo marginTop: margen externo superior
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#A9DFBF', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  successBannerDark: { // Define grupo de estilos para "successBannerDark"
    backgroundColor: '#1B3124', // Estilo backgroundColor: color de fondo
    borderColor: '#27AE60', // Estilo borderColor: color del borde
  }, // Cierra objeto literal
  successText: { // Define grupo de estilos para "successText"
    color: '#1E8449', // Estilo color: color de texto o icono
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  successTextDark: { // Define grupo de estilos para "successTextDark"
    color: '#58D68D', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  primaryButton: { // Define grupo de estilos para "primaryButton"
    backgroundColor: '#27AE60', // Estilo backgroundColor: color de fondo
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginTop: 18, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  secondaryButton: { // Define grupo de estilos para "secondaryButton"
    backgroundColor: '#753333', // Estilo backgroundColor: color de fondo
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginTop: 10, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  dangerButton: { // Define grupo de estilos para "dangerButton"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginTop: 12, // Estilo marginTop: margen externo superior
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
