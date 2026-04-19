"use client";

interface DayData {
  date: string;
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  data: DayData[];
  kcalTarget: number | null;
}

const DAY_NAMES = ["L", "M", "X", "J", "V", "S", "D"];

export default function WeeklySummary({ data, kcalTarget }: Props) {
  // Get Mon–Sun of current week
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  const todayStr = today.toISOString().split("T")[0];

  const weekData = weekDates.map((date, i) => {
    const found = data.find((d) => d.date === date);
    return {
      date,
      dayName: DAY_NAMES[i],
      kcal: found?.kcal ?? 0,
      protein: found?.protein ?? 0,
      carbs: found?.carbs ?? 0,
      fat: found?.fat ?? 0,
      isToday: date === todayStr,
      isFuture: date > todayStr,
    };
  });

  const totalKcal = weekData.reduce((s, d) => s + d.kcal, 0);
  const totalProtein = weekData.reduce((s, d) => s + d.protein, 0);
  const daysLogged = weekData.filter((d) => !d.isFuture && d.kcal > 0).length;

  const maxKcal = Math.max(...weekData.map((d) => d.kcal), kcalTarget ?? 1, 1);

  return (
    <div className="space-y-4">
      {/* Day bars */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekData.map((d) => {
          const pct = Math.min((d.kcal / maxKcal) * 100, 100);
          const hitGoal = kcalTarget && d.kcal >= kcalTarget * 0.9 && d.kcal <= kcalTarget * 1.1;
          const overGoal = kcalTarget && d.kcal > kcalTarget * 1.1;

          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              {/* Bar */}
              <div className="w-full h-20 relative flex items-end">
                <div className="w-full rounded-sm overflow-hidden" style={{ height: "100%", background: "rgba(255,255,255,0.04)" }}>
                  {!d.isFuture && d.kcal > 0 && (
                    <div
                      className="w-full absolute bottom-0 rounded-sm transition-all"
                      style={{
                        height: `${pct}%`,
                        background: overGoal
                          ? "rgba(255,107,107,0.6)"
                          : hitGoal
                          ? "rgba(0,212,170,0.5)"
                          : "rgba(0,212,170,0.25)",
                        border: d.isToday ? "1px solid var(--amber)" : "none",
                      }}
                    />
                  )}
                  {/* Target line */}
                  {kcalTarget && (
                    <div
                      className="absolute w-full"
                      style={{
                        bottom: `${Math.min((kcalTarget / maxKcal) * 100, 100)}%`,
                        borderTop: "1px dashed rgba(0,212,170,0.3)",
                      }}
                    />
                  )}
                </div>
              </div>
              {/* Day label */}
              <span
                className="text-[10px] font-medium"
                style={{ color: d.isToday ? "var(--amber)" : d.isFuture ? "var(--text-muted)" : "var(--text-secondary)" }}
              >
                {d.dayName}
              </span>
              {/* Kcal label */}
              {!d.isFuture && d.kcal > 0 && (
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                  {Math.round(d.kcal)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly totals row */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {daysLogged} de 7 días registrados
        </div>
        <div className="flex gap-4 text-xs text-right">
          <div>
            <span style={{ color: "var(--amber)" }} className="font-semibold">{Math.round(totalKcal)}</span>
            <span style={{ color: "var(--text-muted)" }}> kcal</span>
          </div>
          <div>
            <span className="font-semibold text-emerald-400">{Math.round(totalProtein)}g</span>
            <span style={{ color: "var(--text-muted)" }}> prot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
