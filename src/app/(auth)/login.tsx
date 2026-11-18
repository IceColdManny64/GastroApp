import { useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useRouter })
import { useEffect, useState } from 'react'; // Importa React y sus hooks ({ useEffect, useState }) para estado y ciclo de vida
import { // Continúa o inicia bloque de importación de módulos
  ActivityIndicator, // Importa "ActivityIndicator" desde react-native
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
import { updateCredentials, verifyEmail } from '@/services/user'; // Importa funciones del servicio de datos (@/services/user)
import { showAlert } from '@/utils/alerts'; // Importa utilidades auxiliares compartidas (@/utils/alerts)
import { login } from '@/utils/auth'; // Importa utilidades auxiliares compartidas (@/utils/auth)
import { useThemeMode } from '@/utils/preferencesStorage'; // Importa utilidades auxiliares compartidas (@/utils/preferencesStorage)
import { getToken, saveToken } from '@/utils/tokenStorage'; // Importa utilidades auxiliares compartidas (@/utils/tokenStorage)
import { isValidEmail, validateAuthForm } from '@/utils/validators'; // Importa utilidades auxiliares compartidas (@/utils/validators)

export default function LoginScreen() { // Declara y exporta la pantalla principal LoginScreen
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDark = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width, height } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isLandscapeCompact = width > height && height < 520; // Declara constante local isLandscapeCompact
  const isWideLandscape = width > height && width >= 680; // Declara constante local isWideLandscape

  const [email, setEmail] = useState(''); // Declara estado reactivo para el correo electrónico
  const [password, setPassword] = useState(''); // Declara estado reactivo para la contraseña
  const [loading, setLoading] = useState(false); // Declara estado reactivo para el indicador de carga
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Declara estado reactivo para error message

  const [showRecovery, setShowRecovery] = useState(false); // Declara estado reactivo para la visibilidad del panel de recuperación
  const [recoveryEmail, setRecoveryEmail] = useState(''); // Declara estado reactivo para recovery email
  const [verifiedUserId, setVerifiedUserId] = useState<number | null>(null); // Declara estado reactivo para verified user id
  const [newPassword, setNewPassword] = useState(''); // Declara estado reactivo para la nueva contraseña
  const [recoverySubmitting, setRecoverySubmitting] = useState(false); // Declara estado reactivo para recovery submitting
  const [recoveryError, setRecoveryError] = useState<string | null>(null); // Declara estado reactivo para recovery error
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null); // Declara estado reactivo para recovery success

  useEffect(() => { // Registra efecto secundario para sincronizar datos o eventos
    (async () => { // Inicia función asíncrona autoejecutable dentro del efecto
      const token = await getToken(); // Declara constante local token
      if (token) { // Evalúa condición lógica antes de ejecutar este bloque
        router.replace('/(app)/home'); // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
      } // Cierra rama del condicional if/else
    })(); // Ejecuta de inmediato y cierra la función asíncrona
  }, [router]); // Cierra efecto o memoización; se re-ejecuta si cambia [router]

  const handleLogin = async () => { // Define manejador o función handleLogin
    setErrorMessage(null); // Actualiza error message
    const validation = validateAuthForm(email, password); // Declara constante local validation
    if (!validation.isValid) { // Evalúa condición lógica antes de ejecutar este bloque
      const msg = validation.errorMessage || 'Verifica los datos ingresados.'; // Lee valor opcional de forma segura con respaldo por defecto
      setErrorMessage(msg); // Actualiza error message
      showAlert('Datos incompletos', msg); // Muestra alerta multiplataforma informativa o de error al usuario
      return; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    try { // Inicia bloque try para capturar posibles errores de ejecución
      setLoading(true); // Actualiza el indicador de carga
      const token = await login(email, password); // Declara constante local token
      await saveToken(token); // Espera resolución asíncrona de la operación antes de continuar
      router.replace('/'); // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      const msg = // Declara constante local msg
        err instanceof Error ? err.message : 'Correo o contraseña incorrectos'; // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
      setErrorMessage(msg); // Actualiza error message
      showAlert('Error', 'Correo o contraseña incorrectos'); // Muestra alerta multiplataforma informativa o de error al usuario
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setLoading(false); // Actualiza el indicador de carga
    } // Cierra bloque try o finally
  }; // Cierra bloque o expresión anterior

  const handleForgotPassword = async () => { // Define manejador o función handleForgotPassword
    setRecoveryError(null); // Actualiza recovery error
    setRecoverySuccess(null); // Actualiza recovery success

    if (!isValidEmail(recoveryEmail)) { // Evalúa condición lógica antes de ejecutar este bloque
      setRecoveryError('Por favor ingresa un correo electrónico válido.'); // Actualiza recovery error
      return; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    try { // Inicia bloque try para capturar posibles errores de ejecución
      setRecoverySubmitting(true); // Actualiza recovery submitting
      if (!verifiedUserId) { // Evalúa condición lógica antes de ejecutar este bloque
        const res = await verifyEmail(recoveryEmail); // Declara constante local res
        if (res.exists && res.id) { // Evalúa condición lógica antes de ejecutar este bloque
          setVerifiedUserId(Number(res.id)); // Actualiza verified user id
          setRecoverySuccess( // Actualiza recovery success
            'Correo verificado. Ingresa tu nueva contraseña a continuación.' // Cadena de texto usada como parámetro o mensaje ("Correo verificado. Ingresa tu nueva contraseña a")
          ); // Cierra bloque o expresión anterior
        } else { // Rama alternativa ejecutada cuando no se cumple el if
          setRecoveryError( // Actualiza recovery error
            'No encontramos ninguna cuenta con ese correo electrónico.' // Cadena de texto usada como parámetro o mensaje ("No encontramos ninguna cuenta con ese correo ele")
          ); // Cierra bloque o expresión anterior
        } // Cierra rama del condicional if/else
      } else { // Rama alternativa ejecutada cuando no se cumple el if
        if (newPassword.trim().length < 4) { // Evalúa condición lógica antes de ejecutar este bloque
          setRecoveryError( // Actualiza recovery error
            'La nueva contraseña debe tener al menos 4 caracteres.' // Cadena de texto usada como parámetro o mensaje ("La nueva contraseña debe tener al menos 4 caract")
          ); // Cierra bloque o expresión anterior
          return; // Devuelve resultado o detiene ejecución temprana de la función
        } // Cierra rama del condicional if/else
        await updateCredentials(verifiedUserId, recoveryEmail, newPassword); // Actualiza correo o contraseña del usuario en el microservicio
        setRecoverySuccess( // Actualiza recovery success
          'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' // Cadena de texto usada como parámetro o mensaje ("Contraseña actualizada correctamente. Ya puedes ")
        ); // Cierra bloque o expresión anterior
        setEmail(recoveryEmail.trim()); // Actualiza el correo electrónico
        setPassword(''); // Actualiza la contraseña
        setVerifiedUserId(null); // Actualiza verified user id
        setNewPassword(''); // Actualiza la nueva contraseña
        setShowRecovery(false); // Actualiza la visibilidad del panel de recuperación
        showAlert( // Muestra alerta multiplataforma informativa o de error al usuario
          'Contraseña actualizada', // Cadena de texto usada como parámetro o mensaje ("Contraseña actualizada")
          'Tu contraseña se actualizó con éxito. Inicia sesión con tu nueva clave.' // Cadena de texto usada como parámetro o mensaje ("Tu contraseña se actualizó con éxito. Inicia ses")
        ); // Cierra bloque o expresión anterior
      } // Cierra rama del condicional if/else
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      setRecoveryError( // Actualiza recovery error
        err instanceof Error // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
          ? err.message // Si es instancia Error, extrae su mensaje descriptivo
          : 'No se pudo completar la recuperación de contraseña.' // Valor o rama devuelta cuando la condición ternaria es falsa
      ); // Cierra bloque o expresión anterior
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setRecoverySubmitting(false); // Actualiza recovery submitting
    } // Cierra bloque try o finally
  }; // Cierra bloque o expresión anterior

  return ( // Inicia el árbol JSX retornado por el componente
    <KeyboardAvoidingView // Inicia declaración de contenedor que evita que el teclado tape entradas
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]} // Prop style: aplica estilos visuales al componente
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Prop behavior: ajuste de teclado según plataforma (iOS/Android)
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <ScrollView // Inicia declaración de contenedor con desplazamiento vertical
        contentContainerStyle={[ // Prop contentContainerStyle: estilos del contenedor interno desplazable
          styles.scrollContainer, // Aplica estilo base "scrollContainer"
          isLandscapeCompact && styles.scrollContainerLandscape, // Aplica estilo condicional "scrollContainerLandscape" cuando se cumple isLandscapeCompact
        ]} // Cierra lista combinada de estilos del componente
        keyboardShouldPersistTaps="handled" // Prop keyboardShouldPersistTaps: mantiene toques activos aunque el teclado esté abierto
      >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
        <View // Inicia declaración de caja contenedora de diseño (layout)
          style={[ // Prop style: aplica estilos visuales al componente
            styles.responsiveAuthLayout, // Aplica estilo base "responsiveAuthLayout"
            isWideLandscape && styles.responsiveAuthLayoutRow, // Aplica estilo condicional "responsiveAuthLayoutRow" cuando se cumple isWideLandscape
          ]} // Cierra lista combinada de estilos del componente
        >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
          <View // Inicia declaración de caja contenedora de diseño (layout)
            style={[ // Prop style: aplica estilos visuales al componente
              styles.brandHeader, // Aplica estilo base "brandHeader"
              isLandscapeCompact && styles.brandHeaderCompact, // Aplica estilo condicional "brandHeaderCompact" cuando se cumple isLandscapeCompact
              isWideLandscape && styles.brandHeaderSide, // Aplica estilo condicional "brandHeaderSide" cuando se cumple isWideLandscape
            ]} // Cierra lista combinada de estilos del componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text // Inicia declaración de componente para renderizar texto en pantalla
              style={[ // Prop style: aplica estilos visuales al componente
                styles.brandIcon, // Aplica estilo base "brandIcon"
                isLandscapeCompact && styles.brandIconCompact, // Aplica estilo condicional "brandIconCompact" cuando se cumple isLandscapeCompact
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              🍲{/* Texto o expresión visible dentro del componente ("🍲") */}
            </Text>{/* Cierra bloque de componente Text */}
            <Text style={[styles.brandTitle, isDark && styles.brandTitleDark]}>{/* Abre componente para renderizar texto en pantalla */}
              GastroLab{/* Elemento o identificador "GastroLab" (gastro lab) */}
            </Text>{/* Cierra bloque de componente Text */}
            <Text // Inicia declaración de componente para renderizar texto en pantalla
              style={[ // Prop style: aplica estilos visuales al componente
                styles.brandSubtitle, // Aplica estilo base "brandSubtitle"
                isDark && styles.brandSubtitleDark, // Aplica estilo condicional "brandSubtitleDark" cuando se cumple isDark
              ]} // Cierra lista combinada de estilos del componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              Explora, crea y guarda tus recetas favoritas{/* Texto o expresión visible dentro del componente ("Explora, crea y guarda tus recetas favorit") */}
            </Text>{/* Cierra bloque de componente Text */}
          </View>{/* Cierra bloque de componente View */}

          <View // Inicia declaración de caja contenedora de diseño (layout)
            style={[ // Prop style: aplica estilos visuales al componente
              styles.card, // Aplica estilo base "card"
              isDark && styles.cardDark, // Aplica estilo condicional "cardDark" cuando se cumple isDark
              isWideLandscape && styles.cardSide, // Aplica estilo condicional "cardSide" cuando se cumple isWideLandscape
            ]} // Cierra lista combinada de estilos del componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Iniciar sesión{/* Texto o expresión visible dentro del componente ("Iniciar sesión") */}
            </Text>{/* Cierra bloque de componente Text */}

            {errorMessage && ( // Inicia bloque de renderizado condicional en JSX
              <View // Inicia declaración de caja contenedora de diseño (layout)
                style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Prop style: aplica estilos visuales al componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.errorText, isDark && styles.errorTextDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  {errorMessage}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                </Text>{/* Cierra bloque de componente Text */}
              </View> // Cierra bloque de componente View
            )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Correo electrónico{/* Texto o expresión visible dentro del componente ("Correo electrónico") */}
            </Text>{/* Cierra bloque de componente Text */}
            <TextInput // Inicia declaración de campo interactivo de entrada de texto
              style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
              placeholder="Correo electrónico" // Prop placeholder: texto guía mostrado cuando el campo está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
              keyboardType="email-address" // Prop keyboardType: tipo de teclado virtual mostrado al usuario
              autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
              autoCorrect={false} // Prop autoCorrect: activa o desactiva autocorrección del teclado
              editable={!loading} // Prop editable: indica si el campo permite edición
              value={email} // Prop value: valor actual controlado del campo
              onChangeText={setEmail} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
            />{/* Cierra etiqueta autocontenida de componente */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
              Contraseña{/* Texto o expresión visible dentro del componente ("Contraseña") */}
            </Text>{/* Cierra bloque de componente Text */}
            <TextInput // Inicia declaración de campo interactivo de entrada de texto
              style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
              placeholder="Contraseña" // Prop placeholder: texto guía mostrado cuando el campo está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
              secureTextEntry // Prop booleana activa secureTextEntry: oculta caracteres sensibles de contraseña
              autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
              editable={!loading} // Prop editable: indica si el campo permite edición
              value={password} // Prop value: valor actual controlado del campo
              onChangeText={setPassword} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
              onSubmitEditing={handleLogin} // Prop onSubmitEditing: maneja el envío al presionar Enter/Listo en teclado
            />{/* Cierra etiqueta autocontenida de componente */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={handleLogin} // Prop onPress: ejecuta acción al tocar el elemento
              disabled={loading} // Prop disabled: deshabilita interacción cuando la condición es verdadera
              style={[styles.primaryButton, loading && styles.buttonDisabled]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              {loading ? ( // Si el indicador de carga es verdadero, renderiza esta rama en JSX
                <ActivityIndicator color="#FFFFFF" /> // Renderiza indicador giratorio de carga
              ) : ( // Rama alternativa del operador ternario cuando no se cumple la condición
                <Text style={styles.buttonText}>Iniciar sesión</Text> // Abre componente para renderizar texto en pantalla
              )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
            </Pressable>{/* Cierra bloque de componente Pressable */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={() => router.push('/(auth)/register')} // Navega agregando la nueva pantalla al historial
              style={styles.linkButton} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={[styles.linkText, isDark && styles.linkTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
                ¿No tienes cuenta? Regístrate aquí{/* Texto o expresión visible dentro del componente ("¿No tienes cuenta? Regístrate aquí") */}
              </Text>{/* Cierra bloque de componente Text */}
            </Pressable>{/* Cierra bloque de componente Pressable */}

            <Pressable // Inicia declaración de área táctil personalizable
              onPress={() => { // Prop onPress: ejecuta acción al tocar el elemento
                setShowRecovery((prev) => !prev); // Actualiza la visibilidad del panel de recuperación
                setRecoveryEmail(email); // Actualiza recovery email
                setVerifiedUserId(null); // Actualiza verified user id
                setRecoveryError(null); // Actualiza recovery error
                setRecoverySuccess(null); // Actualiza recovery success
              }} // Cierra bloque o expresión anterior
              style={styles.secondaryLinkButton} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text // Inicia declaración de componente para renderizar texto en pantalla
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.secondaryLinkText, // Aplica estilo base "secondaryLinkText"
                  isDark && styles.secondaryLinkTextDark, // Aplica estilo condicional "secondaryLinkTextDark" cuando se cumple isDark
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                ¿Olvidaste tu contraseña?{/* Texto o expresión visible dentro del componente ("¿Olvidaste tu contraseña?") */}
              </Text>{/* Cierra bloque de componente Text */}
            </Pressable>{/* Cierra bloque de componente Pressable */}

            {showRecovery && ( // Inicia bloque de renderizado condicional en JSX
              <View // Inicia declaración de caja contenedora de diseño (layout)
                style={[ // Prop style: aplica estilos visuales al componente
                  styles.recoveryContainer, // Aplica estilo base "recoveryContainer"
                  isDark && styles.recoveryContainerDark, // Aplica estilo condicional "recoveryContainerDark" cuando se cumple isDark
                ]} // Cierra lista combinada de estilos del componente
              >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.recoveryTitle, isDark && styles.textDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  Recuperación de contraseña{/* Texto o expresión visible dentro del componente ("Recuperación de contraseña") */}
                </Text>{/* Cierra bloque de componente Text */}
                <Text // Inicia declaración de componente para renderizar texto en pantalla
                  style={[styles.recoveryHelp, isDark && styles.subTextDark]} // Prop style: aplica estilos visuales al componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  Verifica tu correo registrado para asignar una nueva
                  contraseña.{/* Texto o expresión visible dentro del componente ("contraseña.") */}
                </Text>{/* Cierra bloque de componente Text */}

                {recoveryError && ( // Inicia bloque de renderizado condicional en JSX
                  <Text // Inicia declaración de componente para renderizar texto en pantalla
                    style={[styles.errorText, isDark && styles.errorTextDark]} // Prop style: aplica estilos visuales al componente
                  >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                    {recoveryError}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                  </Text> // Cierra bloque de componente Text
                )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
                {recoverySuccess && ( // Inicia bloque de renderizado condicional en JSX
                  <Text // Inicia declaración de componente para renderizar texto en pantalla
                    style={[ // Prop style: aplica estilos visuales al componente
                      styles.successText, // Aplica estilo base "successText"
                      isDark && styles.successTextDark, // Aplica estilo condicional "successTextDark" cuando se cumple isDark
                    ]} // Cierra lista combinada de estilos del componente
                  >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                    {recoverySuccess}{/* Inserta expresión JavaScript evaluada dentro del JSX */}
                  </Text> // Cierra bloque de componente Text
                )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

                <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                  Correo registrado{/* Texto o expresión visible dentro del componente ("Correo registrado") */}
                </Text>{/* Cierra bloque de componente Text */}
                <TextInput // Inicia declaración de campo interactivo de entrada de texto
                  style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
                  placeholder="Correo electrónico" // Prop placeholder: texto guía mostrado cuando el campo está vacío
                  placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
                  keyboardType="email-address" // Prop keyboardType: tipo de teclado virtual mostrado al usuario
                  autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
                  editable={!verifiedUserId && !recoverySubmitting} // Prop editable: indica si el campo permite edición
                  value={recoveryEmail} // Prop value: valor actual controlado del campo
                  onChangeText={setRecoveryEmail} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
                />{/* Cierra etiqueta autocontenida de componente */}

                {verifiedUserId && ( // Inicia bloque de renderizado condicional en JSX
                  <>{/* Abre fragmento React (<>...</>) para agrupar hijos sin contenedor extra */}
                    <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                      Nueva contraseña{/* Texto o expresión visible dentro del componente ("Nueva contraseña") */}
                    </Text>{/* Cierra bloque de componente Text */}
                    <TextInput // Inicia declaración de campo interactivo de entrada de texto
                      style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
                      placeholder="Mínimo 4 caracteres" // Prop placeholder: texto guía mostrado cuando el campo está vacío
                      placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
                      secureTextEntry // Prop booleana activa secureTextEntry: oculta caracteres sensibles de contraseña
                      autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
                      editable={!recoverySubmitting} // Prop editable: indica si el campo permite edición
                      value={newPassword} // Prop value: valor actual controlado del campo
                      onChangeText={setNewPassword} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
                    />{/* Cierra etiqueta autocontenida de componente */}
                  </> // Cierra fragmento React (<>...</>)
                )}{/* Cierra bloque de renderizado condicional o iteración JSX */}

                <Pressable // Inicia declaración de área táctil personalizable
                  onPress={handleForgotPassword} // Prop onPress: ejecuta acción al tocar el elemento
                  disabled={recoverySubmitting} // Prop disabled: deshabilita interacción cuando la condición es verdadera
                  style={[ // Prop style: aplica estilos visuales al componente
                    styles.recoveryButton, // Aplica estilo base "recoveryButton"
                    recoverySubmitting && styles.buttonDisabled, // Aplica estilo condicional "buttonDisabled" cuando se cumple recoverySubmitting
                  ]} // Cierra lista combinada de estilos del componente
                >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
                  {recoverySubmitting ? ( // Si recovery submitting es verdadero, renderiza esta rama en JSX
                    <ActivityIndicator color="#FFFFFF" /> // Renderiza indicador giratorio de carga
                  ) : ( // Rama alternativa del operador ternario cuando no se cumple la condición
                    <Text style={styles.buttonText}>{/* Abre componente para renderizar texto en pantalla */}
                      {verifiedUserId // Inicia evaluación JSX usando verified user id
                        ? 'Guardar nueva contraseña' // Valor o rama devuelta cuando la condición ternaria es verdadera
                        : 'Verificar correo'}{/* Valor o rama devuelta cuando la condición ternaria es falsa */}
                    </Text> // Cierra bloque de componente Text
                  )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
                </Pressable>{/* Cierra bloque de componente Pressable */}
              </View> // Cierra bloque de componente View
            )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
          </View>{/* Cierra bloque de componente View */}
        </View>{/* Cierra bloque de componente View */}
      </ScrollView>{/* Cierra bloque de componente ScrollView */}
    </KeyboardAvoidingView> // Cierra bloque de componente KeyboardAvoidingView
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función LoginScreen

const styles = StyleSheet.create({ // Inicia definición optimizada de estilos visuales con StyleSheet.create
  keyboardWrapper: { // Define grupo de estilos para "keyboardWrapper"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    backgroundColor: '#FAF7F5', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  keyboardWrapperDark: { // Define grupo de estilos para "keyboardWrapperDark"
    backgroundColor: '#181312', // Estilo backgroundColor: color de fondo
  }, // Cierra objeto literal
  scrollContainer: { // Define grupo de estilos para "scrollContainer"
    flexGrow: 1, // Estilo flexGrow: permite crecer para llenar el espacio
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    padding: 20, // Estilo padding: espaciado interno en los cuatro lados
  }, // Cierra objeto literal
  scrollContainerLandscape: { // Define grupo de estilos para "scrollContainerLandscape"
    paddingVertical: 12, // Estilo paddingVertical: espaciado interno superior e inferior
    paddingHorizontal: 24, // Estilo paddingHorizontal: espaciado interno izquierdo y derecho
  }, // Cierra objeto literal
  responsiveAuthLayout: { // Define grupo de estilos para "responsiveAuthLayout"
    width: '100%', // Estilo width: ancho fijo o porcentual
    maxWidth: 960, // Estilo maxWidth: ancho máximo permitido
    alignSelf: 'center', // Estilo alignSelf: anula alineación propia dentro del padre
  }, // Cierra objeto literal
  responsiveAuthLayoutRow: { // Define grupo de estilos para "responsiveAuthLayoutRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    justifyContent: 'center', // Estilo justifyContent: alinea hijos en el eje principal
    gap: 28, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  brandHeader: { // Define grupo de estilos para "brandHeader"
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginBottom: 24, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  brandHeaderCompact: { // Define grupo de estilos para "brandHeaderCompact"
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  brandHeaderSide: { // Define grupo de estilos para "brandHeaderSide"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
    maxWidth: 320, // Estilo maxWidth: ancho máximo permitido
    marginBottom: 0, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  brandIcon: { // Define grupo de estilos para "brandIcon"
    fontSize: 48, // Estilo fontSize: tamaño de fuente en píxeles
    marginBottom: 6, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  brandIconCompact: { // Define grupo de estilos para "brandIconCompact"
    fontSize: 34, // Estilo fontSize: tamaño de fuente en píxeles
    marginBottom: 2, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
  brandTitle: { // Define grupo de estilos para "brandTitle"
    fontSize: 30, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#753333', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  brandTitleDark: { // Define grupo de estilos para "brandTitleDark"
    color: '#E74C3C', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  brandSubtitle: { // Define grupo de estilos para "brandSubtitle"
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#555555', // Estilo color: color de texto o icono
    marginTop: 4, // Estilo marginTop: margen externo superior
    textAlign: 'center', // Estilo textAlign: alineación horizontal del texto
  }, // Cierra objeto literal
  brandSubtitleDark: { // Define grupo de estilos para "brandSubtitleDark"
    color: '#B8A9A4', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  card: { // Define grupo de estilos para "card"
    backgroundColor: '#FFFFFF', // Estilo backgroundColor: color de fondo
    borderRadius: 14, // Estilo borderRadius: redondeo de esquinas
    padding: 20, // Estilo padding: espaciado interno en los cuatro lados
    borderWidth: 1, // Estilo borderWidth: grosor del borde
    borderColor: '#EAE2DF', // Estilo borderColor: color del borde
    maxWidth: 480, // Estilo maxWidth: ancho máximo permitido
    width: '100%', // Estilo width: ancho fijo o porcentual
    alignSelf: 'center', // Estilo alignSelf: anula alineación propia dentro del padre
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
  cardSide: { // Define grupo de estilos para "cardSide"
    flex: 1.2, // Estilo flex: ocupa espacio proporcional disponible
    maxWidth: 500, // Estilo maxWidth: ancho máximo permitido
  }, // Cierra objeto literal
  sectionTitle: { // Define grupo de estilos para "sectionTitle"
    fontSize: 20, // Estilo fontSize: tamaño de fuente en píxeles
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
  errorBanner: { // Define grupo de estilos para "errorBanner"
    backgroundColor: '#FDEDEC', // Estilo backgroundColor: color de fondo
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    padding: 10, // Estilo padding: espaciado interno en los cuatro lados
    marginTop: 6, // Estilo marginTop: margen externo superior
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
  successText: { // Define grupo de estilos para "successText"
    color: '#27AE60', // Estilo color: color de texto o icono
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    marginTop: 4, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  successTextDark: { // Define grupo de estilos para "successTextDark"
    color: '#58D68D', // Estilo color: color de texto o icono
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
  primaryButton: { // Define grupo de estilos para "primaryButton"
    backgroundColor: '#C0392B', // Estilo backgroundColor: color de fondo
    paddingVertical: 14, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginTop: 20, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  recoveryButton: { // Define grupo de estilos para "recoveryButton"
    backgroundColor: '#753333', // Estilo backgroundColor: color de fondo
    paddingVertical: 12, // Estilo paddingVertical: espaciado interno superior e inferior
    borderRadius: 8, // Estilo borderRadius: redondeo de esquinas
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    marginTop: 14, // Estilo marginTop: margen externo superior
  }, // Cierra objeto literal
  buttonDisabled: { // Define grupo de estilos para "buttonDisabled"
    opacity: 0.6, // Estilo opacity: nivel de transparencia
  }, // Cierra objeto literal
  buttonText: { // Define grupo de estilos para "buttonText"
    color: '#FFFFFF', // Estilo color: color de texto o icono
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
  }, // Cierra objeto literal
  linkButton: { // Define grupo de estilos para "linkButton"
    marginTop: 16, // Estilo marginTop: margen externo superior
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    paddingVertical: 6, // Estilo paddingVertical: espaciado interno superior e inferior
  }, // Cierra objeto literal
  linkText: { // Define grupo de estilos para "linkText"
    color: '#C0392B', // Estilo color: color de texto o icono
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  linkTextDark: { // Define grupo de estilos para "linkTextDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  secondaryLinkButton: { // Define grupo de estilos para "secondaryLinkButton"
    marginTop: 6, // Estilo marginTop: margen externo superior
    alignItems: 'center', // Estilo alignItems: alinea hijos en el eje cruzado
    paddingVertical: 4, // Estilo paddingVertical: espaciado interno superior e inferior
  }, // Cierra objeto literal
  secondaryLinkText: { // Define grupo de estilos para "secondaryLinkText"
    color: '#753333', // Estilo color: color de texto o icono
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '600', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  secondaryLinkTextDark: { // Define grupo de estilos para "secondaryLinkTextDark"
    color: '#B8A9A4', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  recoveryContainer: { // Define grupo de estilos para "recoveryContainer"
    marginTop: 14, // Estilo marginTop: margen externo superior
    paddingTop: 14, // Estilo paddingTop: espaciado interno superior
    borderTopWidth: 1, // Estilo borderTopWidth: grosor del borde superior
    borderTopColor: '#EAE2DF', // Define propiedad "borderTopColor" en el objeto actual
  }, // Cierra objeto literal
  recoveryContainerDark: { // Define grupo de estilos para "recoveryContainerDark"
    borderTopColor: '#382E2B', // Define propiedad "borderTopColor" en el objeto actual
  }, // Cierra objeto literal
  recoveryTitle: { // Define grupo de estilos para "recoveryTitle"
    fontSize: 16, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  recoveryHelp: { // Define grupo de estilos para "recoveryHelp"
    fontSize: 13, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#666666', // Estilo color: color de texto o icono
    marginTop: 4, // Estilo marginTop: margen externo superior
    marginBottom: 6, // Estilo marginBottom: margen externo inferior
  }, // Cierra objeto literal
}); // Cierra bloque o expresión anterior
