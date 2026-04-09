"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getEffectiveDateStr } from "@/lib/dates";
import { DayTemplate } from "@/lib/types";

async function getUserAndDate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("day_start_hour")
    .eq("id", user!.id)
    .single();
  const today = getEffectiveDateStr(profile?.day_start_hour ?? 5);
  return { supabase, user: user!, today };
}

export async function getTemplates(): Promise<DayTemplate[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("day_templates")
    .select("*, day_template_items(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as DayTemplate[];
}

export async function saveAsTemplate(name: string, sourceDate?: string) {
  const { supabase, user, today } = await getUserAndDate();
  const date = sourceDate ?? today;

  const { data: logs, error } = await supabase
    .from("daily_logs")
    .select("food_id, recipe_id, quantity_grams, multiplier, meal_type")
    .eq("user_id", user.id)
    .eq("date", date);

  if (error) return { error: error.message };
  if (!logs || logs.length === 0) return { error: "No hay registros para guardar como plantilla" };

  const { data: template, error: tplError } = await supabase
    .from("day_templates")
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (tplError) return { error: tplError.message };

  const items = logs.map((log) => ({
    template_id: template.id,
    food_id: log.food_id,
    recipe_id: log.recipe_id,
    quantity_grams: log.quantity_grams,
    multiplier: log.multiplier ?? 1,
    meal_type: log.meal_type,
  }));

  const { error: itemsError } = await supabase.from("day_template_items").insert(items);
  if (itemsError) return { error: itemsError.message };

  revalidatePath("/hoy");
  return { success: true };
}

export async function applyTemplate(templateId: string) {
  const { supabase, user, today } = await getUserAndDate();

  const { data: items, error } = await supabase
    .from("day_template_items")
    .select("*")
    .eq("template_id", templateId);

  if (error) return { error: error.message };
  if (!items || items.length === 0) return { error: "La plantilla está vacía" };

  const newLogs = items.map((item) => ({
    user_id: user.id,
    date: today,
    food_id: item.food_id,
    recipe_id: item.recipe_id,
    quantity_grams: item.quantity_grams,
    multiplier: item.multiplier ?? 1,
    meal_type: item.meal_type,
  }));

  const { error: insertError } = await supabase.from("daily_logs").insert(newLogs);
  if (insertError) return { error: insertError.message };

  revalidatePath("/hoy");
  return { success: true, count: newLogs.length };
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("day_templates")
    .delete()
    .eq("id", templateId);

  if (error) return { error: error.message };

  revalidatePath("/hoy");
  return { success: true };
}
