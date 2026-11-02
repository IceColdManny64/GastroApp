import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login } from '../utils/auth';
import { useThemeMode } from '../utils/preferencesStorage';
import { getToken, saveToken } from '../utils/tokenStorage';
import { validateAuthForm } from '../utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const isDark = useThemeMode();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      console.log('[index.tsx] Revisando si ya existe sesión previa...');
      const token = await getToken();
      if (token) {
        console.log('[index.tsx] Sesión existente detectada. Saltando al Home...');
        router.replace('/home');
      }
    };
    checkExistingSession();
  }, [router]);

  const handleLogin = async () => {
    setErrorMessage(null);
    const validation = validateAuthForm(email, password);
    if (!validation.isValid) {
      const msg = validation.errorMessage || 'Verifica los datos ingresados.';
      setErrorMessage(msg);
      Alert.alert('Datos incompletos', msg);
      return;
    }

    try {
      setSubmitting(true);
      const token = await login(email, password);
      await saveToken(token);
      router.replace('/home');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Correo o contraseña incorrectos';
      setErrorMessage(msg);
      Alert.alert('Error', 'Correo o contraseña incorrectos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandHeader}>
          <Text style={styles.brandIcon}>🍲</Text>
          <Text style={[styles.brandTitle, isDark && styles.brandTitleDark]}>
            GastroLab
          </Text>
          <Text
            style={[styles.brandSubtitle, isDark && styles.brandSubtitleDark]}
          >
            Explora, crea y guarda tus recetas favoritas
          </Text>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Iniciar sesión
          </Text>

          {errorMessage && (
            <View
              style={[styles.errorBanner, isDark && styles.errorBannerDark]}
            >
              <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
                {errorMessage}
              </Text>
            </View>
          )}

          <Text style={[styles.label, isDark && styles.textDark]}>
            Correo electrónico
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Correo electrónico"
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, isDark && styles.textDark]}>
            Contraseña
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Contraseña"
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/register')}
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, isDark && styles.linkTextDark]}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </Pressable>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },
  keyboardWrapperDark: {
    backgroundColor: '#181312',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIcon: {
    fontSize: 48,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#753333',
  },
  brandTitleDark: {
    color: '#E74C3C',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 4,
    textAlign: 'center',
  },
  brandSubtitleDark: {
    color: '#B8A9A4',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAE2DF',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)',
      },
      default: {
        shadowColor: '#4f2c21',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  cardDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 8,
  },
  textDark: {
    color: '#F7F2F0',
  },
  errorBanner: {
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  errorBannerDark: {
    backgroundColor: '#3A1F1E',
    borderColor: '#78281F',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '600',
  },
  errorTextDark: {
    color: '#EC7063',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#2C1E1B',
  },
  inputDark: {
    backgroundColor: '#181312',
    borderColor: '#382E2B',
    color: '#F7F2F0',
  },
  primaryButton: {
    backgroundColor: '#C0392B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '700',
  },
  linkTextDark: {
    color: '#EC7063',
  },
});
