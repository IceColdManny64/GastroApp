import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Card from '../components/ui/card';
import PaginationBar from '../components/ui/paginationBar';
import SearchFilterBar from '../components/ui/searchFilterBar';
import { getRecipes } from '../services/recipes';
import { PageSizeOption, UserSettings } from '../types/Auth';
import {
  RecipeCategory,
  RecipeDifficulty,
  RecipeFilterState,
  RecipeItem,
  SortOption,
} from '../types/RecipeItem';
import {
  DEFAULT_USER_SETTINGS,
  getFavorites,
  getUserSettings,
  saveUserSettings,
  toggleFavorite,
} from '../utils/preferencesStorage';
import { deleteToken, getToken } from '../utils/tokenStorage';

export default function HomeScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(
    DEFAULT_USER_SETTINGS
  );
  const [hasAppliedDefaultCategory, setHasAppliedDefaultCategory] =
    useState(false);
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
    router.replace('/');
  };

  const fetchRecipes = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/');
        return;
      }

      setError(null);
      const [data, favs, settings] = await Promise.all([
        getRecipes(),
        getFavorites(),
        getUserSettings(),
      ]);

      console.log('[home.tsx] Data recibida:', data?.length);
      setRecipes(data);
      setFavoriteIds(favs);
      setUserSettings(settings);

      if (!hasAppliedDefaultCategory && settings.defaultCategory) {
        setFilters((prev) => ({
          ...prev,
          category: settings.defaultCategory,
        }));
        setHasAppliedDefaultCategory(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasAppliedDefaultCategory, router]);

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
      const data = await getRecipes(filters.searchQuery);
      setRecipes(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al buscar en el servidor'
      );
    } finally {
      setLoading(false);
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

  const isDark = userSettings.themeMode === 'dark';

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
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchRecipes} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        data={paginatedRecipes}
        keyExtractor={(item) => String(item.id)}
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
                  ♥ Favoritos ({favoriteIds.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/settings')}
                style={[styles.actionBtn, styles.neutralActionBtn]}
              >
                <Text style={styles.actionBtnText}>⚙️ Ajustes</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                style={[styles.actionBtn, styles.dangerActionBtn]}
              >
                <Text style={styles.actionBtnText}>Cerrar sesión</Text>
              </Pressable>
            </View>

            <SearchFilterBar
              filters={filters}
              totalResults={filteredRecipes.length}
              favoritesCount={favoriteIds.length}
              darkMode={isDark}
              onChangeSearch={(text: string) => {
                setFilters((prev) => ({ ...prev, searchQuery: text }));
                setCurrentPage(1);
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
              onResetFilters={async () => {
                setFilters({
                  searchQuery: '',
                  category: 'Todas',
                  difficulty: 'Todas',
                  sortBy: 'default',
                  onlyFavorites: false,
                });
                setCurrentPage(1);
                const fullData = await getRecipes();
                setRecipes(fullData);
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Card
            title={item.title}
            image={item.image}
            description={item.description}
            category={item.category}
            difficulty={item.difficulty}
            prepareTime={item.prepareTime}
            likeRate={item.likeRate}
            isFavorite={favoriteIds.includes(item.id)}
            compact={userSettings.compactCards}
            darkMode={isDark}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
            onPress={() =>
              router.push({
                pathname: '/details',
                params: { id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyBox, isDark && styles.emptyBoxDark]}>
            <Text style={[styles.emptyTitle, isDark && styles.messageDark]}>
              No se encontraron recetas con los filtros seleccionados.
            </Text>
            <Pressable
              onPress={() => {
                setFilters({
                  searchQuery: '',
                  category: 'Todas',
                  difficulty: 'Todas',
                  sortBy: 'default',
                  onlyFavorites: false,
                });
                setCurrentPage(1);
              }}
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
    maxWidth: 880,
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
