import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { safeGoBack } from '../utils/navigation';
import { useThemeMode } from '../utils/preferencesStorage';

export default function RootLayout() {
  const isDark = useThemeMode();
  const router = useRouter();

  const renderBackButton = (fallbackRoute: string) => (
    <Pressable
      onPress={() => safeGoBack(router, fallbackRoute)}
      style={styles.backButton}
    >
      <Text style={styles.backButtonText}>← Volver</Text>
    </Pressable>
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#1F1615' : '#753333',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: {
            backgroundColor: isDark ? '#181312' : '#FAF7F5',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Iniciar Sesión',
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: 'Crear Cuenta',
            headerBackVisible: false,
            headerLeft: () => renderBackButton('/'),
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: 'Catálogo de Recetas',
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="details"
          options={{
            title: 'Detalle de Receta',
            headerBackVisible: false,
            headerLeft: () => renderBackButton('/home'),
          }}
        />
        <Stack.Screen
          name="form"
          options={{
            title: 'Formulario de Receta',
            headerBackVisible: false,
            headerLeft: () => renderBackButton('/home'),
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            title: 'Mis Favoritos',
            headerBackVisible: false,
            headerLeft: () => renderBackButton('/home'),
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Configuración',
            headerBackVisible: false,
            headerLeft: () => renderBackButton('/home'),
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
