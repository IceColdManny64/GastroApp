import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Card from '@/components/ui/card';
import { getRecipes } from '@/services/recipes';
import { UserSettings } from '@/types/Auth';
import { RecipeItem } from '@/types/RecipeItem';
import {
  DEFAULT_USER_SETTINGS,
  getFavorites,
  getUserSettings,
  toggleFavorite,
  useThemeMode,
} from '@/utils/preferencesStorage';

export default function FavoritesScreen() {
  const router = useRouter();
  const isDarkTheme = useThemeMode();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = width >= 980 ? 3 : width >= 620 || isLandscape ? 2 : 1;

  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavoritesData = useCallback(async () => {
    try {
      setError(null);
      const [allRecipes, favs, userPrefs] = await Promise.all([
        getRecipes(),
        getFavorites(),
        getUserSettings(),
      ]);
      setRecipes(allRecipes);
      setFavoriteIds(favs);
      setSettings(userPrefs);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar tus recetas favoritas.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavoritesData();
    }, [loadFavoritesData])
  );

  const handleToggleFavorite = async (recipeId: number) => {
    const updated = await toggleFavorite(recipeId);
    setFavoriteIds(updated);
  };

  const favoriteRecipes = useMemo(() => {
    return recipes.filter((item) => favoriteIds.includes(item.id));
  }, [recipes, favoriteIds]);

  const isDark = isDarkTheme || settings.themeMode === 'dark';

  if (loading) {
    return (
      <View style={[styles.centered, isDark && styles.centeredDark]}>
        <ActivityIndicator
          size="large"
          color={isDark ? '#E74C3C' : '#333333'}
        />
        <Text style={[styles.message, isDark && styles.textDark]}>
          Cargando tus recetas favoritas...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, isDark && styles.centeredDark]}>
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
          {error}
        </Text>
        <Pressable onPress={loadFavoritesData} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        key={`favorites-grid-${numColumns}`}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        data={favoriteRecipes}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>
              Mis Recetas Favoritas ({favoriteRecipes.length})
            </Text>
            <Text style={[styles.headerSubtitle, isDark && styles.subTextDark]}>
              Toca el corazón para quitar una receta de tu colección o selecciona
              una tarjeta para ver el detalle completo.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.gridItem : styles.singleItem}>
            <Card
              title={item.title}
              image={item.image}
              description={item.description}
              category={item.category}
              difficulty={item.difficulty}
              prepareTime={item.prepareTime}
              likeRate={item.likeRate}
              isFavorite={true}
              compact={settings.compactCards || (isLandscape && height < 480)}
              darkMode={isDark}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onPress={() => {
                const safeItemParam =
                  item.image && item.image.startsWith('data:')
                    ? { ...item, image: '', imageURL: '' }
                    : item;
                router.push({
                  pathname: '/details',
                  params: {
                    id: String(item.id),
                    item: JSON.stringify(safeItemParam),
                  },
                });
              }}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Text style={styles.emptyIcon}>🍲</Text>
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
              Aún no tienes recetas favoritas
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.subTextDark]}>
              Marca con el corazón ♥ las recetas que más te gusten en el catálogo
              para encontrarlas rápidamente aquí.
            </Text>
            <Pressable
              onPress={() => router.replace('/home')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Explorar catálogo</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },
  containerDark: {
    backgroundColor: '#181312',
  },
  listContent: {
    padding: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  columnWrapper: {
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  singleItem: {
    width: '100%',
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
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  textDark: {
    color: '#F7F2F0',
  },
  subTextDark: {
    color: '#B8A9A4',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  errorTextDark: {
    color: '#EC7063',
  },
  headerBox: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C1E1B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE2DF',
    marginTop: 16,
  },
  emptyStateDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
