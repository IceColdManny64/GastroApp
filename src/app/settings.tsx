import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getUserProfile,
  updateCredentials,
  verifyPassword,
} from '../services/user';
import { PageSizeOption, UserSession, UserSettings } from '../types/Auth';
import { RECIPE_CATEGORIES, RecipeCategory } from '../types/RecipeItem';
import {
  DEFAULT_USER_SETTINGS,
  getUserSettings,
  resetLocalRecipeChanges,
  saveUserSettings,
} from '../utils/preferencesStorage';
import {
  deleteToken,
  getUserSession,
  saveUserSession,
} from '../utils/tokenStorage';
import { validateCredentialsForm } from '../utils/validators';

const PAGE_SIZES: PageSizeOption[] = [10, 20, 30];

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [credentialsMessage, setCredentialsMessage] = useState<string | null>(
    null
  );
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const [storedSettings, storedSession] = await Promise.all([
            getUserSettings(),
            getUserSession(),
          ]);

          if (isActive) {
            setSettings(storedSettings);
            setSession(storedSession);
            if (storedSession?.email) {
              setNewEmail(storedSession.email);
            }
          }

          if (storedSession?.id) {
            try {
              const profile = await getUserProfile(storedSession.id);
              if (isActive && profile?.email) {
                setNewEmail(profile.email);
              }
            } catch (profileErr) {
              console.warn(
                '[settings.tsx] Usando email de sesión local:',
                profileErr
              );
            }
          }
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleUpdateSetting = async (partial: Partial<UserSettings>) => {
    const nextSettings: UserSettings = {
      ...settings,
      ...partial,
    };
    setSettings(nextSettings);
    await saveUserSettings(nextSettings);
  };

  const handleUpdateCredentials = async () => {
    setCredentialsError(null);
    setCredentialsMessage(null);

    if (!session?.id) {
      setCredentialsError(
        'No se encontró el identificador de tu sesión. Inicia sesión nuevamente.'
      );
      return;
    }

    const validation = validateCredentialsForm(
      currentPassword,
      newEmail,
      newPassword
    );
    if (!validation.isValid) {
      const msg = validation.errorMessage || 'Verifica los campos ingresados.';
      setCredentialsError(msg);
      Alert.alert('Datos inválidos', msg);
      return;
    }

    try {
      setUpdatingCredentials(true);
      const passwordCheck = await verifyPassword(session.id, currentPassword);
      if (!passwordCheck.valid) {
        const invalidMsg =
          passwordCheck.message || 'La contraseña actual es incorrecta.';
        setCredentialsError(invalidMsg);
        Alert.alert('Contraseña incorrecta', invalidMsg);
        return;
      }

      const updateResult = await updateCredentials(
        session.id,
        newEmail,
        newPassword
      );

      const updatedSession: UserSession = {
        ...session,
        email: newEmail.trim(),
      };
      await saveUserSession(updatedSession);
      setSession(updatedSession);
      setCurrentPassword('');
      setNewPassword('');

      const successMsg =
        updateResult.message || 'Credenciales actualizadas correctamente';
      setCredentialsMessage(successMsg);
      Alert.alert('Éxito', successMsg);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudieron actualizar las credenciales.';
      setCredentialsError(msg);
      Alert.alert('Error', msg);
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const handleResetLocalData = async () => {
    await resetLocalRecipeChanges();
    Alert.alert(
      'Catálogo restablecido',
      'Se han restaurado las 30 recetas originales del servidor.'
    );
  };

  const handleLogout = async () => {
    await deleteToken();
    router.replace('/');
  };

  const isDark = settings.themeMode === 'dark';

  if (loading) {
    return (
      <View style={[styles.centered, isDark && styles.centeredDark]}>
        <ActivityIndicator
          size="large"
          color={isDark ? '#E74C3C' : '#333333'}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, isDark && styles.screenDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Preferencias de Visualización y Catálogo
          </Text>

          <Text style={[styles.label, isDark && styles.textDark]}>
            Recetas por página por defecto:
          </Text>
          <View style={styles.optionsRow}>
            {PAGE_SIZES.map((size) => {
              const selected = settings.itemsPerPage === size;
              return (
                <Pressable
                  key={size}
                  onPress={() => handleUpdateSetting({ itemsPerPage: size })}
                  style={[
                    styles.optionButton,
                    isDark && styles.optionButtonDark,
                    selected && styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isDark && styles.subTextDark,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {size} recetas
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, isDark && styles.textDark]}>
            Categoría inicial predeterminada:
          </Text>
          <View style={styles.optionsRow}>
            {RECIPE_CATEGORIES.map((category: RecipeCategory) => {
              const selected = settings.defaultCategory === category;
              return (
                <Pressable
                  key={category}
                  onPress={() =>
                    handleUpdateSetting({ defaultCategory: category })
                  }
                  style={[
                    styles.optionButton,
                    isDark && styles.optionButtonDark,
                    selected && styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isDark && styles.subTextDark,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, isDark && styles.textDark]}>
            Tema de la interfaz:
          </Text>
          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => handleUpdateSetting({ themeMode: 'light' })}
              style={[
                styles.optionButton,
                isDark && styles.optionButtonDark,
                settings.themeMode === 'light' && styles.optionButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isDark && styles.subTextDark,
                  settings.themeMode === 'light' && styles.optionTextSelected,
                ]}
              >
                ☀️ Claro
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleUpdateSetting({ themeMode: 'dark' })}
              style={[
                styles.optionButton,
                isDark && styles.optionButtonDark,
                settings.themeMode === 'dark' && styles.optionButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isDark && styles.subTextDark,
                  settings.themeMode === 'dark' && styles.optionTextSelected,
                ]}
              >
                🌙 Oscuro
              </Text>
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelBox}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Modo de tarjetas compactas
              </Text>
              <Text style={[styles.helperText, isDark && styles.subTextDark]}>
                Reduce la altura de las imágenes para ver más recetas en pantalla.
              </Text>
            </View>
            <Switch
              value={settings.compactCards}
              onValueChange={(value) =>
                handleUpdateSetting({ compactCards: value })
              }
              trackColor={{ false: '#CCCCCC', true: '#C0392B' }}
            />
          </View>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Seguridad y Actualización de Credenciales
          </Text>
          <Text style={[styles.helperText, isDark && styles.subTextDark]}>
            Cuenta activa: {session?.email || 'Usuario autenticado'} (ID:{' '}
            {session?.id ?? '-'})
          </Text>

          {credentialsError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{credentialsError}</Text>
            </View>
          )}
          {credentialsMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{credentialsMessage}</Text>
            </View>
          )}

          <Text style={[styles.label, isDark && styles.textDark]}>
            Contraseña actual *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Ingresa tu contraseña actual"
            placeholderTextColor="#888888"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={[styles.label, isDark && styles.textDark]}>
            Nuevo correo electrónico *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="nuevo@correo.com"
            placeholderTextColor="#888888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={newEmail}
            onChangeText={setNewEmail}
          />

          <Text style={[styles.label, isDark && styles.textDark]}>
            Nueva contraseña *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Mínimo 4 caracteres"
            placeholderTextColor="#888888"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Pressable
            onPress={handleUpdateCredentials}
            disabled={updatingCredentials}
            style={[
              styles.primaryButton,
              updatingCredentials && styles.buttonDisabled,
            ]}
          >
            {updatingCredentials ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Actualizar credenciales</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Acciones de Cuenta y Datos
          </Text>

          <Pressable
            onPress={handleResetLocalData}
            style={styles.secondaryButton}
          >
            <Text style={styles.buttonText}>
              Restablecer datos locales de prueba
            </Text>
          </Pressable>

          <Pressable onPress={handleLogout} style={styles.dangerButton}>
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },
  screenDark: {
    backgroundColor: '#181312',
  },
  container: {
    padding: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
  },
  centeredDark: {
    backgroundColor: '#181312',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAE2DF',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 8,
  },
  textDark: {
    color: '#F7F2F0',
  },
  subTextDark: {
    color: '#B8A9A4',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    color: '#333333',
  },
  helperText: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F3ECE9',
    borderWidth: 1,
    borderColor: '#E2D6D1',
  },
  optionButtonDark: {
    backgroundColor: '#181312',
    borderColor: '#382E2B',
  },
  optionButtonSelected: {
    backgroundColor: '#C0392B',
    borderColor: '#C0392B',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3833',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE7',
  },
  switchLabelBox: {
    flex: 1,
    paddingRight: 12,
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
  errorBanner: {
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#E8F8F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A9DFBF',
  },
  successText: {
    color: '#1E8449',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
  },
  secondaryButton: {
    backgroundColor: '#753333',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerButton: {
    backgroundColor: '#C0392B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
