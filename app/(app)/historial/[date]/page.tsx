import { createClient } from "@/lib/supabase/server";
import { DailyLog, DailyExercise, FoodWithUnits, RecipeWithIngredients } from "@/lib/types";
import { calcDayTotals } from "@/lib/macros";
import { getEffectiveGoals, evaluateGoals } from "@/lib/goals";
import { MACRO_LABELS, MACRO_UNITS, ALL_MACROS } from "@/lib/types";
import ShareDayButton from "@/components/ShareDayButton";
import LogEntry from "@/components/LogEntry";
import ManualLogForm from "@/components/ManualLogForm";
import { getFavorites } from "@/actions/favorites";
import { fetchAllRows } from "@/lib/fetch-all-foods";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [logsRes, goalsRes, overridesRes, noteRes, exerciseRes, foodsData, recipesRes, favs] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("*, food:foods(*, food_units(*)), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
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
    fetchAllRows(supabase, "foods", "*, food_units(*)"),
    supabase.from("recipes").select("*, recipe_ingredients(*, food:foods(*))").order("name"),
    getFavorites(),
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
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="heading-display text-2xl capitalize">{dateFormatted}</h1>
          {logs.length > 0 && (
            <ShareDayButton
              date={date}
              dateLabel={dateFormatted}
              totals={totals}
              goalsMet={goalStatuses.length > 0 ? allMet : null}
            />
          )}
        </div>
        {goalStatuses.length > 0 && (
          <p className={`text-sm ${allMet ? "text-emerald-400" : "text-red-400"}`}>
            {allMet ? "Objetivos cumplidos" : "Objetivos no cumplidos"}
          </p>
        )}
      </div>

      {noteContent && (
        <div className="glass-card p-3 border-amber-500/30">
          <p className="text-sm text-amber-200/70 italic">{noteContent}</p>
        </div>
      )}

      <div className="glass-card p-4 space-y-2">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Resumen de macros</h2>
        {ALL_MACROS.map((macro) => {
          const status = goalStatuses.find((s) => s.macro === macro);
          return (
            <div key={macro} className="flex items-center justify-between text-sm">
              <span className="text-white/50">{MACRO_LABELS[macro]}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white/80">
                  {totals[macro]}{MACRO_UNITS[macro]}
                </span>
                {status && (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.met ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span
                      className={`text-xs ${
                        status.severity === "good"
                          ? "text-emerald-400 font-medium"
                          : status.severity === "bad"
                          ? "text-red-400 font-medium"
                          : "text-white/30"
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
        <div className="glass-card p-4 space-y-2">
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Ejercicio</h2>
          {stepsEntry && (
            <p className="text-sm text-white/60">Pasos: <span className="font-medium text-white/80">{stepsEntry.steps?.toLocaleString()}</span></p>
          )}
          {activities.map((ex) => (
            <div key={ex.id} className="text-sm flex items-center gap-2">
              <span className="text-white/70">{ex.description}</span>
              {ex.calories_burned && (
                <span className="text-xs text-amber-500/50">~{ex.calories_burned} kcal</span>
              )}
            </div>
          ))}
          {caloriesBurned > 0 && (
            <div className="bg-white/[0.03] rounded-xl px-3 py-2 text-sm space-y-1 mt-2">
              <div className="flex justify-between">
                <span className="text-white/40">Consumidas</span>
                <span className="text-white/70">{Math.round(totals.kcal)} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Quemadas</span>
                <span className="text-emerald-400">-{Math.round(caloriesBurned)} kcal</span>
              </div>
              <div className="flex justify-between font-medium border-t border-white/5 pt-1">
                <span className="text-white/70">Balance neto</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-white/80">{netKcal} kcal</span>
                  {kcalGoal && (() => {
                    const target = kcalGoal.goalType === "max" ? kcalGoal.max! : kcalGoal.min!;
                    const diff = netKcal - target;
                    const pct = target > 0 ? (diff / target) * 100 : 0;
                    const color = pct > 10 ? "text-emerald-400" : pct < -10 ? "text-red-400" : "text-white/30";
                    return (
                      <>
                        <span className="text-white/30 font-normal">/ {target}</span>
                        <span className={`text-xs font-semibold ${color}`}>({diff > 0 ? "+" : ""}{Math.round(diff)})</span>
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
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">Detalle de comidas ({logs.length})</h2>
        {logs.map((log) => (
          <LogEntry key={log.id} log={log} />
        ))}
        {logs.length === 0 && (
          <p className="text-center py-4 text-sm" style={{ color: "var(--text-muted)" }}>
            No hay registros este día
          </p>
        )}
      </div>

      <ManualLogForm
        foods={(foodsData ?? []) as FoodWithUnits[]}
        recipes={(recipesRes.data ?? []) as RecipeWithIngredients[]}
        favoriteFoodIds={favs.foodIds}
        favoriteRecipeIds={favs.recipeIds}
        date={date}
      />
    </div>
  );
}
