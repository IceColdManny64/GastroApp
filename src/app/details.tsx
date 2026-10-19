import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DEFAULT_RECIPE_IMAGE,
  deleteRecipe,
  getRecipe,
} from '../services/recipes';
import { RecipeItem } from '../types/RecipeItem';
import {
  getFavorites,
  getUserSettings,
  toggleFavorite,
} from '../utils/preferencesStorage';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeItem | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [imageUri, setImageUri] = useState<string>(DEFAULT_RECIPE_IMAGE);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          setLoading(true);
          const numericId = Number(id);
          const [fresh, favs, settings] = await Promise.all([
            getRecipe(numericId),
            getFavorites(),
            getUserSettings(),
          ]);

          if (isActive) {
            setRecipe(fresh);
            setImageUri(fresh.image || DEFAULT_RECIPE_IMAGE);
            setIsFavorite(favs.includes(fresh.id));
            setDarkMode(settings.themeMode === 'dark');
          }
        } catch (err) {
          console.error('[details.tsx] Error al cargar detalle:', err);
          Alert.alert('Error', 'No se pudo cargar la receta');
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [id])
  );

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    const updated = await toggleFavorite(recipe.id);
    setIsFavorite(updated.includes(recipe.id));
  };

  const handleEdit = () => {
    router.push({
      pathname: '/form',
      params: { recipe: JSON.stringify(recipe) },
    });
  };

  const executeDeletion = async () => {
    if (!recipe) return;
    try {
      await deleteRecipe(recipe.id);
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'No se pudo eliminar'
      );
    }
  };

  const handleDelete = () => {
    if (!recipe) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '¿Seguro que quieres eliminar esta receta?'
      );
      if (confirmed) {
        executeDeletion();
      }
      return;
    }

    Alert.alert(
      'Confirmar',
      '¿Seguro que quieres eliminar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: executeDeletion,
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, darkMode && styles.centeredDark]}>
        <ActivityIndicator
          size="large"
          color={darkMode ? '#E74C3C' : '#333333'}
        />
        <Text style={[styles.loadingText, darkMode && styles.textDark]}>
          Cargando detalle de la receta...
        </Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.centered, darkMode && styles.centeredDark]}>
        <Text style={[styles.emptyText, darkMode && styles.textDark]}>
          No se encontró la receta
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, styles.editButton]}
        >
          <Text style={styles.buttonText}>Volver al catálogo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, darkMode && styles.screenDark]}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.detailCard, darkMode && styles.detailCardDark]}>
        <Image
          source={{ uri: imageUri }}
          style={styles.heroImage}
          onError={() => setImageUri(DEFAULT_RECIPE_IMAGE)}
        />

        <View style={styles.bodyContent}>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{recipe.category}</Text>
            </View>

            <Pressable
              onPress={handleToggleFavorite}
              style={[
                styles.favoriteButton,
                isFavorite && styles.favoriteButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.favoriteButtonText,
                  isFavorite && styles.favoriteButtonTextActive,
                ]}
              >
                {isFavorite ? '♥ En tus favoritos' : '♡ Agregar a favoritos'}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.title, darkMode && styles.textDark]}>
            {recipe.title}
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.metaBadgeTime}>
              <Text style={styles.metaBadgeTimeText}>
                ⏱️ Tiempo: {recipe.prepareTime}
              </Text>
            </View>
            <View style={styles.metaBadgeDifficulty}>
              <Text style={styles.metaBadgeDifficultyText}>
                📊 Dificultad: {recipe.difficulty}
              </Text>
            </View>
            <View style={styles.metaBadgeLikes}>
              <Text style={styles.metaBadgeLikesText}>
                👍 Aprobación: {recipe.likeRate}%
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeader, darkMode && styles.textDark]}>
            Descripción y preparación
          </Text>
          <Text style={[styles.description, darkMode && styles.subTextDark]}>
            {recipe.description}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={handleEdit}
              style={[styles.button, styles.editButton]}
            >
              <Text style={styles.buttonText}>Editar</Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={[styles.button, styles.deleteButton]}
            >
              <Text style={styles.buttonText}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
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
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAF7F5',
  },
  centeredDark: {
    backgroundColor: '#181312',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  textDark: {
    color: '#F7F2F0',
  },
  subTextDark: {
    color: '#B8A9A4',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
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
  detailCardDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  heroImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    backgroundColor: '#E5DDD9',
  },
  bodyContent: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#753333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  favoriteButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C0392B',
    backgroundColor: '#FFFFFF',
  },
  favoriteButtonActive: {
    backgroundColor: '#FDEDEC',
  },
  favoriteButtonText: {
    color: '#C0392B',
    fontWeight: '700',
    fontSize: 13,
  },
  favoriteButtonTextActive: {
    color: '#C0392B',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  metaBadgeTime: {
    backgroundColor: '#FEF5E7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaBadgeTimeText: {
    color: '#B9770E',
    fontWeight: '700',
    fontSize: 13,
  },
  metaBadgeDifficulty: {
    backgroundColor: '#F3ECE9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaBadgeDifficultyText: {
    color: '#4A3833',
    fontWeight: '700',
    fontSize: 13,
  },
  metaBadgeLikes: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaBadgeLikesText: {
    color: '#27AE60',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555555',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#27AE60',
  },
  deleteButton: {
    backgroundColor: '#C0392B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
