"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getExercises(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("daily_exercise")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .order("created_at");

  return data ?? [];
}

export async function addExercise(
  date: string,
  description: string,
  caloriesBurned: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("daily_exercise").insert({
    user_id: user!.id,
    date,
    description,
    calories_burned: caloriesBurned,
  });

  if (error) return { error: error.message };
  revalidatePath("/hoy");
  return { success: true };
}

export async function updateSteps(date: string, steps: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Upsert: find existing steps entry or create one
  const { data: existing } = await supabase
    .from("daily_exercise")
    .select("id")
    .eq("user_id", user!.id)
    .eq("date", date)
    .is("description", null)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("daily_exercise")
      .update({ steps, steps_source: "manual" })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("daily_exercise").insert({
      user_id: user!.id,
      date,
      steps,
      steps_source: "manual",
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/hoy");
  return { success: true };
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("daily_exercise").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hoy");
  return { success: true };
}
