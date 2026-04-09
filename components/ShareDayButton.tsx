"use client";

import { useState } from "react";
import { MacroTotals } from "@/lib/types";

interface Props {
  date: string;          // "2026-04-08"
  dateLabel: string;     // "martes, 8 de abril de 2026"
  totals: MacroTotals;
  goalsMet?: boolean | null;
  streak?: number;
}

type State = "idle" | "copied" | "shared";

export default function ShareDayButton({ date, dateLabel, totals, goalsMet, streak }: Props) {
  const [state, setState] = useState<State>("idle");

  function buildText() {
    const lines: string[] = [
      `🍽️ Mi día en NutriTrack — ${dateLabel}`,
      "",
      `⚡ ${Math.round(totals.kcal)} kcal`,
      `💪 Proteína: ${totals.protein}g`,
      `🌾 Carbos: ${totals.carbs}g`,
      `🥑 Grasas: ${totals.fat}g`,
    ];

    if (totals.fiber > 0) lines.push(`🌿 Fibra: ${totals.fiber}g`);

    if (goalsMet !== null && goalsMet !== undefined) {
      lines.push("");
      lines.push(goalsMet ? "✅ Objetivos del día cumplidos" : "📍 Objetivos en progreso");
    }

    if (streak && streak > 1) {
      lines.push(`🔥 Racha: ${streak} días seguidos`);
    }

    lines.push("");
    lines.push("Registrado con NutriTrack 💚");

    return lines.join("\n");
  }

  async function handleShare() {
    const text = buildText();

    if (navigator.share) {
      try {
        await navigator.share({ text, title: `Mi día — ${dateLabel}` });
        setState("shared");
        setTimeout(() => setState("idle"), 2000);
      } catch {
        // User cancelled — do nothing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      } catch {
        // clipboard not available — silent fail
      }
    }
  }

  const label =
    state === "copied" ? "✓ Copiado" :
    state === "shared" ? "✓ Compartido" :
    "Compartir día";

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
      style={{
        background: state !== "idle" ? "rgba(34,197,94,0.12)" : "var(--amber-glow)",
        color: state !== "idle" ? "#4ade80" : "var(--amber)",
        border: `1px solid ${state !== "idle" ? "rgba(74,222,128,0.25)" : "var(--border-warm)"}`,
      }}
    >
      {state === "idle" && (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
      {label}
    </button>
  );
}
