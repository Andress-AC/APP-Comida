"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addToPantry(foodId: string, quantityGrams: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("pantry")
    .select("id, quantity_grams")
    .eq("user_id", user!.id)
    .eq("food_id", foodId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("pantry")
      .update({
        quantity_grams: existing.quantity_grams + quantityGrams,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("pantry").insert({
      user_id: user!.id,
      food_id: foodId,
      quantity_grams: quantityGrams,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/despensa");
  return { success: true };
}

export async function updatePantryQuantity(pantryId: string, quantityGrams: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pantry")
    .update({ quantity_grams: quantityGrams, updated_at: new Date().toISOString() })
    .eq("id", pantryId);
  if (error) return { error: error.message };
  revalidatePath("/despensa");
  return { success: true };
}

export async function removeFromPantry(pantryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pantry").delete().eq("id", pantryId);
  if (error) return { error: error.message };
  revalidatePath("/despensa");
  return { success: true };
}
