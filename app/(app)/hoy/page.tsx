import { createClient } from "@/lib/supabase/server";
import { DailyLog, DailyExercise, FoodWithUnits, RecipeWithIngredients } from "@/lib/types";
import { calcDayTotals } from "@/lib/macros";
import { getEffectiveGoals } from "@/lib/goals";
import { getEffectiveDate, getEffectiveDateStr } from "@/lib/dates";
import MacroDashboard from "@/components/MacroDashboard";
import LogEntry from "@/components/LogEntry";
import ManualLogForm from "@/components/ManualLogForm";
import AiInput from "@/components/AiInput";
import AiRecommendation from "@/components/AiRecommendation";
import DailyNoteEditor from "@/components/DailyNoteEditor";
import ExerciseSection from "@/components/ExerciseSection";

export default async function HoyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("day_start_hour")
    .eq("id", user!.id)
    .single();

  const dayStartHour = profile?.day_start_hour ?? 5;
  const today = getEffectiveDateStr(dayStartHour);

  const [logsResult, goalsResult, overridesResult, foodsResult, recipesResult, noteResult, exerciseResult] =
    await Promise.all([
      supabase
        .from("daily_logs")
        .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
        .eq("user_id", user!.id)
        .eq("date", today)
        .order("logged_at"),
      supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user!.id),
      supabase
        .from("goal_overrides")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today),
      supabase
        .from("foods")
        .select("*, food_units(*)")
        .order("name"),
      supabase
        .from("recipes")
        .select("*, recipe_ingredients(*, food:foods(*))")
        .order("name"),
      supabase
        .from("daily_notes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .single(),
      supabase
        .from("daily_exercise")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .order("created_at"),
    ]);

  const logs = (logsResult.data ?? []) as DailyLog[];
  const exercises = (exerciseResult.data ?? []) as DailyExercise[];
  const totals = calcDayTotals(logs);
  const effectiveGoals = getEffectiveGoals(
    goalsResult.data ?? [],
    overridesResult.data ?? [],
    getEffectiveDate(dayStartHour)
  );

  const stepsEntry = exercises.find((e) => e.steps != null);
  const caloriesBurned = exercises.reduce((sum, e) => sum + (e.calories_burned ?? 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hoy</h1>

      <MacroDashboard totals={totals} effectiveGoals={effectiveGoals} caloriesBurned={caloriesBurned} />

      <AiRecommendation logCount={logs.length} />

      <AiInput />

      <ManualLogForm
        foods={(foodsResult.data ?? []) as FoodWithUnits[]}
        recipes={(recipesResult.data ?? []) as RecipeWithIngredients[]}
      />

      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-gray-600">
          Registros de hoy ({logs.length})
        </h2>
        {logs.map((log) => (
          <LogEntry key={log.id} log={log} />
        ))}
        {logs.length === 0 && (
          <p className="text-gray-400 text-center py-4 text-sm">
            No has registrado nada todavía
          </p>
        )}
      </div>

      <ExerciseSection
        date={today}
        exercises={exercises}
        currentSteps={stepsEntry?.steps ?? null}
      />

      <DailyNoteEditor
        date={today}
        initialContent={noteResult.data?.content ?? ""}
      />
    </div>
  );
}
