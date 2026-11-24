import { useRouter } from 'expo-router'; // Hook de navegación para volver al Login tras crear la cuenta
import { useState } from 'react'; // Hook para guardar inputs, estado de envío y error de registro
import { // Componentes visuales nativos de React Native para el formulario de registro
  ActivityIndicator, // Spinner blanco mostrado dentro del botón mientras registra en disco/caché
  KeyboardAvoidingView, // Desplaza la vista hacia arriba cuando aparece el teclado en móvil
  Platform, // Distingue iOS/Web/Android para teclado y sombras de la tarjeta
  Pressable, // Botones táctiles para "Registrarme" y enlace de regreso a Login
  ScrollView, // Permite desplazarse si el teclado o la orientación horizontal reducen la altura
  StyleSheet, // Compila hoja de estilos nativa para claro/oscuro y diseño de 1 o 2 columnas
  Text, // Componente obligatorio para cualquier texto mostrado en pantalla
  TextInput, // Campos controlados de correo, contraseña y confirmación
  View, // Contenedor Flexbox de tarjetas, columnas de contraseñas y banner de error
  useWindowDimensions, // Detecta ancho/alto en tiempo real para dividir contraseñas en 2 columnas
} from 'react-native'; // Fin de importaciones desde react-native
import { showAlert } from '@/utils/alerts'; // Muestra avisos compatibles con Web (window.alert) y móvil (Alert.alert)
import { registerUser } from '@/utils/auth'; // Envía POST /api/users a server.js (o guarda localmente en modo offline)
import { useThemeMode } from '@/utils/preferencesStorage'; // Suscribe esta pantalla al cambio inmediato de Tema Oscuro
import { validateAuthForm } from '@/utils/validators'; // Valida correo, mínimo 4 caracteres y coincidencia de contraseñas

