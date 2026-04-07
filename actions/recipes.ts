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
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recetas");
  return { success: true };
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
