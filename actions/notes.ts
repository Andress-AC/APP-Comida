"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertNote(date: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Try update first
  const { data: existing } = await supabase
    .from("daily_notes")
    .select("id")
    .eq("user_id", user!.id)
    .eq("date", date)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("daily_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    if (!content.trim()) return { success: true };
    const { error } = await supabase.from("daily_notes").insert({
      user_id: user!.id,
      date,
      content,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/hoy");
  revalidatePath(`/historial/${date}`);
  return { success: true };
}

export async function getNote(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("daily_notes")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .single();

  return data;
}
