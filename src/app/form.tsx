import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createRecipe, getRecipe, updateRecipe } from '../services/recipes';
import {
  RecipeFormPayload,
  RecipeItem,
  VALID_RECIPE_CATEGORIES,
  VALID_RECIPE_DIFFICULTIES,
} from '../types/RecipeItem';
import { safeGoBack } from '../utils/navigation';
import { useThemeMode } from '../utils/preferencesStorage';
import { validateRecipeForm } from '../utils/validators';

export default function FormScreen() {
  const { recipe, id } = useLocalSearchParams<{
    recipe?: string;
    id?: string;
  }>();
  const router = useRouter();
  const isDark = useThemeMode();

  const editing: RecipeItem | null = useMemo(() => {
    if (!recipe) return null;
    try {
      return JSON.parse(recipe) as RecipeItem;
    } catch {
      return null;
    }
  }, [recipe]);

  const editingId = editing?.id ?? (id ? Number(id) : null);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [imageUri, setImageUri] = useState<string | null>(
    editing?.image ?? null
  );
  const [prepareTime, setPrepareTime] = useState(
    editing?.prepareTime ?? '00:30:00'
  );
  const [likeRate, setLikeRate] = useState(String(editing?.likeRate ?? 90));
  const [category, setCategory] = useState(editing?.category ?? 'Mexicanas');
  const [difficulty, setDifficulty] = useState(editing?.difficulty ?? 'Facil');
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!editingId) return;
    let isMounted = true;

    (async () => {
      try {
        const fresh = await getRecipe(Number(editingId));
        if (isMounted && fresh) {
          setTitle(fresh.title);
          setDescription(fresh.description);
          setImageUri(fresh.image);
          setPrepareTime(fresh.prepareTime);
          setLikeRate(String(fresh.likeRate));
          setCategory(fresh.category);
          setDifficulty(fresh.difficulty);
        }
      } catch (err) {
        console.warn('[form.tsx] Usando datos iniciales de edición:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [editingId]);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.imageUri;
        return next;
      });
    }
  };

  const fallbackDestination = editingId ? `/details?id=${editingId}` : '/home';

  const handleSave = async () => {
    const validation = validateRecipeForm({
      title,
      description,
      imageUri,
      prepareTime,
      likeRateInput: likeRate,
      category,
      difficulty,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.fieldErrors);
      Alert.alert(
        'Campos inválidos',
        validation.errorMessage || 'Revisa los datos ingresados.'
      );
      return;
    }

    setValidationErrors({});
    const cleanUri = (imageUri || '').trim();
    const numericLikeRate = Math.round(Number(likeRate.trim()));

    const payload: RecipeFormPayload = {
      title: title.trim(),
      description: description.trim(),
      imageUri: cleanUri,
      prepareTime: prepareTime.trim(),
      likeRate: numericLikeRate,
      category: category.trim(),
      difficulty: difficulty.trim(),
    };

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('preparetime', payload.prepareTime);
      formData.append('likerate', String(payload.likeRate));
      formData.append('category', payload.category);
      formData.append('difficulty', payload.difficulty);
      formData.append('imageURL', payload.imageUri);

      if (Platform.OS === 'web') {
        try {
          if (cleanUri.startsWith('blob:') || cleanUri.startsWith('data:')) {
            const res = await fetch(cleanUri);
            const blob = await res.blob();
            formData.append('image', blob, 'photo.jpg');
          }
        } catch (blobErr) {
          console.warn('[form.tsx] Usando URL directa en FormData:', blobErr);
        }
      } else {
        const filename = cleanUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', {
          uri: cleanUri,
          name: filename,
          type,
        } as any);
      }

      if (editingId) {
        await updateRecipe(editingId, formData, payload);
      } else {
        await createRecipe(formData, payload);
      }

      safeGoBack(router, fallbackDestination);
    } catch (err) {
      Alert.alert(
        'Error al guardar',
        err instanceof Error ? err.message : 'No se pudo guardar la receta.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardWrapper, isDark && styles.keyboardWrapperDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.heading, isDark && styles.textDark]}>
            {editingId ? 'Editar receta' : 'Crear nueva receta'}
          </Text>

          <Text style={[styles.label, isDark && styles.textDark]}>
            Título de la receta *
          </Text>
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
              validationErrors.title &&
                (isDark ? styles.inputErrorDark : styles.inputError),
            ]}
            placeholder="Ejemplo: Enchiladas suizas tradicionales"
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            value={title}
            onChangeText={setTitle}
          />
          {validationErrors.title && (
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>
              {validationErrors.title}
            </Text>
          )}

          <Text style={[styles.label, isDark && styles.textDark]}>
            Descripción y pasos de preparación *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              isDark && styles.inputDark,
              validationErrors.description &&
                (isDark ? styles.inputErrorDark : styles.inputError),
            ]}
            placeholder="Describe los ingredientes y la preparación del platillo (mínimo 10 caracteres)..."
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          {validationErrors.description && (
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>
              {validationErrors.description}
            </Text>
          )}

          <Text style={[styles.label, isDark && styles.textDark]}>
            Fotografía del platillo *
          </Text>
          <Pressable
            onPress={pickImage}
            style={[
              styles.imagePicker,
              isDark && styles.imagePickerDark,
              validationErrors.imageUri &&
                (isDark ? styles.inputErrorDark : styles.inputError),
            ]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text
                  style={[styles.placeholderText, isDark && styles.subTextDark]}
                >
                  Toca para elegir una foto de tu galería
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={[styles.label, isDark && styles.textDark]}>
            O ingresa una URL de imagen:
          </Text>
          <TextInput
            style={[
              styles.input,
              isDark && styles.inputDark,
              validationErrors.imageUri &&
                (isDark ? styles.inputErrorDark : styles.inputError),
            ]}
            placeholder="https://ejemplo.com/mi-receta.jpg"
            placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
            autoCapitalize="none"
            value={imageUri ?? ''}
            onChangeText={(text) => setImageUri(text)}
          />
          {validationErrors.imageUri && (
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>
              {validationErrors.imageUri}
            </Text>
          )}

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Tiempo (HH:MM:SS) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.inputDark,
                  validationErrors.prepareTime &&
                    (isDark ? styles.inputErrorDark : styles.inputError),
                ]}
                placeholder="00:45:00"
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
                value={prepareTime}
                onChangeText={setPrepareTime}
              />
              {validationErrors.prepareTime && (
                <Text
                  style={[styles.fieldError, isDark && styles.fieldErrorDark]}
                >
                  {validationErrors.prepareTime}
                </Text>
              )}
            </View>

            <View style={styles.col}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                Aprobación (0 - 100) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.inputDark,
                  validationErrors.likeRate &&
                    (isDark ? styles.inputErrorDark : styles.inputError),
                ]}
                placeholder="90"
                placeholderTextColor={isDark ? '#8D7B75' : '#888888'}
                keyboardType="numeric"
                value={likeRate}
                onChangeText={setLikeRate}
              />
              {validationErrors.likeRate && (
                <Text
                  style={[styles.fieldError, isDark && styles.fieldErrorDark]}
                >
                  {validationErrors.likeRate}
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.label, isDark && styles.textDark]}>
            Categoría *
          </Text>
          <View style={styles.chipsRow}>
            {VALID_RECIPE_CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    isDark && styles.chipDark,
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isDark && styles.chipTextDark,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {validationErrors.category && (
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>
              {validationErrors.category}
            </Text>
          )}

          <Text style={[styles.label, isDark && styles.textDark]}>
            Dificultad *
          </Text>
          <View style={styles.chipsRow}>
            {VALID_RECIPE_DIFFICULTIES.map((diff) => {
              const selected = difficulty === diff;
              return (
                <Pressable
                  key={diff}
                  onPress={() => setDifficulty(diff)}
                  style={[
                    styles.chip,
                    isDark && styles.chipDark,
                    selected && styles.chipSelectedSecondary,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isDark && styles.chipTextDark,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {diff}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {validationErrors.difficulty && (
            <Text style={[styles.fieldError, isDark && styles.fieldErrorDark]}>
              {validationErrors.difficulty}
            </Text>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => safeGoBack(router, fallbackDestination)}
              disabled={saving}
              style={[styles.cancelButton, saving && styles.buttonDisabled]}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, saving && styles.buttonDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {editingId ? 'Actualizar receta' : 'Guardar receta'}
                </Text>
              )}
            </Pressable>
          </View>
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
  container: {
    padding: 16,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
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
  heading: {
    fontSize: 22,
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
  inputError: {
    borderColor: '#C0392B',
    backgroundColor: '#FFF9F9',
  },
  inputErrorDark: {
    borderColor: '#E74C3C',
    backgroundColor: '#2C1918',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: '#C0392B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  fieldErrorDark: {
    color: '#EC7063',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  imagePickerDark: {
    backgroundColor: '#181312',
    borderColor: '#4A3833',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    alignItems: 'center',
    padding: 16,
  },
  placeholderIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F3ECE9',
    borderWidth: 1,
    borderColor: '#E2D6D1',
  },
  chipDark: {
    backgroundColor: '#181312',
    borderColor: '#382E2B',
  },
  chipSelected: {
    backgroundColor: '#C0392B',
    borderColor: '#C0392B',
  },
  chipSelectedSecondary: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3833',
  },
  chipTextDark: {
    color: '#B8A9A4',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#753333',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#C0392B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
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
