import { Food, MacroKey, MacroTotals, RecipeWithIngredients, DailyLog } from "./types";

const ZERO_MACROS: MacroTotals = {
  kcal: 0, protein: 0, fat: 0, saturated_fat: 0,
  carbs: 0, sugar: 0, fiber: 0, salt: 0,
};

/** Calculate macros for a given food and quantity in grams */
export function calcFoodMacros(food: Food, grams: number): MacroTotals {
  const factor = grams / 100;
  return {
    kcal: round(food.kcal * factor),
    protein: round(food.protein * factor),
    fat: round(food.fat * factor),
    saturated_fat: round(food.saturated_fat * factor),
    carbs: round(food.carbs * factor),
    sugar: round(food.sugar * factor),
    fiber: round(food.fiber * factor),
    salt: round(food.salt * factor),
  };
}

/** Calculate total macros for a recipe (sum of all ingredients) */
export function calcRecipeMacros(recipe: RecipeWithIngredients): MacroTotals {
  return recipe.recipe_ingredients.reduce((totals, ing) => {
    const ingMacros = calcFoodMacros(ing.food, ing.quantity_grams);
    return addMacros(totals, ingMacros);
  }, { ...ZERO_MACROS });
}

/** Calculate macros for a single daily log entry */
export function calcLogMacros(log: DailyLog): MacroTotals {
  if (log.food && log.quantity_grams != null) {
    return calcFoodMacros(log.food, log.quantity_grams);
  }
  if (log.recipe) {
    const recipeMacros = calcRecipeMacros(log.recipe);
    return multiplyMacros(recipeMacros, log.multiplier);
  }
  // Custom macro entry
  if (log.custom_kcal != null) {
    return {
      kcal: log.custom_kcal,
      protein: log.custom_protein ?? 0,
      fat: log.custom_fat ?? 0,
      saturated_fat: 0,
      carbs: log.custom_carbs ?? 0,
      sugar: 0,
      fiber: log.custom_fiber ?? 0,
      salt: 0,
    };
  }
  return { ...ZERO_MACROS };
}

/** Sum macros from all daily logs */
export function calcDayTotals(logs: DailyLog[]): MacroTotals {
  return logs.reduce((totals, log) => {
    return addMacros(totals, calcLogMacros(log));
  }, { ...ZERO_MACROS });
}

export function addMacros(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    kcal: round(a.kcal + b.kcal),
    protein: round(a.protein + b.protein),
    fat: round(a.fat + b.fat),
    saturated_fat: round(a.saturated_fat + b.saturated_fat),
    carbs: round(a.carbs + b.carbs),
    sugar: round(a.sugar + b.sugar),
    fiber: round(a.fiber + b.fiber),
    salt: round(a.salt + b.salt),
  };
}

export function multiplyMacros(m: MacroTotals, factor: number): MacroTotals {
  return {
    kcal: round(m.kcal * factor),
    protein: round(m.protein * factor),
    fat: round(m.fat * factor),
    saturated_fat: round(m.saturated_fat * factor),
    carbs: round(m.carbs * factor),
    sugar: round(m.sugar * factor),
    fiber: round(m.fiber * factor),
    salt: round(m.salt * factor),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
