import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useThemeMode } from '@/utils/preferencesStorage';
import { getToken } from '@/utils/tokenStorage';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isDark = useThemeMode();

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

  return isLoggedIn ? (
    <Redirect href="/(app)/home" />
  ) : (
    <Redirect href="/(auth)/login" />
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
});
