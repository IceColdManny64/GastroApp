export type RecipeCategory =
  | 'Todas'
  | 'Mexicanas'
  | 'Italianas'
  | 'Orientales'
  | 'Estadounidenses'
  | 'Saludables'
  | 'Postres';

export type RecipeDifficulty =
  | 'Todas'
  | 'Muy facil'
  | 'Facil'
  | 'Medio'
  | 'Dificil';

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  'Todas',
  'Mexicanas',
  'Italianas',
  'Orientales',
  'Estadounidenses',
  'Saludables',
  'Postres',
];

export const VALID_RECIPE_CATEGORIES: string[] = [
  'Mexicanas',
  'Italianas',
  'Orientales',
  'Estadounidenses',
  'Saludables',
  'Postres',
];

export const RECIPE_DIFFICULTIES: RecipeDifficulty[] = [
  'Todas',
  'Muy facil',
  'Facil',
  'Medio',
  'Dificil',
];

export const VALID_RECIPE_DIFFICULTIES: string[] = [
  'Muy facil',
  'Facil',
  'Medio',
  'Dificil',
];

export interface RawRecipeDto {
  id: number | string;
  title: string;
  description: string;
  imageURL?: string;
  image?: string;
  preparetime?: string;
  likerate?: number | string;
  category?: string;
  difficulty?: string;
}

export interface RecipeItem {
  id: number;
  title: string;
  description: string;
  image: string;
  imageURL: string;
  prepareTime: string;
  likeRate: number;
  category: string;
  difficulty: string;
}

export interface RecipeFormPayload {
  title: string;
  description: string;
  imageUri: string;
  prepareTime: string;
  likeRate: number;
  category: string;
  difficulty: string;
}

export type SortOption = 'default' | 'likes_desc' | 'time_asc' | 'title_asc';

export interface RecipeFilterState {
  searchQuery: string;
  category: RecipeCategory;
  difficulty: RecipeDifficulty;
  sortBy: SortOption;
  onlyFavorites: boolean;
}
