import { RecipeCategory } from './RecipeItem';

export interface LoginSuccessResponse {
  login: 'success' | 'failed';
  id?: number;
  email?: string;
  message?: string;
  error?: string;
}

export interface RegisterResponse {
  store?: 'success';
  error?: string;
}

export interface UpdateCredentialsResponse {
  status: 'success' | 'error';
  message?: string;
  exists?: boolean;
  valid?: boolean;
  id?: number;
  affected_rows?: number;
  error?: string;
}

export interface UserProfileResponse {
  id: number | string;
  email: string;
  password?: string;
  error?: string;
}

export interface UserSession {
  id: number;
  email: string;
  token: string;
}

export type PageSizeOption = 10 | 20 | 30;

export interface UserSettings {
  itemsPerPage: PageSizeOption;
  themeMode: 'light' | 'dark';
  defaultCategory: RecipeCategory;
  compactCards: boolean;
}
