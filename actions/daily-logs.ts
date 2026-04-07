"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getEffectiveDateStr } from "@/lib/dates";

async function getUserEffectiveDate(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("day_start_hour")
    .eq("id", user!.id)
    .single();
  return getEffectiveDateStr(profile?.day_start_hour ?? 5);
}

export async function getDayLogs(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
    .eq("user_id", user!.id)
    .eq("date", date)
    .order("logged_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function logFood(foodId: string, quantityGrams: number, mealType: string = "comida", date?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("daily_logs").insert({
    user_id: user!.id,
    food_id: foodId,
    quantity_grams: quantityGrams,
    meal_type: mealType,
    date: date ?? await getUserEffectiveDate(),
  });

  if (error) return { error: error.message };

  // Auto-deduct from pantry
  const { data: pantryItem } = await supabase
    .from("pantry")
    .select("id, quantity_grams")
    .eq("user_id", user!.id)
    .eq("food_id", foodId)
    .single();

  if (pantryItem) {
    const newQty = Math.max(0, pantryItem.quantity_grams - quantityGrams);
    await supabase
      .from("pantry")
      .update({ quantity_grams: newQty, updated_at: new Date().toISOString() })
      .eq("id", pantryItem.id);
  }

  revalidatePath("/hoy");
  revalidatePath("/despensa");
  return { success: true };
}

export async function logRecipe(recipeId: string, multiplier: number, mealType: string = "comida", date?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("daily_logs").insert({
    user_id: user!.id,
    recipe_id: recipeId,
    multiplier,
    meal_type: mealType,
    date: date ?? await getUserEffectiveDate(),
  });

  if (error) return { error: error.message };

  // Auto-deduct recipe ingredients from pantry
  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("food_id, quantity_grams")
    .eq("recipe_id", recipeId);

  if (ingredients) {
    for (const ing of ingredients) {
      const { data: pantryItem } = await supabase
        .from("pantry")
        .select("id, quantity_grams")
        .eq("user_id", user!.id)
        .eq("food_id", ing.food_id)
        .single();

      if (pantryItem) {
        const newQty = Math.max(0, pantryItem.quantity_grams - ing.quantity_grams * multiplier);
        await supabase
          .from("pantry")
          .update({ quantity_grams: newQty, updated_at: new Date().toISOString() })
          .eq("id", pantryItem.id);
      }
    }
  }

  revalidatePath("/hoy");
  revalidatePath("/despensa");
  return { success: true };
}

export async function deleteLog(logId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("daily_logs").delete().eq("id", logId);
  if (error) return { error: error.message };
  revalidatePath("/hoy");
  return { success: true };
}
