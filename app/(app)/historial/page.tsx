import { createClient } from "@/lib/supabase/server";
import { DailyLog } from "@/lib/types";
import { calcDayTotals } from "@/lib/macros";
import { getEffectiveGoals, evaluateGoals } from "@/lib/goals";
import DayHistoryCard from "@/components/DayHistoryCard";

export default async function HistorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [logsRes, goalsRes, overridesRes, notesRes, exerciseRes] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
      .eq("user_id", user!.id)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false }),
    supabase.from("user_goals").select("*").eq("user_id", user!.id),
    supabase
      .from("goal_overrides")
      .select("*")
      .eq("user_id", user!.id)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]),
    supabase
      .from("daily_notes")
      .select("date")
      .eq("user_id", user!.id)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .neq("content", ""),
    supabase
      .from("daily_exercise")
      .select("date, calories_burned")
      .eq("user_id", user!.id)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]),
  ]);

  const logs = (logsRes.data ?? []) as DailyLog[];
  const goals = goalsRes.data ?? [];
  const overrides = overridesRes.data ?? [];

  const noteDates = new Set((notesRes.data ?? []).map((n: any) => n.date));

  // Sum calories burned per date
  const burnedByDate = new Map<string, number>();
  for (const ex of (exerciseRes.data ?? []) as { date: string; calories_burned: number | null }[]) {
    if (ex.calories_burned) {
      burnedByDate.set(ex.date, (burnedByDate.get(ex.date) ?? 0) + ex.calories_burned);
    }
  }

  const byDate = new Map<string, DailyLog[]>();
  for (const log of logs) {
    const existing = byDate.get(log.date) ?? [];
    existing.push(log);
    byDate.set(log.date, existing);
  }

  const days = Array.from(byDate.entries()).map(([date, dayLogs]) => {
    const totals = calcDayTotals(dayLogs);
    const effectiveGoals = getEffectiveGoals(goals, overrides, new Date(date + "T00:00:00"));
    const goalStatuses = evaluateGoals(effectiveGoals, totals);
    return { date, totals, goalStatuses, hasNote: noteDates.has(date), caloriesBurned: burnedByDate.get(date) ?? 0 };
  });

  return (
    <div className="space-y-4">
      <h1 className="heading-display text-2xl">Historial</h1>
      {days.map((day) => (
        <DayHistoryCard
          key={day.date}
          date={day.date}
          totals={day.totals}
          goalStatuses={day.goalStatuses}
          hasNote={day.hasNote}
          caloriesBurned={day.caloriesBurned}
        />
      ))}
      {days.length === 0 && (
        <p className="text-white/30 text-center py-8">
          No hay registros aún
        </p>
      )}
    </div>
  );
}
