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

  // Calorie ring
  const kcalTarget = kcalGoal ? (kcalGoal.goalType === "max" ? kcalGoal.max! : kcalGoal.min!) : 0;
  const kcalPct = kcalTarget > 0 ? Math.min(netKcal / kcalTarget, 1) : 0;
  const R = 58;
  const SW = 9;
  const circ = 2 * Math.PI * R;
  const dash = circ * kcalPct;
  const ringOver = kcalGoal && netKcal > kcalTarget * 1.02;

  return (
    <div className="glass-card-static p-5 space-y-4 animate-in">
      <h2 className="heading-display text-lg">Progreso de hoy</h2>

      {/* Calorie ring — only when kcal goal exists */}
      {kcalGoal && (
        <div className="flex items-center gap-5 pb-1">
          <div className="relative shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00B893" />
                  <stop offset="100%" stopColor="#34E0BC" />
                </linearGradient>
                <filter id="ringGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle cx="70" cy="70" r={R} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
              {/* Progress */}
              <circle cx="70" cy="70" r={R} fill="none"
                stroke={ringOver ? "#FF6B6B" : "url(#ringGrad)"}
                strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={0}
                transform="rotate(-90 70 70)"
                filter="url(#ringGlow)"
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none" style={{ color: ringOver ? 'var(--coral)' : 'var(--amber)' }}>
                {netKcal}
              </span>
              <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                / {kcalTarget}
              </span>
              <span className="text-[10px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                {Math.round(kcalPct * 100)}%
              </span>
            </div>
          </div>
          {/* Side stats */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Consumidas</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(totals.kcal)} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>kcal</span></p>
            </div>
            {caloriesBurned > 0 && (
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quemadas</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--sage)' }}>-{Math.round(caloriesBurned)} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>kcal</span></p>
              </div>
            )}
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Restantes</p>
              <p className="text-lg font-semibold" style={{ color: ringOver ? 'var(--coral)' : 'var(--amber)' }}>
                {Math.max(0, kcalTarget - netKcal)} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>kcal</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {withGoal.filter(m => m !== 'kcal').map((macro) => (
          <MacroBar
            key={macro}
            macro={macro}
            current={totals[macro]}
            goal={effectiveGoals.get(macro)!}
          />
        ))}
        {/* kcal bar if no ring (no kcal goal but shown) */}
        {!kcalGoal && withGoal.map((macro) => (
          <MacroBar
            key={macro}
            macro={macro}
            current={totals[macro]}
            goal={effectiveGoals.get(macro)!}
          />
        ))}
      </div>

      {caloriesBurned > 0 && !kcalGoal && (
        <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--bg-card)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Consumidas</span>
            <span style={{ color: 'var(--text-secondary)' }}>{Math.round(totals.kcal)} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Quemadas</span>
            <span style={{ color: 'var(--sage)' }}>-{Math.round(caloriesBurned)} kcal</span>
          </div>
          <div className="divider" />
          <div className="flex justify-between text-sm font-semibold">
            <span style={{ color: 'var(--text-primary)' }}>Balance neto</span>
            <span style={{ color: 'var(--amber)' }}>{netKcal} kcal</span>
          </div>
        </div>
      )}

      {withGoal.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay objetivos configurados. Ve a Objetivos para configurarlos.
        </p>
      )}

      {withoutGoal.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {withoutGoal.map((macro) => (
            <span key={macro} className="text-xs">
              <span className="font-medium" style={{ color: MACRO_COLORS[macro] }}>
                {MACRO_LABELS[macro]}:
              </span>{" "}
              <span style={{ color: 'var(--text-muted)' }}>
                {Math.round(totals[macro] * 10) / 10}{MACRO_UNITS[macro]}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
