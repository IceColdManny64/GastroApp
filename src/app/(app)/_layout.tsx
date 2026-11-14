import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { safeGoBack } from '@/utils/navigation';
import { useThemeMode } from '@/utils/preferencesStorage';
import { getToken } from '@/utils/tokenStorage';

export default function AppLayout() {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const isDark = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setIsLoggedIn(!!token);
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View style={[styles.centered, isDark && styles.centeredDark]}>
        <ActivityIndicator
          size="large"
          color={isDark ? '#E74C3C' : '#C0392B'}
        />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  const renderBackButton = (fallbackRoute: string) => (
    <Pressable
      onPress={() => safeGoBack(router, fallbackRoute)}
      style={styles.backButton}
    >
      <Text style={styles.backButtonText}>← Volver</Text>
    </Pressable>
  );

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
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
  },
  centeredDark: {
    backgroundColor: '#181312',
  },
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
