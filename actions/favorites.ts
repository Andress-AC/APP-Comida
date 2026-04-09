"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFavorites() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("user_favorites")
    .select("food_id, recipe_id")
    .eq("user_id", user!.id);

  return {
    foodIds: new Set((data ?? []).map((f: any) => f.food_id).filter(Boolean) as string[]),
    recipeIds: new Set((data ?? []).map((f: any) => f.recipe_id).filter(Boolean) as string[]),
  };
}

export async function toggleFavoriteFood(foodId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user!.id)
    .eq("food_id", foodId)
    .single();

  if (existing) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("user_favorites").insert({ user_id: user!.id, food_id: foodId });
  }

  revalidatePath("/alimentos");
  revalidatePath("/hoy");
  return { isFavorite: !existing };
}

export async function toggleFavoriteRecipe(recipeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user!.id)
    .eq("recipe_id", recipeId)
    .single();

  if (existing) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("user_favorites").insert({ user_id: user!.id, recipe_id: recipeId });
  }

  revalidatePath("/recetas");
  revalidatePath("/hoy");
  return { isFavorite: !existing };
}
