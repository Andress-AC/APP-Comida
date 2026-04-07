import Link from "next/link";
import { MacroTotals, MACRO_LABELS, MACRO_UNITS } from "@/lib/types";
import { GoalStatus } from "@/lib/goals";

interface Props {
  date: string;
  totals: MacroTotals;
  goalStatuses: GoalStatus[];
  hasNote?: boolean;
  caloriesBurned?: number;
}

export default function DayHistoryCard({ date, totals, goalStatuses, hasNote, caloriesBurned = 0 }: Props) {
  const allMet = goalStatuses.length > 0 && goalStatuses.every((s) => s.met);
  const hasGoals = goalStatuses.length > 0;

  const kcalStatus = goalStatuses.find((s) => s.macro === "kcal");
  const netKcal = Math.round(totals.kcal - caloriesBurned);

  const d = new Date(date + "T00:00:00");
  const dayName = d.toLocaleDateString("es-ES", { weekday: "long" });
  const dateFormatted = d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/historial/${date}`}
      className="block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-medium capitalize">{dayName}</span>
          <span className="text-gray-500 text-sm ml-2">{dateFormatted}</span>
        </div>
        {hasGoals && (
          <span className="text-lg">{allMet ? "✅" : "❌"}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {goalStatuses.map((status) => (
          <div key={status.macro} className="flex items-center gap-1">
            <span>{MACRO_LABELS[status.macro]}:</span>
            <span className="font-medium">
              {status.actual}{MACRO_UNITS[status.macro]}
            </span>
            {status.met ? (
              <span className="text-xs">✅</span>
            ) : (
              <span className="text-xs">❌</span>
            )}
            <span
              className={`text-xs ${
                status.severity === "good"
                  ? "text-green-600"
                  : status.severity === "bad"
                  ? "text-red-600"
                  : "text-gray-400"
              }`}
            >
              ({status.difference > 0 ? "+" : ""}
              {status.difference})
            </span>
          </div>
        ))}
      </div>

      {caloriesBurned > 0 && kcalStatus && (() => {
        const target = kcalStatus.goalType === "max" ? kcalStatus.target.max! : kcalStatus.target.min!;
        const diff = netKcal - target;
        const pct = target > 0 ? (diff / target) * 100 : 0;
        const color = pct > 10 ? "text-green-600" : pct < -10 ? "text-red-600" : "text-gray-400";
        return (
          <p className="text-xs mt-1">
            <span className="text-gray-500">Balance neto: {netKcal} kcal </span>
            <span className={`font-medium ${color}`}>({diff > 0 ? "+" : ""}{Math.round(diff)})</span>
          </p>
        );
      })()}

      {!hasGoals && (
        <p className="text-sm text-gray-400">
          {totals.kcal} kcal — sin objetivos configurados
        </p>
      )}
      {hasNote && (
        <p className="text-xs text-gray-400 mt-1 italic">Tiene nota</p>
      )}
    </Link>
  );
}
