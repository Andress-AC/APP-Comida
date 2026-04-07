import { MacroKey, MacroTotals, ALL_MACROS, MACRO_LABELS, MACRO_UNITS, MACRO_COLORS } from "@/lib/types";
import MacroBar from "./MacroBar";

interface Props {
  totals: MacroTotals;
  effectiveGoals: Map<MacroKey, { goalType: string; min: number | null; max: number | null }>;
  caloriesBurned?: number;
}

export default function MacroDashboard({ totals, effectiveGoals, caloriesBurned = 0 }: Props) {
  const withGoal = ALL_MACROS.filter((m) => effectiveGoals.has(m));
  const withoutGoal = ALL_MACROS.filter((m) => !effectiveGoals.has(m));

  const kcalGoal = effectiveGoals.get("kcal");
  const netKcal = Math.round(totals.kcal - caloriesBurned);

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h2 className="font-semibold">Progreso de hoy</h2>
      {withGoal.map((macro) => (
        <MacroBar
          key={macro}
          macro={macro}
          current={totals[macro]}
          goal={effectiveGoals.get(macro)!}
        />
      ))}
      {caloriesBurned > 0 && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm space-y-1">
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
      {withGoal.length === 0 && (
        <p className="text-sm text-gray-400">
          No hay objetivos configurados. Ve a Objetivos para configurarlos.
        </p>
      )}
      {withoutGoal.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t text-xs text-gray-500">
          {withoutGoal.map((macro) => (
            <span key={macro}>
              <span style={{ color: MACRO_COLORS[macro] }} className="font-medium">
                {MACRO_LABELS[macro]}:
              </span>{" "}
              {Math.round(totals[macro] * 10) / 10}
              {MACRO_UNITS[macro]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
