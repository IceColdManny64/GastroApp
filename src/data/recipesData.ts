import { RawRecipeDto } from '../types/RecipeItem';
import recipesRaw from './recipes.json';

export const INITIAL_RECIPES_DATA: RawRecipeDto[] = recipesRaw as unknown as RawRecipeDto[];
