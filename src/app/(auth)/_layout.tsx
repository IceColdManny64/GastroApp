import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { safeGoBack } from '@/utils/navigation';
import { useThemeMode } from '@/utils/preferencesStorage';

export default function AuthLayout() {
  const isDark = useThemeMode();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        orientation: 'default',
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
        name="login"
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
          headerLeft: () => (
            <Pressable
              onPress={() => safeGoBack(router, '/(auth)/login')}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
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
