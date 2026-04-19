"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addShoppingItem(name: string, qty?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("shopping_items").insert({
    user_id: user.id,
    name: name.trim(),
    qty_text: qty?.trim() || null,
    is_checked: false,
  });
  if (error) throw error;
  revalidatePath("/compra");
}

export async function toggleShoppingItem(id: string, checked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("shopping_items")
    .update({ is_checked: checked })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/compra");
}

export async function deleteShoppingItem(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("shopping_items").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/compra");
}

export async function clearCheckedItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("shopping_items")
    .delete()
    .eq("user_id", user.id)
    .eq("is_checked", true);

  revalidatePath("/compra");
}
