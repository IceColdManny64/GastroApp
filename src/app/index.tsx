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
import { updateCredentials, verifyEmail } from '../services/user';
import { login } from '../utils/auth';
import { getToken, saveToken } from '../utils/tokenStorage';
import { isValidEmail, validateAuthForm } from '../utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

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

  const handleForgotPassword = async () => {
    setRecoveryError(null);
    setRecoverySuccess(null);

    if (!isValidEmail(recoveryEmail)) {
      setRecoveryError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    try {
      setRecoverySubmitting(true);
      if (!verifiedUserId) {
        const res = await verifyEmail(recoveryEmail);
        if (res.exists && res.id) {
          setVerifiedUserId(Number(res.id));
          setRecoverySuccess(
            'Correo verificado. Ingresa tu nueva contraseña a continuación.'
          );
        } else {
          setRecoveryError('No encontramos ninguna cuenta con ese correo electrónico.');
        }
      } else {
        if (newPassword.trim().length < 4) {
          setRecoveryError(
            'La nueva contraseña debe tener al menos 4 caracteres.'
          );
          return;
        }
        await updateCredentials(verifiedUserId, recoveryEmail, newPassword);
        setRecoverySuccess('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
        setEmail(recoveryEmail.trim());
        setPassword('');
        setVerifiedUserId(null);
        setNewPassword('');
        setShowRecovery(false);
        Alert.alert(
          'Contraseña actualizada',
          'Tu contraseña se actualizó con éxito. Inicia sesión con tu nueva clave.'
        );
      }
    } catch (err) {
      setRecoveryError(
        err instanceof Error
          ? err.message
          : 'No se pudo completar la recuperación de contraseña.'
      );
    } finally {
      setRecoverySubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandHeader}>
          <Text style={styles.brandIcon}>🍲</Text>
          <Text style={styles.brandTitle}>GastroLab</Text>
          <Text style={styles.brandSubtitle}>
            Explora, crea y guarda tus recetas favoritas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Iniciar sesión</Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#888888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888888"
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
            <Text style={styles.linkText}>
              ¿No tienes cuenta? Regístrate aquí
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowRecovery((prev) => !prev);
              setRecoveryEmail(email);
              setVerifiedUserId(null);
              setRecoveryError(null);
              setRecoverySuccess(null);
            }}
            style={styles.secondaryLinkButton}
          >
            <Text style={styles.secondaryLinkText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          {showRecovery && (
            <View style={styles.recoveryContainer}>
              <Text style={styles.recoveryTitle}>
                Recuperación de contraseña
              </Text>
              <Text style={styles.recoveryHelp}>
                Verifica tu correo registrado para asignar una nueva contraseña.
              </Text>

              {recoveryError && (
                <Text style={styles.errorText}>{recoveryError}</Text>
              )}
              {recoverySuccess && (
                <Text style={styles.successText}>{recoverySuccess}</Text>
              )}

              <Text style={styles.label}>Correo registrado</Text>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#888888"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!verifiedUserId}
                value={recoveryEmail}
                onChangeText={setRecoveryEmail}
              />

              {verifiedUserId && (
                <>
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 4 caracteres"
                    placeholderTextColor="#888888"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </>
              )}

              <Pressable
                onPress={handleForgotPassword}
                disabled={recoverySubmitting}
                style={[
                  styles.recoveryButton,
                  recoverySubmitting && styles.buttonDisabled,
                ]}
              >
                {recoverySubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {verifiedUserId
                      ? 'Guardar nueva contraseña'
                      : 'Verificar correo'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
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
  brandSubtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 4,
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 8,
  },
  errorBanner: {
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    color: '#27AE60',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
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
  primaryButton: {
    backgroundColor: '#C0392B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  recoveryButton: {
    backgroundColor: '#753333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
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
  secondaryLinkButton: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryLinkText: {
    color: '#753333',
    fontSize: 13,
    fontWeight: '600',
  },
  recoveryContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EAE2DF',
  },
  recoveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1E1B',
  },
  recoveryHelp: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    marginBottom: 6,
  },
});
