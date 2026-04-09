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
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          {MACRO_LABELS[macro]}
        </span>
        <span style={{ color }}>
          <span className="font-semibold">{rounded}</span>
          <span style={{ color: 'var(--text-muted)' }}> / {target}{MACRO_UNITS[macro]}</span>
        </span>
      </div>
      <div className="macro-bar-track">
        <div
          className="macro-bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            background: isOver
              ? 'linear-gradient(90deg, #E0503C, #FF6B4A)'
              : `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${isOver ? 'rgba(224,80,60,0.3)' : color}33`,
          }}
        />
      </div>
    </div>
  );
}
