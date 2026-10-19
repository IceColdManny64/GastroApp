import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  RecipeCategory,
  RecipeDifficulty,
  RecipeFilterState,
  SortOption,
} from '../../types/RecipeItem';

export interface SearchFilterBarProps {
  filters: RecipeFilterState;
  totalResults: number;
  favoritesCount: number;
  darkMode?: boolean;
  onChangeSearch: (text: string) => void;
  onSubmitServerSearch: () => void;
  onSelectCategory: (category: RecipeCategory) => void;
  onSelectDifficulty: (difficulty: RecipeDifficulty) => void;
  onSelectSort: (sortBy: SortOption) => void;
  onToggleOnlyFavorites: () => void;
  onResetFilters: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Por defecto' },
  { value: 'likes_desc', label: 'Mayor aprobación (%)' },
  { value: 'time_asc', label: 'Menor tiempo' },
  { value: 'title_asc', label: 'Nombre (A-Z)' },
];

export default function SearchFilterBar({
  filters,
  totalResults,
  favoritesCount,
  darkMode = false,
  onChangeSearch,
  onSubmitServerSearch,
  onSelectCategory,
  onSelectDifficulty,
  onSelectSort,
  onToggleOnlyFavorites,
  onResetFilters,
}: SearchFilterBarProps) {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.category !== 'Todas' ||
    filters.difficulty !== 'Todas' ||
    filters.sortBy !== 'default' ||
    filters.onlyFavorites;

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, darkMode && styles.searchInputDark]}
          placeholder="Buscar receta por nombre o ingrediente..."
          placeholderTextColor={darkMode ? '#8D7B75' : '#888888'}
          value={filters.searchQuery}
          onChangeText={onChangeSearch}
          onSubmitEditing={onSubmitServerSearch}
          returnKeyType="search"
        />
        <Pressable onPress={onSubmitServerSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>
        Categoría:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {RECIPE_CATEGORIES.map((category) => {
          const isSelected = filters.category === category;
          return (
            <Pressable
              key={category}
              onPress={() => onSelectCategory(category)}
              style={[
                styles.chip,
                darkMode && styles.chipDark,
                isSelected && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  darkMode && styles.chipTextDark,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>
        Dificultad:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {RECIPE_DIFFICULTIES.map((difficulty) => {
          const isSelected = filters.difficulty === difficulty;
          return (
            <Pressable
              key={difficulty}
              onPress={() => onSelectDifficulty(difficulty)}
              style={[
                styles.chip,
                darkMode && styles.chipDark,
                isSelected && styles.chipActiveSecondary,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  darkMode && styles.chipTextDark,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {difficulty}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>
        Ordenar por:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {SORT_OPTIONS.map((option) => {
          const isSelected = filters.sortBy === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelectSort(option.value)}
              style={[
                styles.chip,
                darkMode && styles.chipDark,
                isSelected && styles.chipActiveAccent,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  darkMode && styles.chipTextDark,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onToggleOnlyFavorites}
          style={[
            styles.chip,
            darkMode && styles.chipDark,
            filters.onlyFavorites && styles.chipActive,
          ]}
        >
          <Text
            style={[
              styles.chipText,
              darkMode && styles.chipTextDark,
              filters.onlyFavorites && styles.chipTextActive,
            ]}
          >
            ♥ Solo favoritos ({favoritesCount})
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, darkMode && styles.summaryTextDark]}>
          {totalResults}{' '}
          {totalResults === 1 ? 'receta encontrada' : 'recetas encontradas'}
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={onResetFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpiar filtros</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAE2DF',
  },
  containerDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#2C1E1B',
  },
  searchInputDark: {
    backgroundColor: '#181312',
    borderColor: '#382E2B',
    color: '#F7F2F0',
  },
  searchButton: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
    marginTop: 4,
    marginBottom: 6,
  },
  textDark: {
    color: '#B8A9A4',
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F3ECE9',
    borderWidth: 1,
    borderColor: '#E2D6D1',
  },
  chipDark: {
    backgroundColor: '#181312',
    borderColor: '#382E2B',
  },
  chipActive: {
    backgroundColor: '#C0392B',
    borderColor: '#C0392B',
  },
  chipActiveSecondary: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  chipActiveAccent: {
    backgroundColor: '#753333',
    borderColor: '#753333',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3833',
  },
  chipTextDark: {
    color: '#B8A9A4',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE7',
  },
  summaryText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  summaryTextDark: {
    color: '#B8A9A4',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FDEDEC',
  },
  clearButtonText: {
    color: '#C0392B',
    fontSize: 12,
    fontWeight: '700',
  },
});
