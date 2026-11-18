import { useRouter } from 'expo-router'; // Importa utilidades de navegación y rutas de Expo Router ({ useRouter })
import { useState } from 'react'; // Importa React y sus hooks ({ useState }) para estado y ciclo de vida
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
import { showAlert } from '@/utils/alerts'; // Importa utilidades auxiliares compartidas (@/utils/alerts)
import { registerUser } from '@/utils/auth'; // Importa utilidades auxiliares compartidas (@/utils/auth)
import { useThemeMode } from '@/utils/preferencesStorage'; // Importa utilidades auxiliares compartidas (@/utils/preferencesStorage)
import { validateAuthForm } from '@/utils/validators'; // Importa utilidades auxiliares compartidas (@/utils/validators)

export default function RegisterScreen() { // Declara y exporta la pantalla principal RegisterScreen
  const router = useRouter(); // Obtiene instancia de router para navegar entre pantallas
  const isDark = useThemeMode(); // Suscribe el componente al tema visual activo (claro u oscuro)
  const { width, height } = useWindowDimensions(); // Obtiene dimensiones dinámicas de pantalla para diseño responsivo
  const isLandscapeCompact = width > height && height < 520; // Declara constante local isLandscapeCompact
  const isTwoColFields = width >= 620; // Declara constante local isTwoColFields

  const [email, setEmail] = useState(''); // Declara estado reactivo para el correo electrónico
  const [password, setPassword] = useState(''); // Declara estado reactivo para la contraseña
  const [confirmPassword, setConfirmPassword] = useState(''); // Declara estado reactivo para la confirmación de contraseña
  const [loading, setLoading] = useState(false); // Declara estado reactivo para el indicador de carga
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Declara estado reactivo para error message

  const handleRegister = async () => { // Define manejador o función handleRegister
    setErrorMessage(null); // Actualiza error message
    const validation = validateAuthForm(email, password, { // Declara constante local validation
      isRegister: true, // Define propiedad "isRegister" en el objeto actual
      confirmPassword, // Incluye propiedad abreviada "confirmPassword" (la confirmación de contraseña) en el objeto
    }); // Cierra bloque o expresión anterior

    if (!validation.isValid) { // Evalúa condición lógica antes de ejecutar este bloque
      const msg = validation.errorMessage || 'Verifica los datos ingresados.'; // Lee valor opcional de forma segura con respaldo por defecto
      setErrorMessage(msg); // Actualiza error message
      showAlert('Datos inválidos', msg); // Muestra alerta multiplataforma informativa o de error al usuario
      return; // Devuelve resultado o detiene ejecución temprana de la función
    } // Cierra rama del condicional if/else

    try { // Inicia bloque try para capturar posibles errores de ejecución
      setLoading(true); // Actualiza el indicador de carga
      await registerUser(email, password); // Registra nuevo usuario en users.json mediante el microservicio
      showAlert( // Muestra alerta multiplataforma informativa o de error al usuario
        'Cuenta creada', // Cadena de texto usada como parámetro o mensaje ("Cuenta creada")
        'Tu cuenta ha sido registrada exitosamente. Ahora puedes iniciar sesión.' // Cadena de texto usada como parámetro o mensaje ("Tu cuenta ha sido registrada exitosamente. Ahora")
      ); // Cierra bloque o expresión anterior
      router.replace('/(auth)/login'); // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
    } catch (err) { // Captura error lanzado en el bloque try para manejarlo sin caer la app
      const msg = // Declara constante local msg
        err instanceof Error ? err.message : 'No se pudo completar el registro.'; // Comprueba si el error capturado es instancia estándar de Error para leer su mensaje
      setErrorMessage(msg); // Actualiza error message
      showAlert('Error de registro', msg); // Muestra alerta multiplataforma informativa o de error al usuario
    } finally { // Bloque finally que se ejecuta siempre al terminar con o sin error
      setLoading(false); // Actualiza el indicador de carga
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
            styles.card, // Aplica estilo base "card"
            isDark && styles.cardDark, // Aplica estilo condicional "cardDark" cuando se cumple isDark
            isTwoColFields && styles.cardWide, // Aplica estilo condicional "cardWide" cuando se cumple isTwoColFields
          ]} // Cierra lista combinada de estilos del componente
        >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
          <Text style={[styles.title, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Crear nueva cuenta{/* Texto o expresión visible dentro del componente ("Crear nueva cuenta") */}
          </Text>{/* Cierra bloque de componente Text */}
          <Text style={[styles.subtitle, isDark && styles.subTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
            Únete a GastroLab para publicar y administrar tus recetas{/* Texto o expresión visible dentro del componente ("Únete a GastroLab para publicar y administ") */}
          </Text>{/* Cierra bloque de componente Text */}

          {errorMessage && ( // Inicia bloque de renderizado condicional en JSX
            <View // Inicia declaración de caja contenedora de diseño (layout)
              style={[styles.errorBanner, isDark && styles.errorBannerDark]} // Prop style: aplica estilos visuales al componente
            >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
              <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
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

          <View style={isTwoColFields ? styles.twoColRow : undefined}>{/* Abre caja contenedora de diseño (layout) */}
            <View style={isTwoColFields ? styles.col : undefined}>{/* Abre caja contenedora de diseño (layout) */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                Contraseña{/* Texto o expresión visible dentro del componente ("Contraseña") */}
              </Text>{/* Cierra bloque de componente Text */}
              <TextInput // Inicia declaración de campo interactivo de entrada de texto
                style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
                placeholder="Mínimo 4 caracteres" // Prop placeholder: texto guía mostrado cuando el campo está vacío
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
                secureTextEntry // Prop booleana activa secureTextEntry: oculta caracteres sensibles de contraseña
                autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
                editable={!loading} // Prop editable: indica si el campo permite edición
                value={password} // Prop value: valor actual controlado del campo
                onChangeText={setPassword} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
              />{/* Cierra etiqueta autocontenida de componente */}
            </View>{/* Cierra bloque de componente View */}

            <View style={isTwoColFields ? styles.col : undefined}>{/* Abre caja contenedora de diseño (layout) */}
              <Text style={[styles.label, isDark && styles.textDark]}>{/* Abre componente para renderizar texto en pantalla */}
                Confirmar contraseña{/* Texto o expresión visible dentro del componente ("Confirmar contraseña") */}
              </Text>{/* Cierra bloque de componente Text */}
              <TextInput // Inicia declaración de campo interactivo de entrada de texto
                style={[styles.input, isDark && styles.inputDark]} // Prop style: aplica estilos visuales al componente
                placeholder="Repite tu contraseña" // Prop placeholder: texto guía mostrado cuando el campo está vacío
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'} // Prop placeholderTextColor: color del texto guía (placeholder)
                secureTextEntry // Prop booleana activa secureTextEntry: oculta caracteres sensibles de contraseña
                autoCapitalize="none" // Prop autoCapitalize: controla mayúsculas automáticas al escribir
                editable={!loading} // Prop editable: indica si el campo permite edición
                value={confirmPassword} // Prop value: valor actual controlado del campo
                onChangeText={setConfirmPassword} // Prop onChangeText: actualiza el estado cada vez que cambia el texto
                onSubmitEditing={handleRegister} // Prop onSubmitEditing: maneja el envío al presionar Enter/Listo en teclado
              />{/* Cierra etiqueta autocontenida de componente */}
            </View>{/* Cierra bloque de componente View */}
          </View>{/* Cierra bloque de componente View */}

          <Pressable // Inicia declaración de área táctil personalizable
            onPress={handleRegister} // Prop onPress: ejecuta acción al tocar el elemento
            disabled={loading} // Prop disabled: deshabilita interacción cuando la condición es verdadera
            style={[styles.primaryButton, loading && styles.buttonDisabled]} // Prop style: aplica estilos visuales al componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            {loading ? ( // Si el indicador de carga es verdadero, renderiza esta rama en JSX
              <ActivityIndicator color="#FFFFFF" /> // Renderiza indicador giratorio de carga
            ) : ( // Rama alternativa del operador ternario cuando no se cumple la condición
              <Text style={styles.buttonText}>Registrarme</Text> // Abre componente para renderizar texto en pantalla
            )}{/* Cierra bloque de renderizado condicional o iteración JSX */}
          </Pressable>{/* Cierra bloque de componente Pressable */}

          <Pressable // Inicia declaración de área táctil personalizable
            onPress={() => router.replace('/(auth)/login')} // Reemplaza la ruta actual impidiendo volver atrás con el botón físico
            style={styles.linkButton} // Prop style: aplica estilos visuales al componente
          >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
            <Text style={[styles.linkText, isDark && styles.linkTextDark]}>{/* Abre componente para renderizar texto en pantalla */}
              ¿Ya tienes cuenta? Inicia sesión aquí{/* Texto o expresión visible dentro del componente ("¿Ya tienes cuenta? Inicia sesión aquí") */}
            </Text>{/* Cierra bloque de componente Text */}
          </Pressable>{/* Cierra bloque de componente Pressable */}
        </View>{/* Cierra bloque de componente View */}
      </ScrollView>{/* Cierra bloque de componente ScrollView */}
    </KeyboardAvoidingView> // Cierra bloque de componente KeyboardAvoidingView
  ); // Finaliza sentencia de retorno
} // Cierra el cuerpo de la función RegisterScreen

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
  cardWide: { // Define grupo de estilos para "cardWide"
    maxWidth: 640, // Estilo maxWidth: ancho máximo permitido
  }, // Cierra objeto literal
  twoColRow: { // Define grupo de estilos para "twoColRow"
    flexDirection: 'row', // Estilo flexDirection: define dirección del eje principal (fila o columna)
    gap: 12, // Estilo gap: espacio uniforme entre elementos hijos
  }, // Cierra objeto literal
  col: { // Define grupo de estilos para "col"
    flex: 1, // Estilo flex: ocupa espacio proporcional disponible
  }, // Cierra objeto literal
  title: { // Define grupo de estilos para "title"
    fontSize: 22, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: 'bold', // Estilo fontWeight: grosor tipográfico del texto
    color: '#2C1E1B', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
  subtitle: { // Define grupo de estilos para "subtitle"
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    color: '#555555', // Estilo color: color de texto o icono
    marginTop: 4, // Estilo marginTop: margen externo superior
    marginBottom: 12, // Estilo marginBottom: margen externo inferior
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
    marginTop: 4, // Estilo marginTop: margen externo superior
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
    color: '#753333', // Estilo color: color de texto o icono
    fontSize: 14, // Estilo fontSize: tamaño de fuente en píxeles
    fontWeight: '700', // Estilo fontWeight: grosor tipográfico del texto
  }, // Cierra objeto literal
  linkTextDark: { // Define grupo de estilos para "linkTextDark"
    color: '#EC7063', // Estilo color: color de texto o icono
  }, // Cierra objeto literal
}); // Cierra bloque o expresión anterior
