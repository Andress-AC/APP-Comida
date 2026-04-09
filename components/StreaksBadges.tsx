interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

interface Props {
  stats: Stats;
  badges: Badge[];
}

export default function StreaksBadges({ stats, badges }: Props) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-4">
      {/* Streak counters */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-warm)" }}
        >
          <p className="text-3xl font-bold" style={{ color: "var(--amber)" }}>
            {stats.currentStreak}
          </p>
          <p className="text-xs text-white/40 mt-0.5">🔥 racha actual</p>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-3xl font-bold text-white/70">{stats.longestStreak}</p>
          <p className="text-xs text-white/40 mt-0.5">⚡ mejor racha</p>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-3xl font-bold text-white/70">{stats.totalDays}</p>
          <p className="text-xs text-white/40 mt-0.5">📅 días totales</p>
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
          Logros — {unlockedCount}/{badges.length}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="rounded-xl p-3 flex items-start gap-3"
              style={{
                background: badge.unlocked ? "var(--bg-card)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${badge.unlocked ? "var(--border-warm)" : "var(--border-subtle)"}`,
                opacity: badge.unlocked ? 1 : 0.45,
              }}
            >
              <span className="text-2xl leading-none shrink-0" style={{ filter: badge.unlocked ? "none" : "grayscale(1)" }}>
                {badge.unlocked ? badge.icon : "🔒"}
              </span>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: badge.unlocked ? "var(--amber)" : "rgba(255,255,255,0.4)" }}
                >
                  {badge.name}
                </p>
                <p className="text-xs text-white/30 leading-snug mt-0.5">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
