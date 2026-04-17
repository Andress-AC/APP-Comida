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
import TemplateSection from "@/components/TemplateSection";
import ShareDayButton from "@/components/ShareDayButton";
import { getFavorites } from "@/actions/favorites";
import { getTemplates } from "@/actions/templates";
import { fetchAllRows } from "@/lib/fetch-all-foods";

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const [logsResult, goalsResult, overridesResult, foodsData, recipesResult, noteResult, exerciseResult, favs, templates, recentLogsResult] =
    await Promise.all([
      supabase
        .from("daily_logs")
        .select("*, food:foods(*, food_units(*)), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
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
      fetchAllRows(supabase, "foods", "*, food_units(*)"),
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
      getFavorites(),
      getTemplates(),
      supabase
        .from("daily_logs")
        .select("food_id")
        .eq("user_id", user!.id)
        .not("food_id", "is", null)
        .gte("date", thirtyDaysAgoStr)
        .order("logged_at", { ascending: false })
        .limit(300),
    ]);

  const logs = (logsResult.data ?? []) as DailyLog[];
  const exercises = (exerciseResult.data ?? []) as DailyExercise[];

  // Compute top-8 most frequent foods in last 30 days
  const freqMap = new Map<string, number>();
  for (const row of recentLogsResult.data ?? []) {
    if (row.food_id) freqMap.set(row.food_id, (freqMap.get(row.food_id) ?? 0) + 1);
  }
  const allFoods = (foodsData ?? []) as FoodWithUnits[];
  const recentFoods = [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => allFoods.find((f) => f.id === id))
    .filter(Boolean) as FoodWithUnits[];
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
      <div className="flex items-center justify-between">
        <h1 className="heading-display text-2xl">Hoy</h1>
        {logs.length > 0 && (
          <ShareDayButton
            date={today}
            dateLabel={new Date(today + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            totals={totals}
          />
        )}
      </div>

      <MacroDashboard totals={totals} effectiveGoals={effectiveGoals} caloriesBurned={caloriesBurned} />

      <AiRecommendation logCount={logs.length} />

      <AiInput />

      <TemplateSection templates={templates} hasLogsToday={logs.length > 0} />

      <ManualLogForm
        foods={allFoods}
        recipes={(recipesResult.data ?? []) as RecipeWithIngredients[]}
        favoriteFoodIds={favs.foodIds}
        favoriteRecipeIds={favs.recipeIds}
        recentFoods={recentFoods}
      />

      <div className="space-y-2">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Registros de hoy ({logs.length})
        </h2>
        {logs.map((log) => (
          <LogEntry key={log.id} log={log} />
        ))}
        {logs.length === 0 && (
          <p className="text-white/30 text-center py-4 text-sm">
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
