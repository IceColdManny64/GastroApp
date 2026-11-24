import { useRouter } from 'expo-router'; // Hook de Expo Router para navegar entre rutas públicas y privadas
import { useEffect, useState } from 'react'; // Hooks para verificar sesión previa al montar y manejar estados del formulario
import { // Componentes visuales nativos de React Native usados en la pantalla de acceso
  ActivityIndicator, // Spinner giratorio mostrado dentro del botón mientras valida credenciales
  KeyboardAvoidingView, // Desplaza el formulario hacia arriba cuando el teclado virtual aparece en móvil
  Platform, // Detecta iOS vs Android/Web para ajustar comportamiento de teclado y sombras
  Pressable, // Botón táctil accesible para "Iniciar sesión" y enlace a registro
  ScrollView, // Permite desplazarse cuando la pantalla es pequeña o está en modo horizontal
  StyleSheet, // Compila la hoja de estilos nativa para claro/oscuro y diseño responsivo
  Text, // Único componente permitido para mostrar texto en pantalla en React Native
  TextInput, // Campos controlados de correo y contraseña
  View, // Contenedor Flexbox para cabecera de marca y tarjeta del formulario
  useWindowDimensions, // Lee ancho y alto en vivo para alternar entre diseño vertical y 2 columnas
} from 'react-native'; // Fin de importaciones desde react-native
import { showAlert } from '@/utils/alerts'; // Puente multiplataforma: window.alert en Web y Alert.alert en móvil
import { login } from '@/utils/auth'; // Valida credenciales contra users.json (server.js) o respaldo local y crea token
import { useThemeMode } from '@/utils/preferencesStorage'; // Suscribe el componente en vivo al tema claro/oscuro global
import { getToken, saveToken } from '@/utils/tokenStorage'; // Lee o persiste auth_token en localStorage/SecureStore
import { validateAuthForm } from '@/utils/validators'; // Valida formato de correo y longitud mínima antes de enviar

