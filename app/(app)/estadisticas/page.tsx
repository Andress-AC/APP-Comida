import { createClient } from "@/lib/supabase/server";
import { DailyLog, MacroTotals, UserGoal } from "@/lib/types";
import { calcLogMacros, addMacros } from "@/lib/macros";
import CaloriesChart from "@/components/CaloriesChart";
import MacrosChart from "@/components/MacrosChart";
import WeightChart from "@/components/WeightChart";
import WeeklyAnalysis from "@/components/WeeklyAnalysis";
import StreaksBadges from "@/components/StreaksBadges";

const ZERO: MacroTotals = { kcal: 0, protein: 0, fat: 0, saturated_fat: 0, carbs: 0, sugar: 0, fiber: 0, salt: 0 };

function toLabel(date: string) {
  return date.slice(5).replace("-", "/");
}

function calcCurrentStreak(dateSet: Set<string>, today: string): number {
  if (!dateSet.has(today)) return 0;
  let streak = 1;
  const cur = new Date(today + "T12:00:00");
  while (true) {
    cur.setDate(cur.getDate() - 1);
    if (dateSet.has(cur.toISOString().split("T")[0])) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calcLongestStreak(sortedDates: string[]): number {
  if (!sortedDates.length) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + "T12:00:00");
    prev.setDate(prev.getDate() + 1);
    if (prev.toISOString().split("T")[0] === sortedDates[i]) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

const BADGE_DEFS = [
  { id: "first_day",   icon: "🌱", name: "Primer registro",  desc: "Empezaste a trackear",    condition: (t: number, l: number) => t >= 1 },
  { id: "streak_3",    icon: "🔥", name: "3 días seguidos",  desc: "Racha de 3 días",          condition: (t: number, l: number) => l >= 3 },
  { id: "streak_7",    icon: "⚡", name: "Semana completa",  desc: "7 días seguidos",           condition: (t: number, l: number) => l >= 7 },
  { id: "days_10",     icon: "📅", name: "10 días",          desc: "10 días en total",          condition: (t: number, l: number) => t >= 10 },
  { id: "streak_14",   icon: "💪", name: "Dos semanas",      desc: "14 días seguidos",          condition: (t: number, l: number) => l >= 14 },
  { id: "days_30",     icon: "📊", name: "30 días",          desc: "30 días en total",          condition: (t: number, l: number) => t >= 30 },
  { id: "streak_30",   icon: "🏆", name: "Mes de racha",     desc: "30 días seguidos",          condition: (t: number, l: number) => l >= 30 },
  { id: "days_100",    icon: "💎", name: "100 días",         desc: "100 días en total",         condition: (t: number, l: number) => t >= 100 },
];

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 29);
  const fromDateStr = fromDate.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const [logsResult, weightsResult, goalsResult, allDatesResult] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("*, food:foods(*), recipe:recipes(*, recipe_ingredients(*, food:foods(*)))")
      .eq("user_id", user!.id)
      .gte("date", fromDateStr)
      .order("date"),
    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", user!.id)
      .gte("date", fromDateStr)
      .order("date"),
    supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("daily_logs")
      .select("date")
      .eq("user_id", user!.id)
      .order("date")
      .limit(1000),
  ]);

  // Build day map for charts
  const dayMap = new Map<string, MacroTotals>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().split("T")[0], { ...ZERO });
  }
  for (const log of (logsResult.data ?? []) as DailyLog[]) {
    const existing = dayMap.get(log.date) ?? { ...ZERO };
    dayMap.set(log.date, addMacros(existing, calcLogMacros(log)));
  }
  const chartData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, t]) => ({ date, label: toLabel(date), kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat }));

  const weightData = (weightsResult.data ?? []).map((w: any) => ({
    date: w.date,
    label: toLabel(w.date),
    weight_kg: Number(w.weight_kg),
  }));

  const goals = (goalsResult.data ?? []) as UserGoal[];
  const kcalGoal = goals.find((g) => g.macro === "kcal");
  const kcalTarget = kcalGoal?.value_min ?? kcalGoal?.value_max ?? null;

  const daysWithData = chartData.filter((d) => d.kcal > 0);
  const avgKcal    = daysWithData.length ? Math.round(daysWithData.reduce((s, d) => s + d.kcal, 0)    / daysWithData.length) : 0;
  const avgProtein = daysWithData.length ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length) : 0;
  const avgCarbs   = daysWithData.length ? Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0)   / daysWithData.length) : 0;
  const avgFat     = daysWithData.length ? Math.round(daysWithData.reduce((s, d) => s + d.fat, 0)     / daysWithData.length) : 0;

  // Streak & badges calculation
  const uniqueDates = [...new Set((allDatesResult.data ?? []).map((r: any) => r.date as string))].sort();
  const dateSet = new Set(uniqueDates);
  const totalDays = uniqueDates.length;
  const currentStreak = calcCurrentStreak(dateSet, today);
  const longestStreak = calcLongestStreak(uniqueDates);

  const badges = BADGE_DEFS.map((b) => ({
    id: b.id,
    icon: b.icon,
    name: b.name,
    desc: b.desc,
    unlocked: b.condition(totalDays, longestStreak),
  }));

  return (
    <div className="space-y-4">
      <h1 className="heading-display text-2xl">Estadísticas</h1>

      {/* Streaks & Badges */}
      <div className="glass-card-static p-4 space-y-3">
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Rachas y logros
        </p>
        <StreaksBadges stats={{ currentStreak, longestStreak, totalDays }} badges={badges} />
      </div>

      {/* Averages summary */}
      {daysWithData.length > 0 && (
        <div className="glass-card-static p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
            Promedio últimos {daysWithData.length} días
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--amber)" }}>{avgKcal}</p>
              <p className="text-xs text-white/40">kcal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-400">{avgProtein}g</p>
              <p className="text-xs text-white/40">proteína</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--amber)" }}>{avgCarbs}g</p>
              <p className="text-xs text-white/40">carbos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{avgFat}g</p>
              <p className="text-xs text-white/40">grasas</p>
            </div>
          </div>
        </div>
      )}

      {/* Calories chart */}
      <div className="glass-card-static p-4 space-y-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Calorías diarias
          {kcalTarget && (
            <span className="text-xs font-normal text-white/30 ml-2">objetivo {kcalTarget} kcal</span>
          )}
        </p>
        <CaloriesChart data={chartData} kcalTarget={kcalTarget} />
      </div>

      {/* Macros chart */}
      <div className="glass-card-static p-4 space-y-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Macros (g)</p>
        <MacrosChart data={chartData} />
      </div>

      {/* Weight chart */}
      <div className="glass-card-static p-4 space-y-3">
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Peso corporal</p>
        <WeightChart data={weightData} />
      </div>

      {/* Weekly AI analysis */}
      <WeeklyAnalysis />
    </div>
  );
}
