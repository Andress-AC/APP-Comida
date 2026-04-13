"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUserLists() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lists } = await supabase
    .from("food_lists")
    .select("id, name, created_at")
    .eq("user_id", user!.id)
    .order("created_at");

  const { data: items } = await supabase
    .from("food_list_items")
    .select("list_id, food_id")
    .in("list_id", (lists ?? []).map((l: any) => l.id));

  // Map: listId → Set<foodId>
  const itemsByList = new Map<string, Set<string>>();
  for (const item of items ?? []) {
    if (!itemsByList.has(item.list_id)) itemsByList.set(item.list_id, new Set());
    itemsByList.get(item.list_id)!.add(item.food_id);
  }

  return (lists ?? []).map((l: any) => ({
    id: l.id as string,
    name: l.name as string,
    foodIds: itemsByList.get(l.id) ?? new Set<string>(),
  }));
}

export async function createList(name: string) {
  if (!name.trim()) return { error: "El nombre no puede estar vacío" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("food_lists")
    .insert({ user_id: user!.id, name: name.trim() });

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function deleteList(listId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("food_lists")
    .delete()
    .eq("id", listId);

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function addFoodToList(listId: string, foodId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Insert into list
  const { error } = await supabase
    .from("food_list_items")
    .upsert({ list_id: listId, food_id: foodId }, { onConflict: "list_id,food_id" });

  if (error) return { error: error.message };

  // Auto-favorite
  await supabase
    .from("user_favorites")
    .upsert({ user_id: user!.id, food_id: foodId }, { onConflict: "user_id,food_id" });

  revalidatePath("/alimentos");
  return { success: true };
}

export async function removeFoodFromList(listId: string, foodId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("food_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("food_id", foodId);

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}