export default function LoginScreen() { // Pantalla pública de inicio de sesión en la ruta /(auth)/login
  const router = useRouter(); // Instancia de router para saltar a registro o reemplazar ruta tras autenticar
  const isDark = useThemeMode(); // Bandera booleana reactiva que activa la paleta oscura
  const { width, height } = useWindowDimensions(); // Dimensiones actuales de ventana para diseño responsivo
  const isLandscapeCompact = width > height && height < 520; // Detecta celular horizontal con poca altura para compactar cabecera
  const isWideLandscape = width > height && width >= 680; // Detecta tablet/escritorio ancho para acomodar marca y card lado a lado

  const [email, setEmail] = useState(''); // Texto actual escrito en el campo de correo electrónico
  const [password, setPassword] = useState(''); // Texto actual escrito en el campo de contraseña
  const [loading, setLoading] = useState(false); // Bloquea inputs/botón y muestra spinner mientras valida login
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Mensaje de error visible dentro del banner rojo del card

  useEffect(() => { // Revisa al abrir Login si ya existe un token previo guardado en dispositivo
    (async () => { // IIFE asíncrona para consultar almacenamiento sin volver async el callback del efecto
      const token = await getToken(); // Obtiene auth_token desde localStorage (Web) o SecureStore (móvil)
      if (token) { // Si el usuario ya tenía sesión iniciada
        router.replace('/(app)/home'); // Salta directo al catálogo reemplazando historial para no volver al Login
      } // Fin de redirección automática por sesión activa
    })(); // Ejecuta inmediatamente la verificación inicial de token
  }, [router]); // Dependencia estable del router de Expo

  const handleLogin = async () => { // Manejador principal ejecutado al presionar "Iniciar sesión" o Enter en contraseña
    setErrorMessage(null); // Limpia cualquier error anterior antes de validar de nuevo
    const validation = validateAuthForm(email, password); // Comprueba email con regex y contraseña no vacía
    if (!validation.isValid) { // Si algún campo es inválido
      const msg = validation.errorMessage || 'Verifica los datos ingresados.'; // Toma el primer mensaje específico en español
      setErrorMessage(msg); // Muestra el banner rojo en la tarjeta
      showAlert('Datos incompletos', msg); // Muestra alerta nativa o del navegador según plataforma
      return; // Detiene el flujo sin intentar autenticar
    } // Fin de guardia de validación previa

    try { // Inicia autenticación contra server.js (/api/users) o respaldo offline
      setLoading(true); // Bloquea edición de campos y deshabilita el botón durante la petición
      const token = await login(email, password); // Verifica usuario/clave y guarda UserSession completa en dispositivo
      await saveToken(token); // Persiste auth_token para que Index y AppLayout autoricen la entrada
      router.replace('/'); // Regresa al gatekeeper raíz "/", que detectará el token y abrirá /(app)/home
    } catch (err) { // Captura credenciales incorrectas o fallo inesperado
      const msg = // Extrae mensaje legible del error lanzado por login()
        err instanceof Error ? err.message : 'Correo o contraseña incorrectos'; // Respaldo en español si no es Error estándar
      setErrorMessage(msg); // Pinta el motivo en el banner rojo sobre el formulario
      showAlert('Error', 'Correo o contraseña incorrectos'); // Avisa mediante diálogo emergente al usuario
    } finally { // Siempre corre al terminar éxito o error
      setLoading(false); // Reactiva los campos de texto y quita el spinner del botón
    } // Fin del bloque try/catch/finally de autenticación
  }; // Fin de handleLogin

  return ( // Árbol JSX responsivo de la pantalla LoginScreen
    <KeyboardAvoidingView // Evita que el teclado virtual tape los inputs en iOS
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]} // Fondo crema o café oscuro de pantalla completa
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Solo aplica padding extra en iOS donde el teclado cubre la vista
    >{/* Contenedor desplazable interno */}
      <ScrollView // Permite scroll vertical si el teclado o una pantalla pequeña reducen el alto disponible
        contentContainerStyle={[ // Centra verticalmente el contenido o lo compacta en horizontal corto
          styles.scrollContainer, // Centrado vertical y relleno de 20px por defecto
          isLandscapeCompact && styles.scrollContainerLandscape, // Reduce padding vertical en celular horizontal
        ]} // Fin de contentContainerStyle
        keyboardShouldPersistTaps="handled" // Permite tocar el botón "Iniciar sesión" directamente sin cerrar antes el teclado
      >{/* Contenedor maestro adaptable de 1 o 2 columnas */}
        <View // Agrupa cabecera de marca y tarjeta del formulario
          style={[ // Cambia de columna apilada a fila lado a lado en pantallas anchas
            styles.responsiveAuthLayout, // Ancho máximo centrado de 960px
            isWideLandscape && styles.responsiveAuthLayoutRow, // Activa flexDirection: 'row' cuando width >= 680 en horizontal
          ]} // Fin de estilos de layout responsivo
        >{/* Bloque izquierdo o superior con logotipo y eslogan de GastroLab */}
          <View // Encabezado visual de la marca GastroLab
            style={[ // Se apila arriba en vertical o ocupa la columna izquierda en horizontal ancho
              styles.brandHeader, // Centra ícono, título y subtítulo
              isLandscapeCompact && styles.brandHeaderCompact, // Reduce margen inferior cuando la pantalla es muy baja
              isWideLandscape && styles.brandHeaderSide, // Limita ancho a 320px al colocarse al costado izquierdo
            ]} // Fin de estilos de brandHeader
          >{/* Ícono, nombre de marca y subtítulo descriptivo */}
            <Text // Ícono emoji principal de la aplicación culinaria
              style={[ // Ajusta tamaño entre vertical y horizontal compacto
                styles.brandIcon, // Tamaño grande 48px
                isLandscapeCompact && styles.brandIconCompact, // Tamaño reducido 34px en celular horizontal
              ]} // Fin de estilos de brandIcon
            >{/* Ícono culinario */}
              🍲{/* Emoji de olla representativo de GastroLab */}
            </Text>{/* Termina ícono de marca */}
            <Text style={[styles.brandTitle, isDark && styles.brandTitleDark]}>{/* Nombre principal de la app */}
              GastroLab{/* Título visible en vino #753333 o coral en modo oscuro */}
            </Text>{/* Termina título de marca */}
            <Text // Eslogan descriptivo bajo el título
              style={[ // Adapta el gris del subtítulo al modo claro u oscuro
                styles.brandSubtitle, // Gris medio centrado
                isDark && styles.brandSubtitleDark, // Arena claro en tema oscuro
              ]} // Fin de estilos de brandSubtitle
            >{/* Texto de bienvenida */}
              Explora, crea y guarda tus recetas favoritas{/* Descripción corta del propósito de la app */}
            </Text>{/* Termina subtítulo */}
          </View>{/* Termina cabecera de marca */}

          <View // Tarjeta blanca u oscura que aloja el formulario de acceso
            style={[ // Aplica sombra multiplataforma y ancho lateral en desktop/tablet
              styles.card, // Tarjeta con borde arena y sombra suave
              isDark && styles.cardDark, // Fondo #241D1B y borde #382E2B en modo oscuro
              isWideLandscape && styles.cardSide, // Ocupa proporción flex: 1.2 junto al brandHeader
            ]} // Fin de estilos de card
          >{/* Contenido interno del formulario de inicio de sesión */}
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>{/* Encabezado del formulario */}
              Iniciar sesión{/* Título de sección dentro de la tarjeta */}
            </Text>{/* Termina título de sección */}

            {errorMessage && ( // Renderiza el banner de alerta visual solo si ocurrió un error de validación o credenciales
              <View // Caja roja suave de error dentro de la tarjeta
                style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Bordes y fondo rojizos adaptados al tema
              >{/* Mensaje de error devuelto por validateAuthForm o login */}
                <Text // Texto de error legible
                  style={[styles.errorText, isDark && styles.errorTextDark]} // Rojo terracota en claro o coral en oscuro
                >{/* Inserta texto exacto de errorMessage */}
                  {errorMessage}{/* Muestra motivo del fallo al usuario */}
                </Text>{/* Termina texto del error */}
              </View> // Cierra banner condicional de errorMessage
            )}{/* Termina bloque condicional de errorBanner */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta del campo de correo */}
              Correo electrónico{/* Rótulo visible arriba del input */}
            </Text>{/* Termina etiqueta de correo */}
            <TextInput // Campo controlado para ingresar el correo de acceso
              style={[styles.input, isDark && styles.inputDark]} // Caja de entrada adaptada a claro/oscuro
              placeholder="Correo electrónico" // Texto guía cuando el campo está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Contraste legible del placeholder en ambos temas
              keyboardType="email-address" // Abre teclado móvil con acceso rápido a "@" y ".com"
              autoCapitalize="none" // Evita que el teclado convierta la primera letra en mayúscula
              autoCorrect={false} // Desactiva autocorrección que deformaría correos electrónicos
              editable={!loading} // Política de clase: bloquea edición mientras loading es true
              value={email} // Valor controlado enlazado al estado email
              onChangeText={setEmail} // Actualiza estado email con cada carácter tecleado
            />{/* Termina campo de correo electrónico */}

            <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta del campo de contraseña */}
              Contraseña{/* Rótulo visible arriba del campo secreto */}
            </Text>{/* Termina etiqueta de contraseña */}
            <TextInput // Campo controlado oculto para la contraseña
              style={[styles.input, isDark && styles.inputDark]} // Caja de entrada adaptada a claro/oscuro
              placeholder="Contraseña" // Texto guía cuando está vacío
              placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color del placeholder en claro/oscuro
              secureTextEntry // Enmascara los caracteres con puntos por seguridad
              autoCapitalize="none" // Evita mayúscula automática al inicio de la clave
              editable={!loading} // Política de clase: impide editar la clave mientras se autentica
              value={password} // Valor controlado enlazado al estado password
              onChangeText={setPassword} // Actualiza estado password al teclear
              onSubmitEditing={handleLogin} // Permite iniciar sesión directo presionando Enter/Ir en el teclado
            />{/* Termina campo de contraseña */}

            <Pressable // Botón primario para enviar el formulario de inicio de sesión
              onPress={handleLogin} // Dispara validación y autenticación en handleLogin
              disabled={loading} // Deshabilita toques repetidos mientras ya hay una petición en curso
              style={[styles.primaryButton, loading && styles.buttonDisabled]} // Rojo terracota; reduce opacidad al cargar
            >{/* Muestra spinner durante la validación o texto "Iniciar sesión" */}
              {loading ? ( // Si loading está activo muestra ActivityIndicator dentro del botón
                <ActivityIndicator color="#FFFFFF" /> // Indicador blanco giratorio sobre fondo rojo
              ) : ( // Estado normal inactivo
                <Text style={styles.buttonText}>Iniciar sesión</Text> // Etiqueta blanca del botón principal
              )}{/* Termina alternancia entre spinner y texto */}
            </Pressable>{/* Termina botón Iniciar sesión */}

            <Pressable // Enlace secundario para navegar a la pantalla de registro de cuentas nuevas
              onPress={() => router.push('/(auth)/register')} // Apila /(auth)/register permitiendo volver con el botón atrás
              style={styles.linkButton} // Área táctil centrada debajo del botón principal
            >{/* Texto del enlace hacia RegisterScreen */}
              <Text style={[styles.linkText, isDark && styles.linkTextDark]}>{/* Texto destacado en terracota o coral */}
                ¿No tienes cuenta? Regístrate aquí{/* Invitación para usuarios nuevos */}
              </Text>{/* Termina texto de enlace */}
            </Pressable>{/* Termina botón enlace a Registro */}

          </View>{/* Termina tarjeta del formulario */}
        </View>{/* Termina layout responsivo */}
      </ScrollView>{/* Termina contenedor desplazable */}
    </KeyboardAvoidingView> // Fin KeyboardAvoidingView de LoginScreen
  ); // Fin del árbol JSX de LoginScreen
} // Fin de componente LoginScreen

