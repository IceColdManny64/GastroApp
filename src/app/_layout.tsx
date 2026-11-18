import { Stack } from 'expo-router'; // Navegador principal de pila de Expo Router
import * as SplashScreen from 'expo-splash-screen'; // Controla pantalla de bienvenida nativa al arrancar
import { StatusBar } from 'expo-status-bar'; // Configura color de íconos en barra superior del teléfono
import { useEffect } from 'react'; // Hook de efecto para ocultar Splash una vez montado
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Protege márgenes en muescas (notch) y barras del sistema
import { useThemeMode } from '@/utils/preferencesStorage'; // Hook reactivo que detecta si Modo Oscuro está activo

SplashScreen.preventAutoHideAsync().catch(() => {}); // Retiene Splash Screen hasta que React Native termine de montar

export default function RootLayout() { // Componente contenedor raíz de toda la aplicación
  const isDark = useThemeMode(); // Se suscribe en vivo al tema claro u oscuro global

  useEffect(() => { // Corre una vez al montar RootLayout
    SplashScreen.hideAsync().catch(() => {}); // Oculta pantalla de bienvenida de forma segura
  }, []); // Arreglo vacío para ejecutar solo al inicio

  return ( // Árbol visual raíz de navegación
    <SafeAreaProvider>{/* Provee áreas seguras a todas las pantallas hijas */}
      <StatusBar style="light" />{/* Íconos de batería/reloj claros sobre encabezados vino/oscuro */}
      <Stack // Navegador raíz que agrupa entrada y grupos (auth) y (app)
        screenOptions={{ // Opciones aplicadas globalmente a toda la app
          headerShown: false, // Oculta barra raíz porque cada grupo tiene su propio encabezado
          orientation: 'default', // Desbloquea giro libre portrait y landscape en móviles
          contentStyle: { // Fondo base global sincronizado con Modo Oscuro para evitar parpadeos blancos
            backgroundColor: isDark ? '#181312' : '#FAF7F5', // Café oscuro vs crema cálido
          }, // Fin contentStyle
        }} // Fin screenOptions
      >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
        <Stack.Screen name="index" />{/* Ruta raíz "/" encargada de decidir sesión activa */}
        <Stack.Screen name="(auth)" />{/* Grupo de rutas públicas (login y register) */}
        <Stack.Screen name="(app)" />{/* Grupo de rutas privadas protegidas por token */}
      </Stack>{/* Fin Stack raíz */}
    </SafeAreaProvider> // Fin SafeAreaProvider
  ); // Fin return JSX
} // Fin RootLayout
