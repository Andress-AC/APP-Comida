import { MacroKey, MACRO_LABELS, MACRO_UNITS, MACRO_COLORS } from "@/lib/types";

interface Props {
  macro: MacroKey;
  current: number;
  goal: { goalType: string; min: number | null; max: number | null };
}

export default function MacroBar({ macro, current, goal }: Props) {
  const color = MACRO_COLORS[macro];
  const rounded = Math.round(current * 10) / 10;
  const target = goal.goalType === "max" ? goal.max! : goal.min!;
  const percentage = target > 0 ? Math.min((current / target) * 100, 120) : 0;

  const isOver =
    (goal.goalType === "max" && current > goal.max!) ||
    (goal.goalType === "range" && goal.max && current > goal.max);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{MACRO_LABELS[macro]}</span>
        <span className="text-gray-600">
          {rounded} / {target}
          {MACRO_UNITS[macro]}
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: isOver ? "#EF4444" : color,
          }}
        />
      </div>
    </div>
  );
}