const styles = StyleSheet.create({ // Hoja de estilos nativa de LoginScreen para móvil y Web
  keyboardWrapper: { // Contenedor externo de pantalla completa en modo claro
    flex: 1, // Ocupa todo el alto disponible de la ventana
    backgroundColor: '#FAF7F5', // Fondo crema cálido de la paleta GastroLab
  }, // Fin keyboardWrapper
  keyboardWrapperDark: { // Variante de fondo en modo oscuro
    backgroundColor: '#181312', // Fondo café oscuro profundo
  }, // Fin keyboardWrapperDark
  scrollContainer: { // Contenedor interno del ScrollView
    flexGrow: 1, // Permite centrar verticalmente aunque el contenido sea menor que la pantalla
    justifyContent: 'center', // Centra la tarjeta verticalmente
    padding: 20, // Margen interno alrededor del formulario
  }, // Fin scrollContainer
  scrollContainerLandscape: { // Ajuste para pantallas horizontales de poca altura (teléfono acostado)
    paddingVertical: 12, // Reduce relleno vertical para aprovechar altura
    paddingHorizontal: 24, // Amplía ligeramente relleno lateral
  }, // Fin scrollContainerLandscape
  responsiveAuthLayout: { // Contenedor máximo de la vista de autenticación
    width: '100%', // Se adapta al ancho disponible
    maxWidth: 960, // Evita que en monitores anchos el contenido se estire demasiado
    alignSelf: 'center', // Centra horizontalmente el bloque completo
  }, // Fin responsiveAuthLayout
  responsiveAuthLayoutRow: { // Disposición de 2 columnas en tablet/escritorio horizontal
    flexDirection: 'row', // Coloca brandHeader a la izquierda y card a la derecha
    alignItems: 'center', // Alinea ambos bloques verticalmente al centro
    justifyContent: 'center', // Centra horizontalmente las dos columnas
    gap: 28, // Separación uniforme entre logotipo y tarjeta
  }, // Fin responsiveAuthLayoutRow
  brandHeader: { // Bloque superior con logo, nombre y eslogan
    alignItems: 'center', // Centra los 3 elementos horizontalmente
    marginBottom: 24, // Separación respecto a la tarjeta en modo vertical
  }, // Fin brandHeader
  brandHeaderCompact: { // Ajuste de brandHeader en horizontal compacto
    marginBottom: 12, // Reduce espacio inferior para que quepa todo sin mucho scroll
  }, // Fin brandHeaderCompact
  brandHeaderSide: { // Ajuste cuando brandHeader pasa a la columna izquierda
    flex: 1, // Comparte ancho proporcional con la tarjeta
    maxWidth: 320, // Limita ancho de la columna de marca
    marginBottom: 0, // Sin margen inferior al estar lado a lado
  }, // Fin brandHeaderSide
  brandIcon: { // Tamaño del emoji principal de marca
    fontSize: 48, // Ícono grande destacado en vertical
    marginBottom: 6, // Separación respecto al título GastroLab
  }, // Fin brandIcon
  brandIconCompact: { // Ícono reducido en horizontal compacto
    fontSize: 34, // Menor tamaño para ahorrar espacio vertical
    marginBottom: 2, // Margen mínimo inferior
  }, // Fin brandIconCompact
  brandTitle: { // Tipografía del nombre "GastroLab" en modo claro
    fontSize: 30, // Título grande de marca
    fontWeight: 'bold', // Negrita marcada
    color: '#753333', // Rojo vino corporativo
  }, // Fin brandTitle
  brandTitleDark: { // Color del título de marca en modo oscuro
    color: '#E74C3C', // Rojo terracota luminoso con buen contraste sobre #181312
  }, // Fin brandTitleDark
  brandSubtitle: { // Subtítulo debajo del nombre de la app
    fontSize: 14, // Tamaño legible secundario
    color: '#555555', // Gris medio neutro
    marginTop: 4, // Separación respecto al título
    textAlign: 'center', // Centrado en una o dos líneas
  }, // Fin brandSubtitle
  brandSubtitleDark: { // Subtítulo en modo oscuro
    color: '#B8A9A4', // Tono arena suave legible sobre fondo oscuro
  }, // Fin brandSubtitleDark
  card: { // Tarjeta blanca que envuelve el formulario de Login
    backgroundColor: '#FFFFFF', // Fondo blanco limpio
    borderRadius: 14, // Esquinas redondeadas suaves
    padding: 20, // Espaciado interno uniforme
    borderWidth: 1, // Borde sutil de 1px
    borderColor: '#EAE2DF', // Borde arena cálido
    maxWidth: 480, // Ancho máximo en pantallas verticales
    width: '100%', // Ocupa 100% en teléfonos pequeños
    alignSelf: 'center', // Centrada horizontalmente
    ...Platform.select({ // Sombra compatible entre navegador Web y dispositivos nativos
      web: { // Regla CSS estándar en react-native-web (evita warning deprecated de shadow*)
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Sombra cálida en navegador
      }, // Fin sombra web
      default: { // Sombra nativa para iOS (shadow*) y Android (elevation)
        shadowColor: '#4f2c21', // Sombra café cálida
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento vertical de 2px
        shadowOpacity: 0.15, // Transparencia suave en iOS
        shadowRadius: 4, // Difuminado de 4px
        elevation: 3, // Elevación nativa en Android
      }, // Fin sombra nativa
    }), // Fin Platform.select
  }, // Fin card
  cardDark: { // Variante oscura de la tarjeta del formulario
    backgroundColor: '#241D1B', // Café oscuro de superficie
    borderColor: '#382E2B', // Borde espresso discreto
  }, // Fin cardDark
  cardSide: { // Ajuste de la tarjeta cuando aparece en 2 columnas
    flex: 1.2, // Ligeramente más ancha que la columna de marca
    maxWidth: 500, // Límite máximo en escritorio
  }, // Fin cardSide
  sectionTitle: { // Título "Iniciar sesión" dentro del card
    fontSize: 20, // Tamaño destacado de sección
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café muy oscuro casi negro
    marginBottom: 8, // Separación antes del primer campo o banner
  }, // Fin sectionTitle
  textDark: { // Color de texto principal reutilizado en modo oscuro
    color: '#F7F2F0', // Blanco cálido de alto contraste
  }, // Fin textDark
  errorBanner: { // Contenedor de alerta visual de error en modo claro
    backgroundColor: '#FDEDEC', // Fondo rosado muy suave
    borderRadius: 8, // Bordes redondeados
    padding: 10, // Relleno interno legible
    marginTop: 6, // Separación con el título de sección
    borderWidth: 1, // Borde 1px
    borderColor: '#F5B7B1', // Borde rojo claro
  }, // Fin errorBanner
  errorBannerDark: { // Contenedor de error en modo oscuro
    backgroundColor: '#3A1F1E', // Fondo rojo vino muy oscuro
    borderColor: '#78281F', // Borde rojo oscuro
  }, // Fin errorBannerDark
  errorText: { // Texto dentro del banner de error en claro
    color: '#C0392B', // Rojo terracota intenso
    fontSize: 13, // Tamaño compacto
    fontWeight: '600', // Seminegrita para resaltar el mensaje
  }, // Fin errorText
  errorTextDark: { // Texto del banner de error en oscuro
    color: '#EC7063', // Rojo coral brillante legible sobre fondo oscuro
  }, // Fin errorTextDark
  label: { // Etiquetas de cada TextInput ("Correo electrónico", "Contraseña")
    fontSize: 14, // Tamaño estándar de etiqueta
    fontWeight: '600', // Seminegrita
    marginBottom: 6, // Espacio antes de su caja de texto
    marginTop: 12, // Separación respecto al campo anterior
    color: '#333333', // Gris oscuro
  }, // Fin label
  input: { // Caja de texto en modo claro
    borderWidth: 1, // Borde visible de 1px
    borderColor: '#CCCCCC', // Gris neutro
    borderRadius: 8, // Esquinas redondeadas
    padding: 12, // Área interna cómoda para escribir y tocar
    fontSize: 16, // Tamaño legible (16px evita zoom automático en iOS Safari)
    backgroundColor: '#FAFAFA', // Blanco grisáceo sutil
    color: '#2C1E1B', // Texto escrito en café oscuro
  }, // Fin input
  inputDark: { // Caja de texto en modo oscuro
    backgroundColor: '#181312', // Fondo oscuro igual al lienzo
    borderColor: '#382E2B', // Borde espresso
    color: '#F7F2F0', // Texto escrito en blanco cálido
  }, // Fin inputDark
  primaryButton: { // Botón principal "Iniciar sesión"
    backgroundColor: '#C0392B', // Rojo terracota principal de GastroLab
    paddingVertical: 14, // Altura táctil cómoda
    borderRadius: 8, // Bordes redondeados
    alignItems: 'center', // Centra texto o spinner horizontalmente
    marginTop: 20, // Separación amplia debajo de la contraseña
  }, // Fin primaryButton
  buttonDisabled: { // Modificador aplicado cuando loading es true
    opacity: 0.6, // Atenúa visualmente el botón mientras procesa
  }, // Fin buttonDisabled
  buttonText: { // Texto blanco dentro del botón primario
    color: '#FFFFFF', // Blanco puro contrastante
    fontWeight: '600', // Seminegrita
    fontSize: 16, // Tamaño de botón estándar
  }, // Fin buttonText
  linkButton: { // Botón enlace inferior hacia registro
    marginTop: 16, // Separación debajo del botón principal
    alignItems: 'center', // Centra el enlace
    paddingVertical: 6, // Amplía zona táctil vertical
  }, // Fin linkButton
  linkText: { // Texto del enlace de registro en modo claro
    color: '#C0392B', // Terracota llamativo
    fontSize: 14, // Tamaño legible
    fontWeight: '700', // Negrita para distinguirlo como acción interactiva
  }, // Fin linkText
  linkTextDark: { // Texto del enlace de registro en modo oscuro
    color: '#EC7063', // Rojo coral brillante
  }, // Fin linkTextDark
}); // Fin StyleSheet LoginScreen
