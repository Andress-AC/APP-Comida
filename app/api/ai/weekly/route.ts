import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/gemini";
import { DailyLog, MacroTotals, UserGoal, MacroKey, MACRO_LABELS } from "@/lib/types";
import { calcLogMacros, addMacros } from "@/lib/macros";

const ZERO: MacroTotals = { kcal: 0, protein: 0, fat: 0, saturated_fat: 0, carbs: 0, sugar: 0, fiber: 0, salt: 0 };

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromStr = from.toISOString().split("T")[0];

  const [logsRes, goalsRes] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
      .eq("user_id", user.id)
      .gte("date", fromStr)
      .order("date"),
    supabase.from("user_goals").select("*").eq("user_id", user.id),
  ]);

  // Group logs by date and calculate daily totals
  const dayMap = new Map<string, MacroTotals>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().split("T")[0], { ...ZERO });
  }

  for (const log of (logsRes.data ?? []) as DailyLog[]) {
    const existing = dayMap.get(log.date) ?? { ...ZERO };
    dayMap.set(log.date, addMacros(existing, calcLogMacros(log)));
  }

  const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const daysSummary = days
    .map(([date, t]) => {
      const dow = new Date(date + "T12:00:00").getDay();
      const name = dayNames[(dow + 6) % 7];
      if (t.kcal === 0) return `${name} (${date}): sin registros`;
      return `${name} (${date}): ${t.kcal} kcal, ${t.protein}g prot, ${t.carbs}g carbs, ${t.fat}g grasa`;
    })
    .join("\n");

  const goals = (goalsRes.data ?? []) as UserGoal[];
  const goalsText = goals.length
    ? goals
        .map((g) => {
          const label = MACRO_LABELS[g.macro as MacroKey];
          if (g.goal_type === "min") return `${label}: mínimo ${g.value_min}`;
          if (g.goal_type === "max") return `${label}: máximo ${g.value_max}`;
          return `${label}: entre ${g.value_min} y ${g.value_max}`;
        })
        .join("\n")
    : "Sin objetivos configurados";

  const daysWithData = days.filter(([, t]) => t.kcal > 0);
  const avgKcal = daysWithData.length
    ? Math.round(daysWithData.reduce((s, [, t]) => s + t.kcal, 0) / daysWithData.length)
    : 0;

  const prompt = `Eres un nutricionista personal. Analiza los datos nutricionales de esta semana y genera un informe breve en español.

DATOS DE LA SEMANA:
${daysSummary}

OBJETIVOS DEL USUARIO:
${goalsText}

PROMEDIO SEMANAL: ${avgKcal} kcal/día (en ${daysWithData.length} de 7 días registrados)

Responde SOLO con un JSON válido, sin markdown, con este formato exacto:
{
  "resumen": "2-3 frases sobre cómo ha ido la semana en general",
  "fortalezas": ["punto positivo 1", "punto positivo 2"],
  "mejoras": ["área de mejora 1", "área de mejora 2"],
  "sugerencias": ["sugerencia concreta para la próxima semana 1", "sugerencia 2", "sugerencia 3"]
}

Sé directo, específico y usa los datos reales. Máximo 2 elementos en fortalezas y mejoras, máximo 3 sugerencias.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo generar el análisis" }, { status: 500 });

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    const friendly = msg.includes("429") || msg.includes("quota")
      ? "Has alcanzado el límite de la IA. Espera unos minutos e inténtalo de nuevo."
      : "Error al generar el análisis. Inténtalo de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