export default function RegisterScreen() { // Pantalla pública de alta de nuevos usuarios en /(auth)/register
  const router = useRouter(); // Instancia de router para regresar a /(auth)/login
  const isDark = useThemeMode(); // Bandera booleana reactiva de modo oscuro
  const { width, height } = useWindowDimensions(); // Dimensiones actuales de pantalla para responsividad
  const isLandscapeCompact = width > height && height < 520; // Compacta márgenes en móvil horizontal de baja altura
  const isTwoColFields = width >= 620; // En pantallas >= 620px coloca Contraseña y Confirmar lado a lado

  const [email, setEmail] = useState(''); // Correo electrónico del nuevo usuario
  const [password, setPassword] = useState(''); // Contraseña nueva (mínimo 4 caracteres)
  const [confirmPassword, setConfirmPassword] = useState(''); // Repetición de contraseña para evitar errores de dedo
  const [loading, setLoading] = useState(false); // Deshabilita campos/botón y muestra spinner durante el registro
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Mensaje de error mostrado dentro del banner rojo

  const handleRegister = async () => { // Valida campos y da de alta la cuenta al presionar "Registrarme"
    setErrorMessage(null); // Limpia errores de intentos anteriores
    const validation = validateAuthForm(email, password, { // Ejecuta reglas estrictas en modo registro
      isRegister: true, // Activa mínimo de 4 caracteres en contraseña
      confirmPassword, // Exige que confirmPassword coincida exactamente con password
    }); // Fin de validación previa

    if (!validation.isValid) { // Si falló formato de correo, longitud o coincidencia de contraseñas
      const msg = validation.errorMessage || 'Verifica los datos ingresados.'; // Toma el primer error específico
      setErrorMessage(msg); // Muestra el banner rojo dentro de la tarjeta
      showAlert('Datos inválidos', msg); // Lanza alerta informativa al usuario
      return; // Detiene la operación antes de llamar al servidor
    } // Fin de guardia de validación

    try { // Intenta registrar el usuario en src/data/users.json vía server.js (o respaldo offline)
      setLoading(true); // Bloquea inputs y muestra spinner en el botón
      await registerUser(email, password); // Llama POST /api/users; lanza error si el correo ya existe (409)
      showAlert( // Confirma el alta exitosa antes de llevar al usuario al Login
        'Cuenta creada', // Título de la alerta
        'Tu cuenta ha sido registrada exitosamente. Ahora puedes iniciar sesión.' // Mensaje en español latino
      ); // Fin de showAlert
      router.replace('/(auth)/login'); // Reemplaza la ruta actual para que entre con su nueva cuenta en Login
    } catch (err) { // Captura correo duplicado (409) u otro error al guardar
      const msg = // Lee el mensaje exacto del servidor o usa texto por defecto
        err instanceof Error ? err.message : 'No se pudo completar el registro.'; // Respaldo si no es instancia Error
      setErrorMessage(msg); // Muestra el fallo en el banner rojo
      showAlert('Error de registro', msg); // Alerta también mediante cuadro emergente
    } finally { // Siempre se ejecuta tras éxito o fallo
      setLoading(false); // Desbloquea inputs y oculta el spinner
    } // Fin de try/catch/finally
  }; // Fin de handleRegister

  return ( // Árbol visual responsivo del formulario de registro
    <KeyboardAvoidingView // Evita que el teclado de iOS cubra los campos inferiores
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]} // Fondo claro u oscuro completo
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Padding automático solo en iOS
    >{/* ScrollView para permitir desplazamiento vertical en pantallas pequeñas */}
      <ScrollView // Contenedor desplazable del formulario
        contentContainerStyle={[ // Centra verticalmente la tarjeta o la ajusta en móvil horizontal
          styles.scrollContainer, // Centrado y padding de 20px
          isLandscapeCompact && styles.scrollContainerLandscape, // Padding vertical reducido en landscape bajo
        ]} // Fin de contentContainerStyle
        keyboardShouldPersistTaps="handled" // Permite pulsar "Registrarme" sin necesitar dos toques cuando hay teclado abierto
      >{/* Tarjeta principal del formulario de registro */}
        <View // Contenedor blanco/oscuro con borde y sombra
          style={[ // Se ensancha a 640px cuando las contraseñas van en 2 columnas
            styles.card, // Tarjeta base de 480px máximo
            isDark && styles.cardDark, // Paleta oscura del card
            isTwoColFields && styles.cardWide, // Amplía ancho máximo a 640px si width >= 620
          ]} // Fin de estilos de card
        >{/* Cabecera, banner de error y campos del formulario */}
          <Text style={[styles.title, isDark && styles.textDark]}>{/* Título principal de la pantalla */}
            Crear nueva cuenta{/* Encabezado del registro */}
          </Text>{/* Termina título */}
          <Text style={[styles.subtitle, isDark && styles.subTextDark]}>{/* Subtítulo explicativo */}
            Únete a GastroLab para publicar y administrar tus recetas{/* Invitación al usuario */}
          </Text>{/* Termina subtítulo */}

          {errorMessage && ( // Muestra banner rojo solo cuando hay un error de validación o registro duplicado
            <View // Caja estilizada de alerta visual
              style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Color rojizo claro u oscuro
            >{/* Texto de error */}
              <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{/* Color rojo contrastante */}
                {errorMessage}{/* Mensaje de error activo */}
              </Text>{/* Termina texto de error */}
            </View> // Cierra banner condicional de errorMessage
          )}{/* Termina renderizado condicional del banner de error */}

          <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta del campo correo */}
            Correo electrónico{/* Rótulo visible arriba del input */}
          </Text>{/* Termina etiqueta de correo */}
          <TextInput // Campo controlado para el correo del nuevo usuario
            style={[styles.input, isDark && styles.inputDark]} // Caja adaptable a tema claro u oscuro
            placeholder="Correo electrónico" // Guía visual cuando está vacío
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color legible del placeholder
            keyboardType="email-address" // Teclado optimizado con "@" y ".com"
            autoCapitalize="none" // Evita mayúscula inicial automática
            autoCorrect={false} // Desactiva autocorrector en correos
            editable={!loading} // Bloquea edición mientras loading es true
            value={email} // Valor controlado desde estado email
            onChangeText={setEmail} // Actualiza estado email en cada pulsación
          />{/* Termina input de correo */}

          <View style={isTwoColFields ? styles.twoColRow : undefined}>{/* En pantallas anchas agrupa las 2 contraseñas en fila */}
            <View style={isTwoColFields ? styles.col : undefined}>{/* Columna izquierda (Contraseña) cuando width >= 620 */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta del campo contraseña */}
                Contraseña{/* Rótulo de clave nueva */}
              </Text>{/* Termina etiqueta contraseña */}
              <TextInput // Campo oculto para la nueva contraseña
                style={[styles.input, isDark && styles.inputDark]} // Estilos claro/oscuro
                placeholder="Mínimo 4 caracteres" // Indica longitud mínima exigida por validateAuthForm
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color del placeholder
                secureTextEntry // Oculta los caracteres ingresados
                autoCapitalize="none" // Evita mayúsculas automáticas
                editable={!loading} // Bloquea el input durante el envío
                value={password} // Enlazado al estado password
                onChangeText={setPassword} // Actualiza password al teclear
              />{/* Termina input de contraseña */}
            </View>{/* Termina columna de contraseña */}

            <View style={isTwoColFields ? styles.col : undefined}>{/* Columna derecha (Confirmar contraseña) cuando width >= 620 */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Etiqueta de confirmación */}
                Confirmar contraseña{/* Rótulo de repetición de clave */}
              </Text>{/* Termina etiqueta confirmar contraseña */}
              <TextInput // Segundo campo oculto para validar que no haya error al escribir la clave
                style={[styles.input, isDark && styles.inputDark]} // Estilos claro/oscuro
                placeholder="Repite tu contraseña" // Guía para el usuario
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Color del placeholder
                secureTextEntry // Oculta caracteres repetidos
                autoCapitalize="none" // Sin mayúsculas automáticas
                editable={!loading} // Bloqueado mientras loading es true
                value={confirmPassword} // Enlazado al estado confirmPassword
                onChangeText={setConfirmPassword} // Actualiza confirmPassword al teclear
                onSubmitEditing={handleRegister} // Permite enviar el registro al presionar Enter desde el último campo
              />{/* Termina input de confirmar contraseña */}
            </View>{/* Termina columna de confirmación */}
          </View>{/* Termina fila o bloque de contraseñas */}

          <Pressable // Botón principal para enviar el alta de usuario
            onPress={handleRegister} // Valida y llama a registerUser
            disabled={loading} // Impide múltiples envíos simultáneos
            style={[styles.primaryButton, loading && styles.buttonDisabled]} // Fondo rojo terracota; atenuado al cargar
          >{/* Contenido del botón según estado loading */}
            {loading ? ( // Si está enviando el registro muestra spinner
              <ActivityIndicator color="#FFFFFF" /> // Indicador de carga blanco
            ) : ( // Estado normal
              <Text style={styles.buttonText}>Registrarme</Text> // Texto del botón de registro
            )}{/* Termina alternancia spinner/texto */}
          </Pressable>{/* Termina botón Registrarme */}

          <Pressable // Enlace inferior para regresar a la pantalla de inicio de sesión
            onPress={() => router.replace('/(auth)/login')} // Reemplaza la ruta actual por Login sin apilar pantallas extra
            style={styles.linkButton} // Área táctil centrada debajo del botón
          >{/* Texto del enlace a Login */}
            <Text style={[styles.linkText, isDark && styles.linkTextDark]}>{/* Tono vino o coral en oscuro */}
              ¿Ya tienes cuenta? Inicia sesión aquí{/* Opción rápida si el usuario ya tenía cuenta */}
            </Text>{/* Termina texto del enlace */}
          </Pressable>{/* Termina enlace de regreso a Login */}
        </View>{/* Termina tarjeta del formulario */}
      </ScrollView>{/* Termina ScrollView */}
    </KeyboardAvoidingView> // Fin KeyboardAvoidingView de RegisterScreen
  ); // Fin del JSX de RegisterScreen
} // Fin de componente RegisterScreen

