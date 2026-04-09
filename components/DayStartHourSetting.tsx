"use client";

import { useState } from "react";
import { updateDayStartHour } from "@/actions/goals";

interface Props {
  currentHour: number;
}

export default function DayStartHourSetting({ currentHour }: Props) {
  const [hour, setHour] = useState(currentHour);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await updateDayStartHour(hour);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="glass-card p-4 space-y-2">
      <h3 className="font-medium text-sm text-white/80">Inicio del día</h3>
      <p className="text-xs text-white/40">
        Si comes después de medianoche, se cuenta como el día anterior hasta esta hora.
      </p>
      <div className="flex items-center gap-3">
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="input-dark !py-1 !px-2"
        >
          {Array.from({ length: 13 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? "Medianoche (00:00)" : `${i}:00`}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving || hour === currentHour}
          className="btn-primary !py-1"
        >
          {saving ? "..." : "Guardar"}
        </button>
        {saved && <span className="text-emerald-400 text-xs">Guardado</span>}
      </div>
    </div>
  );
}
