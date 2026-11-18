import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import PaginationBar from '@/components/ui/paginationBar';
import SearchFilterBar from '@/components/ui/searchFilterBar';
import { getRecipes } from '@/services/recipes';
import { PageSizeOption, UserSettings } from '@/types/Auth';
import {
  RecipeCategory,
  RecipeDifficulty,
  RecipeFilterState,
  RecipeItem,
  SortOption,
} from '@/types/RecipeItem';
import {
  DEFAULT_USER_SETTINGS,
  getFavorites,
  getUserSettings,
  saveUserSettings,
  toggleFavorite,
  useThemeMode,
} from '@/utils/preferencesStorage';
import { deleteToken, getToken } from '@/utils/tokenStorage';

export default function HomeScreen() {
  const router = useRouter();
  const isDarkTheme = useThemeMode();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = width >= 980 ? 3 : width >= 620 || isLandscape ? 2 : 1;

  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(
    DEFAULT_USER_SETTINGS
  );
  const hasAppliedDefaultCategoryRef = useRef(false);
  const serverSearchActiveRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<RecipeFilterState>({
    searchQuery: '',
    category: 'Todas',
    difficulty: 'Todas',
    sortBy: 'default',
    onlyFavorites: false,
  });

  const handleLogout = async () => {
    await deleteToken();
    router.replace('/(auth)/login');
  };

  const fetchRecipes = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      setError(null);
      serverSearchActiveRef.current = false;
      const [data, favs, settings] = await Promise.all([
        getRecipes(),
        getFavorites(),
        getUserSettings(),
      ]);

      setRecipes(data);
      setFavoriteIds(favs);
      setUserSettings(settings);

      if (!hasAppliedDefaultCategoryRef.current && settings.defaultCategory) {
        hasAppliedDefaultCategoryRef.current = true;
        setFilters((prev) => ({
          ...prev,
          category: settings.defaultCategory,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const handleServerSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanQuery = filters.searchQuery.trim();
      serverSearchActiveRef.current = cleanQuery.length > 0;
      const data = await getRecipes(cleanQuery || undefined);
      setRecipes(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al buscar en el catálogo'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllFilters = async () => {
    setFilters({
      searchQuery: '',
      category: 'Todas',
      difficulty: 'Todas',
      sortBy: 'default',
      onlyFavorites: false,
    });
    setCurrentPage(1);
    if (serverSearchActiveRef.current) {
      serverSearchActiveRef.current = false;
      const fullData = await getRecipes();
      setRecipes(fullData);
    }
  };

  const handleToggleFavorite = async (recipeId: number) => {
    const updated = await toggleFavorite(recipeId);
    setFavoriteIds(updated);
  };

  const handleItemsPerPageChange = async (size: PageSizeOption) => {
    const updated = await saveUserSettings({
      ...userSettings,
      itemsPerPage: size,
    });
    setUserSettings(updated);
    setCurrentPage(1);
  };

  const filteredRecipes = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    const filtered = recipes.filter((item) => {
      if (query) {
        const matchesQuery =
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (
        filters.category !== 'Todas' &&
        item.category.toLowerCase() !== filters.category.toLowerCase()
      ) {
        return false;
      }

      if (
        filters.difficulty !== 'Todas' &&
        item.difficulty.toLowerCase() !== filters.difficulty.toLowerCase()
      ) {
        return false;
      }

      if (filters.onlyFavorites && !favoriteIds.includes(item.id)) {
        return false;
      }

      return true;
    });

    if (filters.sortBy === 'likes_desc') {
      return [...filtered].sort((a, b) => b.likeRate - a.likeRate);
    }
    if (filters.sortBy === 'time_asc') {
      return [...filtered].sort((a, b) =>
        a.prepareTime.localeCompare(b.prepareTime)
      );
    }
    if (filters.sortBy === 'title_asc') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [recipes, filters, favoriteIds]);

  const itemsPerPage = userSettings.itemsPerPage;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecipes.length / itemsPerPage)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecipes = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredRecipes.slice(start, start + itemsPerPage);
  }, [filteredRecipes, safeCurrentPage, itemsPerPage]);

  const activeFavoritesCount = useMemo(() => {
    if (serverSearchActiveRef.current) {
      return favoriteIds.length;
    }
    return recipes.filter((item) => favoriteIds.includes(item.id)).length;
  }, [recipes, favoriteIds]);

  const navigateToDetail = (item: RecipeItem) => {
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
  };

  const isDark = isDarkTheme || userSettings.themeMode === 'dark';

  if (loading) {
    return (
      <View style={[styles.centered, isDark && styles.centeredDark]}>
        <ActivityIndicator
          size="large"
          color={isDark ? '#E74C3C' : '#333333'}
        />
        <Text style={[styles.message, isDark && styles.messageDark]}>
          Cargando recetas...
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
        <Pressable onPress={fetchRecipes} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        key={`recipes-grid-${numColumns}`}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        data={paginatedRecipes}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/form')}
                style={[styles.actionBtn, styles.primaryActionBtn]}
              >
                <Text style={styles.actionBtnText}>+ Nueva receta</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/favorites')}
                style={[styles.actionBtn, styles.secondaryActionBtn]}
              >
                <Text style={styles.actionBtnText}>
                  ♥ Favoritos ({activeFavoritesCount})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/settings')}
                style={[styles.actionBtn, styles.neutralActionBtn]}
              >
                <Text style={styles.actionBtnText}>⚙️ Ajustes</Text>
              </Pressable>

              <Pressable
                onPress={() => handleLogout()}
                style={[styles.actionBtn, styles.dangerActionBtn]}
              >
                <Text style={styles.actionBtnText}>Cerrar sesión</Text>
              </Pressable>
            </View>

            <SearchFilterBar
              filters={filters}
              totalResults={filteredRecipes.length}
              favoritesCount={activeFavoritesCount}
              darkMode={isDark}
              onChangeSearch={(text: string) => {
                setFilters((prev) => ({ ...prev, searchQuery: text }));
                setCurrentPage(1);
                if (text.trim() === '' && serverSearchActiveRef.current) {
                  serverSearchActiveRef.current = false;
                  getRecipes()
                    .then(setRecipes)
                    .catch(() => {});
                }
              }}
              onSubmitServerSearch={handleServerSearch}
              onSelectCategory={(category: RecipeCategory) => {
                setFilters((prev) => ({ ...prev, category }));
                setCurrentPage(1);
              }}
              onSelectDifficulty={(difficulty: RecipeDifficulty) => {
                setFilters((prev) => ({ ...prev, difficulty }));
                setCurrentPage(1);
              }}
              onSelectSort={(sortBy: SortOption) => {
                setFilters((prev) => ({ ...prev, sortBy }));
                setCurrentPage(1);
              }}
              onToggleOnlyFavorites={() => {
                setFilters((prev) => ({
                  ...prev,
                  onlyFavorites: !prev.onlyFavorites,
                }));
                setCurrentPage(1);
              }}
              onResetFilters={handleResetAllFilters}
            />
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
              isFavorite={favoriteIds.includes(item.id)}
              compact={
                userSettings.compactCards || (isLandscape && height < 480)
              }
              darkMode={isDark}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onPress={() => navigateToDetail(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyBox, isDark && styles.emptyBoxDark]}>
            <Text style={[styles.emptyTitle, isDark && styles.messageDark]}>
              No se encontraron recetas con los filtros seleccionados.
            </Text>
            <Pressable
              onPress={handleResetAllFilters}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Mostrar todas las recetas</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          <PaginationBar
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredRecipes.length}
            itemsPerPage={itemsPerPage}
            darkMode={isDark}
            onPageChange={(page: number) => setCurrentPage(page)}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
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
  messageDark: {
    color: '#F7F2F0',
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
  retryButton: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtn: {
    backgroundColor: '#27AE60',
  },
  secondaryActionBtn: {
    backgroundColor: '#C0392B',
  },
  neutralActionBtn: {
    backgroundColor: '#753333',
  },
  dangerActionBtn: {
    backgroundColor: '#4A3833',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE2DF',
    marginVertical: 16,
  },
  emptyBoxDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  emptyTitle: {
    fontSize: 15,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 14,
  },
});
