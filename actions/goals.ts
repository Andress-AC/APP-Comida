"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { MacroKey, GoalType } from "@/lib/types";

export async function getGoals() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: goals } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", user!.id);

  const { data: overrides } = await supabase
    .from("goal_overrides")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", new Date().toISOString().split("T")[0]);

  return { goals: goals ?? [], overrides: overrides ?? [] };
}

export async function upsertGoal(
  macro: MacroKey,
  goalType: GoalType,
  valueMin: number | null,
  valueMax: number | null,
  dayOfWeek: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let deleteQuery = supabase
    .from("user_goals")
    .delete()
    .eq("user_id", user!.id)
    .eq("macro", macro);

  if (dayOfWeek === null) {
    deleteQuery = deleteQuery.is("day_of_week", null);
  } else {
    deleteQuery = deleteQuery.eq("day_of_week", dayOfWeek);
  }
  await deleteQuery;

  const { error } = await supabase.from("user_goals").insert({
    user_id: user!.id,
    macro,
    goal_type: goalType,
    value_min: valueMin,
    value_max: valueMax,
    day_of_week: dayOfWeek,
  });

  if (error) return { error: error.message };
  revalidatePath("/objetivos");
  return { success: true };
}

export async function removeGoal(macro: MacroKey, dayOfWeek: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("user_goals")
    .delete()
    .eq("user_id", user!.id)
    .eq("macro", macro);

  if (dayOfWeek === null) {
    query = query.is("day_of_week", null);
  } else {
    query = query.eq("day_of_week", dayOfWeek);
  }

  const { error } = await query;
  if (error) return { error: error.message };
  revalidatePath("/objetivos");
  return { success: true };
}

export async function upsertOverride(
  date: string,
  macro: MacroKey,
  goalType: GoalType,
  valueMin: number | null,
  valueMax: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from("goal_overrides")
    .delete()
    .eq("user_id", user!.id)
    .eq("date", date)
    .eq("macro", macro);

  const { error } = await supabase.from("goal_overrides").insert({
    user_id: user!.id,
    date,
    macro,
    goal_type: goalType,
    value_min: valueMin,
    value_max: valueMax,
  });

  if (error) return { error: error.message };
  revalidatePath("/objetivos");
  return { success: true };
}

export async function updateDayStartHour(hour: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const clamped = Math.max(0, Math.min(12, Math.round(hour)));
  const { error } = await supabase
    .from("profiles")
    .update({ day_start_hour: clamped })
    .eq("id", user!.id);

  if (error) return { error: error.message };
  revalidatePath("/objetivos");
  revalidatePath("/hoy");
  revalidatePath("/historial");
  return { success: true };
}

export async function removeOverride(date: string, macro: MacroKey) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("goal_overrides")
    .delete()
    .eq("user_id", user!.id)
    .eq("date", date)
    .eq("macro", macro);

  if (error) return { error: error.message };
  revalidatePath("/objetivos");
  return { success: true };
}
