import { createClient } from "@/lib/supabase/server";
import { ALL_MACROS, MacroKey, UserGoal } from "@/lib/types";
import GoalRow from "@/components/GoalRow";
import DayStartHourSetting from "@/components/DayStartHourSetting";

// Display order: Monday first. Value = JS getDay() (0=Sun..6=Sat)
const DAYS_ORDERED = [
  { name: "Lunes", value: 1 },
  { name: "Martes", value: 2 },
  { name: "Miércoles", value: 3 },
  { name: "Jueves", value: 4 },
  { name: "Viernes", value: 5 },
  { name: "Sábado", value: 6 },
  { name: "Domingo", value: 0 },
];

export default async function ObjetivosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("day_start_hour")
    .eq("id", user!.id)
    .single();

  const { data: goals } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", user!.id);

  const { data: overrides } = await supabase
    .from("goal_overrides")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date");

  const goalsList = goals ?? [];

  function findGoal(macro: MacroKey, dayOfWeek: number | null) {
    return goalsList.find(
      (g: UserGoal) => g.macro === macro && g.day_of_week === dayOfWeek
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Objetivos</h1>

      <DayStartHourSetting currentHour={profile?.day_start_hour ?? 5} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Por defecto</h2>
        <p className="text-sm text-gray-500">
          Se aplican a los días sin configuración específica.
        </p>
        {ALL_MACROS.map((macro) => {
          const existing = findGoal(macro, null);
          return (
            <GoalRow
              key={macro}
              macro={macro}
              dayOfWeek={null}
              existing={
                existing
                  ? {
                      goal_type: existing.goal_type as any,
                      value_min: existing.value_min,
                      value_max: existing.value_max,
                    }
                  : undefined
              }
            />
          );
        })}
      </section>

      {DAYS_ORDERED.map(({ name: dayName, value: dayValue }) => {
        const dayGoals = goalsList.filter(
          (g: UserGoal) => g.day_of_week === dayValue
        );
        return (
          <details key={dayValue} className="space-y-3">
            <summary className="text-lg font-semibold cursor-pointer">
              {dayName}
              {dayGoals.length > 0 && (
                <span className="text-sm text-blue-600 ml-2">
                  ({dayGoals.length} objetivo(s))
                </span>
              )}
            </summary>
            <div className="space-y-2 mt-2">
              {ALL_MACROS.map((macro) => {
                const existing = findGoal(macro, dayValue);
                return (
                  <GoalRow
                    key={`${dayValue}-${macro}`}
                    macro={macro}
                    dayOfWeek={dayValue}
                    existing={
                      existing
                        ? {
                            goal_type: existing.goal_type as any,
                            value_min: existing.value_min,
                            value_max: existing.value_max,
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </details>
        );
      })}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Excepciones por fecha</h2>
        <p className="text-sm text-gray-500">
          Objetivos para días concretos (ej: un domingo especial).
        </p>
        {(overrides ?? []).length > 0 && (
          <div className="space-y-1 text-sm">
            {(overrides ?? []).map((o: any) => (
              <div key={o.id} className="bg-gray-50 px-3 py-1 rounded">
                {o.date} — {o.macro}: {o.goal_type} {o.value_min ?? ""}{o.value_max ? `-${o.value_max}` : ""}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400">
          Las excepciones se pueden crear desde el Historial haciendo click en un día.
        </p>
      </section>
    </div>
  );
}
