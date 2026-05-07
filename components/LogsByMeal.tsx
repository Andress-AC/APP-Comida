"use client";

import { DailyLog, MEAL_CATEGORIES, MealCategory, MEAL_CATEGORY_LABELS } from "@/lib/types";
import { calcLogMacros } from "@/lib/macros";
import LogEntry from "@/components/LogEntry";

interface Props {
  logs: DailyLog[];
}

// Meal type order (same as MEAL_CATEGORIES)
const MEAL_ORDER = MEAL_CATEGORIES.map((c) => c.value);

const MEAL_ICONS: Record<MealCategory, string> = {
  desayuno: "🌅",
  snack: "🥜",
  comida: "🍽️",
  merienda: "🍎",
  cena: "🌙",
  postre: "🍮",
};

export default function LogsByMeal({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="text-white/30 text-center py-4 text-sm">
        No has registrado nada todavía
      </p>
    );
  }

  // Group logs by meal_type
  const groups = new Map<MealCategory, DailyLog[]>();
  for (const log of logs) {
    const meal = (log.meal_type as MealCategory) ?? "comida";
    if (!groups.has(meal)) groups.set(meal, []);
    groups.get(meal)!.push(log);
  }

  // Sort groups by canonical order
  const orderedGroups = MEAL_ORDER
    .filter((m) => groups.has(m))
    .map((m) => ({ meal: m as MealCategory, logs: groups.get(m as MealCategory)! }));

  return (
    <div className="space-y-4">
      {orderedGroups.map(({ meal, logs: mealLogs }) => {
        const mealKcal = mealLogs.reduce((sum, log) => sum + calcLogMacros(log).kcal, 0);
        const mealProtein = mealLogs.reduce((sum, log) => sum + calcLogMacros(log).protein, 0);

        return (
          <section key={meal}>
            {/* Meal header */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{MEAL_ICONS[meal]}</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {MEAL_CATEGORY_LABELS[meal]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--amber)" }}>
                  {Math.round(mealKcal)} kcal
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  · {Math.round(mealProtein * 10) / 10}g prot
                </span>
              </div>
            </div>

            {/* Log entries */}
            <div className="space-y-2">
              {mealLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
