import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#753333' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Iniciar Sesión' }} />
        <Stack.Screen name="register" options={{ title: 'Crear Cuenta' }} />
        <Stack.Screen name="home" options={{ title: 'Catálogo de Recetas' }} />
        <Stack.Screen name="details" options={{ title: 'Detalle de Receta' }} />
        <Stack.Screen name="form" options={{ title: 'Formulario de Receta' }} />
        <Stack.Screen name="favorites" options={{ title: 'Mis Favoritos' }} />
        <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
