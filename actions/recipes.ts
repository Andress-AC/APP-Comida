"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getRecipes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, food:foods(*))")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getRecipe(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, food:foods(*))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRecipe(name: string, categories: string[] = ["comida", "cena"]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("recipes")
    .insert({ name, categories, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/recetas");
  return { success: true, id: data.id };
}

export async function updateRecipeCategories(id: string, categories: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").update({ categories }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  return { success: true };
}

export async function updateRecipeElaboration(id: string, elaboration: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").update({ elaboration }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/recetas/${id}`);
  return { success: true };
}

export async function updateRecipeName(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").update({ name }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  return { success: true };
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();

  // 1. Fetch the recipe with ingredients so we can compute macros
  const { data: recipe } = await supabase
    .from("recipes")
    .select("name, recipe_ingredients(food_id, quantity_grams, food:foods(kcal, protein, fat, carbs, fiber))")
    .eq("id", id)
    .single();

  // 2. Fetch all logs that reference this recipe
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("id, multiplier")
    .eq("recipe_id", id);

  // 3. Convert each log to a custom entry (so history is preserved)
  if (recipe && logs && logs.length > 0) {
    // Compute total recipe macros
    type Ing = { quantity_grams: number; food: { kcal: number; protein: number; fat: number; carbs: number; fiber: number } | null };
    const ingredients = (recipe.recipe_ingredients as unknown as Ing[]) ?? [];
    const recipeKcal = ingredients.reduce((s, ing) => s + (ing.food ? ing.food.kcal * ing.quantity_grams / 100 : 0), 0);
    const recipeProtein = ingredients.reduce((s, ing) => s + (ing.food ? ing.food.protein * ing.quantity_grams / 100 : 0), 0);
    const recipeFat = ingredients.reduce((s, ing) => s + (ing.food ? ing.food.fat * ing.quantity_grams / 100 : 0), 0);
    const recipeCarbs = ingredients.reduce((s, ing) => s + (ing.food ? ing.food.carbs * ing.quantity_grams / 100 : 0), 0);
    const recipeFiber = ingredients.reduce((s, ing) => s + (ing.food ? ing.food.fiber * ing.quantity_grams / 100 : 0), 0);

    // Upsert each log as custom entry (nullify recipe_id, set custom_* fields)
    for (const log of logs) {
      const mult = log.multiplier ?? 1;
      const round = (n: number) => Math.round(n * 10) / 10;
      await supabase
        .from("daily_logs")
        .update({
          recipe_id: null,
          custom_name: recipe.name,
          custom_kcal: round(recipeKcal * mult),
          custom_protein: round(recipeProtein * mult),
          custom_fat: round(recipeFat * mult),
          custom_carbs: round(recipeCarbs * mult),
          custom_fiber: round(recipeFiber * mult),
        })
        .eq("id", log.id);
    }
  }

  // 4. Delete the recipe
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recetas");
  revalidatePath("/hoy");
  revalidatePath("/historial", "layout");
  return { success: true };
}

export async function duplicateRecipe(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch original recipe with its ingredients
  const { data: original, error: fetchError } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(food_id, quantity_grams)")
    .eq("id", id)
    .single();
  if (fetchError || !original) return { error: "Receta no encontrada" };

  // Create the copy
  const { data: copy, error: createError } = await supabase
    .from("recipes")
    .insert({ name: `Copia de ${original.name}`, categories: original.categories, created_by: user.id })
    .select()
    .single();
  if (createError || !copy) return { error: createError?.message ?? "Error al duplicar" };

  // Copy all ingredients
  if (original.recipe_ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      original.recipe_ingredients.map((ing: { food_id: string; quantity_grams: number }) => ({
        recipe_id: copy.id,
        food_id: ing.food_id,
        quantity_grams: ing.quantity_grams,
      }))
    );
  }

  revalidatePath("/recetas");
  return { success: true, id: copy.id };
}

export async function addIngredient(recipeId: string, foodId: string, quantityGrams: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipe_ingredients").insert({
    recipe_id: recipeId,
    food_id: foodId,
    quantity_grams: quantityGrams,
  });
  if (error) return { error: error.message };
  revalidatePath(`/recetas/${recipeId}`);
  return { success: true };
}

export async function updateIngredient(ingredientId: string, recipeId: string, quantityGrams: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipe_ingredients")
    .update({ quantity_grams: quantityGrams })
    .eq("id", ingredientId);
  if (error) return { error: error.message };
  revalidatePath(`/recetas/${recipeId}`);
  return { success: true };
}

export async function removeIngredient(ingredientId: string, recipeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipe_ingredients").delete().eq("id", ingredientId);
  if (error) return { error: error.message };
  revalidatePath(`/recetas/${recipeId}`);
  return { success: true };
}