const styles = StyleSheet.create({ // Hoja de estilos de RegisterScreen
  keyboardWrapper: { // Fondo exterior en modo claro
    flex: 1, // Ocupa todo el alto de pantalla
    backgroundColor: '#FAF7F5', // Crema cálido GastroLab
  }, // Fin keyboardWrapper
  keyboardWrapperDark: { // Fondo exterior en modo oscuro
    backgroundColor: '#181312', // Café oscuro profundo
  }, // Fin keyboardWrapperDark
  scrollContainer: { // Contenedor interno del ScrollView
    flexGrow: 1, // Permite centrar verticalmente el card
    justifyContent: 'center', // Centra verticalmente en pantalla
    padding: 20, // Relleno lateral e inferior/superior
  }, // Fin scrollContainer
  scrollContainerLandscape: { // Ajuste compacto en celular horizontal
    paddingVertical: 12, // Reduce aire vertical
    paddingHorizontal: 24, // Amplía aire lateral
  }, // Fin scrollContainerLandscape
  card: { // Tarjeta del formulario en modo claro
    backgroundColor: '#FFFFFF', // Blanco limpio
    borderRadius: 14, // Esquinas redondeadas
    padding: 20, // Relleno interno
    borderWidth: 1, // Borde fino
    borderColor: '#EAE2DF', // Arena cálido
    maxWidth: 480, // Ancho máximo en 1 columna
    width: '100%', // Ocupa 100% en móviles estrechos
    alignSelf: 'center', // Centrada horizontalmente
    ...Platform.select({ // Sombra compatible entre Web y móvil
      web: { // Sombra CSS para navegador
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)', // Evita deprecación de shadow* en react-native-web
      }, // Fin sombra web
      default: { // Sombra nativa iOS/Android
        shadowColor: '#4f2c21', // Color sombra cálida
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento Y de 2px
        shadowOpacity: 0.15, // Opacidad en iOS
        shadowRadius: 4, // Difuminado
        elevation: 3, // Elevación en Android
      }, // Fin sombra nativa
    }), // Fin Platform.select
  }, // Fin card
  cardDark: { // Tarjeta en modo oscuro
    backgroundColor: '#241D1B', // Superficie café oscura
    borderColor: '#382E2B', // Borde espresso
  }, // Fin cardDark
  cardWide: { // Ensancha la tarjeta cuando las contraseñas van en 2 columnas
    maxWidth: 640, // Permite acomodar cómodamente ambos inputs lado a lado
  }, // Fin cardWide
  twoColRow: { // Fila para Password y Confirmar Password en tablet/desktop
    flexDirection: 'row', // Coloca ambas columnas horizontalmente
    gap: 12, // Separación de 12px entre ambos campos
  }, // Fin twoColRow
  col: { // Cada columna de contraseña dentro de twoColRow
    flex: 1, // Reparte exactamente 50% y 50% del ancho
  }, // Fin col
  title: { // Título "Crear nueva cuenta"
    fontSize: 22, // Tamaño destacado de cabecera
    fontWeight: 'bold', // Negrita
    color: '#2C1E1B', // Café oscuro
  }, // Fin title
  subtitle: { // Subtítulo debajo de "Crear nueva cuenta"
    fontSize: 14, // Tamaño secundario
    color: '#555555', // Gris medio
    marginTop: 4, // Separación respecto al título
    marginBottom: 12, // Espacio antes del formulario
  }, // Fin subtitle
  textDark: { // Color de texto principal en modo oscuro
    color: '#F7F2F0', // Blanco cálido
  }, // Fin textDark
  subTextDark: { // Color de texto secundario en modo oscuro
    color: '#B8A9A4', // Arena claro
  }, // Fin subTextDark
  errorBanner: { // Banner de error claro
    backgroundColor: '#FDEDEC', // Rosado pálido
    borderRadius: 8, // Bordes redondeados
    padding: 10, // Espaciado interno
    marginTop: 4, // Margen superior
    borderWidth: 1, // Borde 1px
    borderColor: '#F5B7B1', // Borde rosado intenso
  }, // Fin errorBanner
  errorBannerDark: { // Banner de error en modo oscuro
    backgroundColor: '#3A1F1E', // Vino oscuro
    borderColor: '#78281F', // Borde rojizo oscuro
  }, // Fin errorBannerDark
  errorText: { // Texto rojo de error en claro
    color: '#C0392B', // Terracota
    fontSize: 13, // Tamaño legible
    fontWeight: '600', // Seminegrita
  }, // Fin errorText
  errorTextDark: { // Texto rojo de error en oscuro
    color: '#EC7063', // Coral claro
  }, // Fin errorTextDark
  label: { // Etiquetas de campos del formulario
    fontSize: 14, // Tamaño estándar
    fontWeight: '600', // Seminegrita
    marginBottom: 6, // Espacio antes del TextInput
    marginTop: 12, // Separación respecto al bloque anterior
    color: '#333333', // Gris oscuro
  }, // Fin label
  input: { // Campo de texto en modo claro
    borderWidth: 1, // Borde fino
    borderColor: '#CCCCCC', // Gris claro
    borderRadius: 8, // Bordes redondeados
    padding: 12, // Relleno cómodo
    fontSize: 16, // Tamaño legible sin auto-zoom en iOS
    backgroundColor: '#FAFAFA', // Fondo gris casi blanco
    color: '#2C1E1B', // Texto ingresado oscuro
  }, // Fin input
  inputDark: { // Campo de texto en modo oscuro
    backgroundColor: '#181312', // Fondo café oscuro
    borderColor: '#382E2B', // Borde espresso
    color: '#F7F2F0', // Texto blanco cálido
  }, // Fin inputDark
  primaryButton: { // Botón "Registrarme"
    backgroundColor: '#C0392B', // Rojo terracota GastroLab
    paddingVertical: 14, // Altura táctil cómoda
    borderRadius: 8, // Esquinas redondeadas
    alignItems: 'center', // Centra texto o spinner
    marginTop: 20, // Margen superior antes del botón
  }, // Fin primaryButton
  buttonDisabled: { // Estado visual deshabilitado mientras loading es true
    opacity: 0.6, // Atenúa botón
  }, // Fin buttonDisabled
  buttonText: { // Texto blanco del botón principal
    color: '#FFFFFF', // Blanco puro
    fontWeight: '600', // Seminegrita
    fontSize: 16, // Tamaño estándar
  }, // Fin buttonText
  linkButton: { // Contenedor del enlace hacia Login
    marginTop: 16, // Separación respecto al botón principal
    alignItems: 'center', // Centra horizontalmente
    paddingVertical: 6, // Zona táctil cómoda
  }, // Fin linkButton
  linkText: { // Texto del enlace en modo claro
    color: '#753333', // Vino corporativo
    fontSize: 14, // Tamaño legible
    fontWeight: '700', // Negrita marcada
  }, // Fin linkText
  linkTextDark: { // Texto del enlace en modo oscuro
    color: '#EC7063', // Coral brillante
  }, // Fin linkTextDark
}); // Fin StyleSheet RegisterScreen
