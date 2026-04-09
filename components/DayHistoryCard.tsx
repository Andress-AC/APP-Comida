import Link from "next/link";
import { MacroTotals, MACRO_LABELS, MACRO_UNITS } from "@/lib/types";
import { GoalStatus } from "@/lib/goals";
import CopyDayButton from "./CopyDayButton";

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
      className="block glass-card p-4 hover:border-amber-500/40 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-medium text-white/90 capitalize">{dayName}</span>
          <span className="text-white/40 text-sm ml-2">{dateFormatted}</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyDayButton date={date} />
          {hasGoals && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allMet ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {allMet ? "Cumplido" : "Pendiente"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {goalStatuses.map((status) => (
          <div key={status.macro} className="flex items-center gap-1">
            <span className="text-white/50">{MACRO_LABELS[status.macro]}:</span>
            <span className="font-medium text-white/80">
              {status.actual}{MACRO_UNITS[status.macro]}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${status.met ? "bg-emerald-400" : "bg-red-400"}`} />
            <span
              className={`text-xs ${
                status.severity === "good"
                  ? "text-emerald-400"
                  : status.severity === "bad"
                  ? "text-red-400"
                  : "text-white/30"
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
        const color = pct > 10 ? "text-emerald-400" : pct < -10 ? "text-red-400" : "text-white/30";
        return (
          <p className="text-xs mt-2">
            <span className="text-white/40">Balance neto: {netKcal} kcal </span>
            <span className={`font-semibold ${color}`}>({diff > 0 ? "+" : ""}{Math.round(diff)})</span>
          </p>
        );
      })()}

      {!hasGoals && (
        <p className="text-sm text-white/30">
          {totals.kcal} kcal — sin objetivos configurados
        </p>
      )}
      {hasNote && (
        <p className="text-xs text-amber-500/50 mt-1 italic">Tiene nota</p>
      )}
    </Link>
  );
}
