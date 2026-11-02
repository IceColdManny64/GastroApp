import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { registerUser } from '../utils/auth';
import { useThemeMode } from '../utils/preferencesStorage';
import { validateAuthForm } from '../utils/validators';

export default function RegisterScreen() {
  const router = useRouter();
  const isDark = useThemeMode();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);
    const validation = validateAuthForm(email, password, {
      isRegister: true,
      confirmPassword,
    });

    if (!validation.isValid) {
      const msg = validation.errorMessage || 'Verifica los datos ingresados.';
      setErrorMessage(msg);
      Alert.alert('Datos inválidos', msg);
      return;
    }

    try {
      setSubmitting(true);
      await registerUser(email, password);
      Alert.alert(
        'Cuenta creada',
        'Tu cuenta ha sido registrada exitosamente. Ahora puedes iniciar sesión.'
      );
      router.replace('/');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo completar el registro.';
      setErrorMessage(msg);
      Alert.alert('Error de registro', msg);
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
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.title, isDark && styles.textDark]}>
            Crear nueva cuenta
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subTextDark]}>
            Únete a GastroLab para publicar y administrar tus recetas
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
            placeholder="Mínimo 4 caracteres"
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={[styles.label, isDark && styles.textDark]}>
            Confirmar contraseña
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Repite tu contraseña"
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleRegister}
          />

          <Pressable
            onPress={handleRegister}
            disabled={submitting}
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Registrarme</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace('/')}
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, isDark && styles.linkTextDark]}>
              ¿Ya tienes cuenta? Inicia sesión aquí
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C1E1B',
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 4,
    marginBottom: 12,
  },
  textDark: {
    color: '#F7F2F0',
  },
  subTextDark: {
    color: '#B8A9A4',
  },
  errorBanner: {
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
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
    color: '#753333',
    fontSize: 14,
    fontWeight: '700',
  },
  linkTextDark: {
    color: '#EC7063',
  },
});
