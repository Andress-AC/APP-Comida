import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/gemini";
import { calcDayTotals } from "@/lib/macros";
import { getEffectiveGoals } from "@/lib/goals";
import { DailyLog, MacroKey, MACRO_LABELS } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const [logsRes, goalsRes, overridesRes, recipesRes, pantryRes] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
      .eq("user_id", user.id)
      .eq("date", today),
    supabase.from("user_goals").select("*").eq("user_id", user.id),
    supabase.from("goal_overrides").select("*").eq("user_id", user.id).eq("date", today),
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*, food:foods(*))")
      .eq("created_by", user.id),
    supabase
      .from("pantry")
      .select("*, food:foods(*)")
      .eq("user_id", user.id)
      .gt("quantity_grams", 0),
  ]);

  const logs = (logsRes.data ?? []) as DailyLog[];
  const totals = calcDayTotals(logs);
  const effectiveGoals = getEffectiveGoals(
    goalsRes.data ?? [],
    overridesRes.data ?? [],
    new Date()
  );

  const goalsText = Array.from(effectiveGoals.entries())
    .map(([macro, g]) => {
      const label = MACRO_LABELS[macro as MacroKey];
      const current = totals[macro as MacroKey];
      if (g.goalType === "min") return `${label}: actual ${current}, objetivo mínimo ${g.min}`;
      if (g.goalType === "max") return `${label}: actual ${current}, objetivo máximo ${g.max}`;
      return `${label}: actual ${current}, objetivo ${g.min}-${g.max}`;
    })
    .join("\n");

  const pantryText = (pantryRes.data ?? [])
    .map((p: any) => `- ${p.food.name}: ${p.quantity_grams}g disponible`)
    .join("\n");

  const recipesText = (recipesRes.data ?? [])
    .map((r: any) => {
      const cats = (r.categories ?? []).join(", ");
      return `- "${r.name}" (${cats || "sin categoría"})`;
    })
    .join("\n");

  // What meals have already been logged
  const loggedMeals = [...new Set(logs.map((l) => l.meal_type))].join(", ");

  const prompt = `Eres un asistente nutricional. El usuario está trackeando sus macros diarios.

ESTADO ACTUAL:
${goalsText || "No hay objetivos configurados."}

COMIDAS YA REGISTRADAS HOY: ${loggedMeals || "ninguna"}

DESPENSA (alimentos disponibles en casa):
${pantryText || "Despensa vacía."}

RECETAS DISPONIBLES (con categoría: desayuno/snack/comida/merienda/cena/postre):
${recipesText || "Sin recetas."}

Da una recomendación breve (2-3 frases máximo) en español sobre:
- Si le falta algo para cumplir sus objetivos, qué podría comer (priorizando lo que tiene en despensa)
- Si se ha pasado en algo, sugiérele alternativas para la siguiente comida
- Si va bien, felicítale brevemente
- Si hay una receta que le vendría bien, recomiéndala. Ten en cuenta la categoría de la receta y qué comidas ya ha hecho hoy (no recomiendes un snack si necesita una cena)

Responde de forma directa y coloquial. No repitas los números exactos que ya ve en pantalla.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const recommendation = result.response.text();
    return NextResponse.json({ recommendation });
  } catch (error: any) {
    const msg = error.message ?? "";
    const friendly = msg.includes("429") || msg.includes("quota")
      ? "Límite de IA alcanzado. Espera unos minutos."
      : "Error al conectar con la IA.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
