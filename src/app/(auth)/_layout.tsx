import { Stack, useRouter } from 'expo-router'; // Stack del grupo (auth) y router para retroceso seguro
import { Pressable, StyleSheet, Text } from 'react-native'; // Componentes para dibujar botón "← Volver"
import { safeGoBack } from '@/utils/navigation'; // Navegación hacia atrás segura sin error GO_BACK
import { useThemeMode } from '@/utils/preferencesStorage'; // Suscripción al tema claro u oscuro

export default function AuthLayout() { // Layout compartido por login.tsx y register.tsx
  const isDark = useThemeMode(); // Bandera booleana reactiva de Modo Oscuro
  const router = useRouter(); // Instancia del router actual

  return ( // Configura encabezados del grupo público
    <Stack // Navegador de pila interno para autenticación
      screenOptions={{ // Opciones visuales comunes del grupo público
        orientation: 'default', // Permite orientación libre
        headerStyle: { // Estilo de barra superior
          backgroundColor: isDark ? '#1F1615' : '#753333', // Vino oscuro en claro, café muy oscuro en noche
        }, // Fin headerStyle
        headerTintColor: '#FFFFFF', // Color blanco para títulos e íconos
        headerTitleStyle: { fontWeight: 'bold' }, // Título en negrita
        contentStyle: { // Fondo de las pantallas internas del grupo
          backgroundColor: isDark ? '#181312' : '#FAF7F5', // Oscuro o crema
        }, // Fin contentStyle
      }} // Fin screenOptions
    >{/* Declara las dos rutas públicas de autenticación (login y register) */}
      <Stack.Screen // Pantalla pública de Login
        name="login" // Mapea al archivo login.tsx
        options={{ // Opciones de encabezado
          title: 'Iniciar Sesión', // Título visible arriba
          headerBackVisible: false, // Oculta flecha nativa por defecto
          headerLeft: () => null, // No hay pantalla previa a Login
        }} // Fin options login
      />{/* Cierra configuración de pantalla login */}
      <Stack.Screen // Pantalla pública de Registro
        name="register" // Mapea al archivo register.tsx
        options={{ // Opciones de encabezado con botón seguro
          title: 'Crear Cuenta', // Título visible arriba
          headerBackVisible: false, // Oculta flecha automática que puede disparar GO_BACK en Web
          headerLeft: () => ( // Renderiza botón personalizado seguro a la izquierda
            <Pressable // Área táctil de retroceso
              onPress={() => safeGoBack(router, '/(auth)/login')} // Vuelve atrás o reemplaza por login si recargaron URL
              style={styles.backButton} // Padding cómodo
            >{/* Contenido textual del botón ← Volver */}
              <Text style={styles.backButtonText}>← Volver</Text>{/* Texto blanco del botón */}
            </Pressable> // Cierra botón personalizado de retroceso
          ), // Fin headerLeft
        }} // Fin options register
      />{/* Cierra configuración de pantalla register */}
    </Stack> // Fin Stack AuthLayout
  ); // Fin return JSX
} // Fin AuthLayout

const styles = StyleSheet.create({ // Estilos del botón de retroceso de AuthLayout
  backButton: { // Área clickeable en barra superior
    paddingHorizontal: 10, // Aire horizontal
    paddingVertical: 6, // Aire vertical
    marginRight: 8, // Separación respecto al título
    borderRadius: 6, // Bordes suaves
  }, // Fin backButton
  backButtonText: { // Estilo texto del botón volver
    color: '#FFFFFF', // Blanco contrastante sobre barra vino/oscura
    fontSize: 15, // Tamaño legible
    fontWeight: '700', // Negrita marcada
  }, // Fin backButtonText
}); // Fin StyleSheet AuthLayout
