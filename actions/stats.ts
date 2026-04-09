"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logWeight(weightKg: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("weight_logs")
    .upsert({ user_id: user.id, date: today, weight_kg: weightKg }, { onConflict: "user_id,date" });

  if (error) return { error: error.message };
  revalidatePath("/estadisticas");
  return { success: true };
}
