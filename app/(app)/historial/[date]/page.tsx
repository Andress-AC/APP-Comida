import { createClient } from "@/lib/supabase/server";
import { DailyLog, DailyExercise, MEAL_CATEGORY_LABELS, MealCategory } from "@/lib/types";
import { calcDayTotals, calcLogMacros } from "@/lib/macros";
import { getEffectiveGoals, evaluateGoals } from "@/lib/goals";
import { MACRO_LABELS, MACRO_UNITS, ALL_MACROS } from "@/lib/types";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [logsRes, goalsRes, overridesRes, noteRes, exerciseRes] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
      .eq("user_id", user!.id)
      .eq("date", date)
      .order("logged_at"),
    supabase.from("user_goals").select("*").eq("user_id", user!.id),
    supabase.from("goal_overrides").select("*").eq("user_id", user!.id).eq("date", date),
    supabase
      .from("daily_notes")
      .select("content")
      .eq("user_id", user!.id)
      .eq("date", date)
      .single(),
    supabase
      .from("daily_exercise")
      .select("*")
      .eq("user_id", user!.id)
      .eq("date", date)
      .order("created_at"),
  ]);

  const logs = (logsRes.data ?? []) as DailyLog[];
  const exercises = (exerciseRes.data ?? []) as DailyExercise[];
  const totals = calcDayTotals(logs);
  const effectiveGoals = getEffectiveGoals(goalsRes.data ?? [], overridesRes.data ?? [], new Date(date + "T00:00:00"));
  const goalStatuses = evaluateGoals(effectiveGoals, totals);
  const allMet = goalStatuses.length > 0 && goalStatuses.every((s) => s.met);
  const noteContent = noteRes.data?.content;

  const d = new Date(date + "T00:00:00");
  const dateFormatted = d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stepsEntry = exercises.find((e) => e.steps != null);
  const activities = exercises.filter((e) => e.description);
  const caloriesBurned = exercises.reduce((sum, e) => sum + (e.calories_burned ?? 0), 0);
  const netKcal = Math.round(totals.kcal - caloriesBurned);
  const kcalGoal = effectiveGoals.get("kcal");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold capitalize">{dateFormatted}</h1>
        {goalStatuses.length > 0 && (
          <p className="text-lg mt-1">{allMet ? "Objetivos cumplidos" : "Objetivos no cumplidos"}</p>
        )}
      </div>

      {noteContent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 italic">{noteContent}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold mb-2">Resumen de macros</h2>
        {ALL_MACROS.map((macro) => {
          const status = goalStatuses.find((s) => s.macro === macro);
          return (
            <div key={macro} className="flex items-center justify-between text-sm">
              <span>{MACRO_LABELS[macro]}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {totals[macro]}{MACRO_UNITS[macro]}
                </span>
                {status && (
                  <>
                    <span className="text-xs">{status.met ? "OK" : "X"}</span>
                    <span
                      className={`text-xs ${
                        status.severity === "good"
                          ? "text-green-600 font-medium"
                          : status.severity === "bad"
                          ? "text-red-600 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      ({status.difference > 0 ? "+" : ""}{status.difference})
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(stepsEntry || activities.length > 0) && (
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold mb-2">Ejercicio</h2>
          {stepsEntry && (
            <p className="text-sm">Pasos: <span className="font-medium">{stepsEntry.steps?.toLocaleString()}</span></p>
          )}
          {activities.map((ex) => (
            <div key={ex.id} className="text-sm flex items-center gap-2">
              <span>{ex.description}</span>
              {ex.calories_burned && (
                <span className="text-xs text-gray-400">~{ex.calories_burned} kcal</span>
              )}
            </div>
          ))}
          {caloriesBurned > 0 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm space-y-1 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Consumidas</span>
                <span>{Math.round(totals.kcal)} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quemadas</span>
                <span className="text-green-600">-{Math.round(caloriesBurned)} kcal</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Balance neto</span>
                <span className="flex items-center gap-1.5">
                  <span>{netKcal} kcal</span>
                  {kcalGoal && (() => {
                    const target = kcalGoal.goalType === "max" ? kcalGoal.max! : kcalGoal.min!;
                    const diff = netKcal - target;
                    const pct = target > 0 ? (diff / target) * 100 : 0;
                    const color = pct > 10 ? "text-green-600" : pct < -10 ? "text-red-600" : "text-gray-400";
                    return (
                      <>
                        <span className="text-gray-400 font-normal">/ {target}</span>
                        <span className={`text-xs ${color}`}>({diff > 0 ? "+" : ""}{Math.round(diff)})</span>
                      </>
                    );
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">Detalle de comidas ({logs.length})</h2>
        {logs.map((log) => {
          const macros = calcLogMacros(log);
          const name = log.food?.name ?? log.recipe?.name ?? "Desconocido";
          const detail = log.food ? `${log.quantity_grams}g` : `x${log.multiplier}`;
          const mealLabel = MEAL_CATEGORY_LABELS[log.meal_type as MealCategory] ?? log.meal_type;
          const time = new Date(log.logged_at).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={log.id}
              className="bg-white rounded-lg border px-4 py-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{name}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{mealLabel}</span>
                </div>
                <span className="text-xs text-gray-400">{time}</span>
              </div>
              <p className="text-sm text-gray-500">
                {detail} — {macros.kcal} kcal · {macros.protein}g prot · {macros.fat}g grasa · {macros.carbs}g carbs
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
