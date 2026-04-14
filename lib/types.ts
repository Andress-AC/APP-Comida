export type MacroKey =
  | "kcal"
  | "protein"
  | "fat"
  | "saturated_fat"
  | "carbs"
  | "sugar"
  | "fiber"
  | "salt";

export const MACRO_LABELS: Record<MacroKey, string> = {
  kcal: "Calorías",
  protein: "Proteínas",
  fat: "Grasas",
  saturated_fat: "Grasas sat.",
  carbs: "Carbohidratos",
  sugar: "Azúcares",
  fiber: "Fibra",
  salt: "Sal",
};

export const MACRO_UNITS: Record<MacroKey, string> = {
  kcal: "kcal",
  protein: "g",
  fat: "g",
  saturated_fat: "g",
  carbs: "g",
  sugar: "g",
  fiber: "g",
  salt: "g",
};

export const MACRO_COLORS: Record<MacroKey, string> = {
  kcal: "#F97316",        // naranja fuerte brillante
  protein: "#7F1D1D",     // rojo oscuro
  fat: "#CA8A04",         // dorado cálido
  saturated_fat: "#D97706", // ámbar
  carbs: "#A8876A",       // marrón claro
  sugar: "#EC4899",       // rosa
  fiber: "#22C55E",       // verde
  salt: "#93C5FD",        // azul pálido
};

export const ALL_MACROS: MacroKey[] = [
  "kcal",
  "protein",
  "fat",
  "saturated_fat",
  "carbs",
  "sugar",
  "fiber",
  "salt",
];

export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  day_start_hour: number;
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  is_global: boolean;
  created_by: string;
  category: string | null;
  subcategory: string | null;
  store: string | null;
  kcal: number;
  protein: number;
  fat: number;
  saturated_fat: number;
  carbs: number;
  sugar: number;
  fiber: number;
  salt: number;
  created_at: string;
}

export interface FoodUnit {
  id: string;
  food_id: string;
  name: string;
  grams: number;
  created_at: string;
}

export interface FoodWithUnits extends Food {
  food_units: FoodUnit[];
}

export type MealCategory = "desayuno" | "snack" | "comida" | "merienda" | "cena" | "postre";

export const MEAL_CATEGORIES: { value: MealCategory; label: string }[] = [
  { value: "desayuno", label: "Desayuno" },
  { value: "snack", label: "Snack" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "postre", label: "Postre" },
];

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  desayuno: "Desayuno",
  snack: "Snack",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  postre: "Postre",
};

export interface Recipe {
  id: string;
  name: string;
  categories: MealCategory[];
  image_url: string | null;
  created_by: string;
  created_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  food_id: string;
  quantity_grams: number;
  food?: Food;
  created_at: string;
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: (RecipeIngredient & { food: Food })[];
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  food_id: string | null;
  recipe_id: string | null;
  quantity_grams: number | null;
  multiplier: number;
  meal_type: MealCategory;
  logged_at: string;
  image_url: string | null;
  food?: FoodWithUnits;
  recipe?: RecipeWithIngredients;
}

export interface PantryItem {
  id: string;
  user_id: string;
  food_id: string;
  quantity_grams: number;
  updated_at: string;
  food?: Food;
}

export type GoalType = "min" | "max" | "range";

export interface UserGoal {
  id: string;
  user_id: string;
  macro: MacroKey;
  goal_type: GoalType;
  value_min: number | null;
  value_max: number | null;
  day_of_week: number | null;
  created_at: string;
}

export interface GoalOverride {
  id: string;
  user_id: string;
  date: string;
  macro: MacroKey;
  goal_type: GoalType;
  value_min: number | null;
  value_max: number | null;
  created_at: string;
}

export interface DailyNote {
  id: string;
  user_id: string;
  date: string;
  content: string;
  updated_at: string;
}

export interface DailyExercise {
  id: string;
  user_id: string;
  date: string;
  steps: number | null;
  steps_source: string;
  description: string | null;
  calories_burned: number | null;
  created_at: string;
}

export interface UserFavorites {
  foodIds: Set<string>;
  recipeIds: Set<string>;
}

export interface DayTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  day_template_items?: DayTemplateItem[];
}

export interface DayTemplateItem {
  id: string;
  template_id: string;
  food_id: string | null;
  recipe_id: string | null;
  quantity_grams: number | null;
  multiplier: number;
  meal_type: MealCategory;
  created_at: string;
}

export interface MacroTotals {
  kcal: number;
  protein: number;
  fat: number;
  saturated_fat: number;
  carbs: number;
  sugar: number;
  fiber: number;
  salt: number;
}
