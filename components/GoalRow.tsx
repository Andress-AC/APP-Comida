"use client";

import { useState } from "react";
import { MacroKey, GoalType, MACRO_LABELS, MACRO_UNITS } from "@/lib/types";
import { upsertGoal, removeGoal } from "@/actions/goals";

interface Props {
  macro: MacroKey;
  dayOfWeek: number | null;
  existing?: {
    goal_type: GoalType;
    value_min: number | null;
    value_max: number | null;
  };
}

export default function GoalRow({ macro, dayOfWeek, existing }: Props) {
  const [goalType, setGoalType] = useState<GoalType>(existing?.goal_type ?? "min");
  const [valueMin, setValueMin] = useState(existing?.value_min?.toString() ?? "");
  const [valueMax, setValueMax] = useState(existing?.value_max?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const unit = MACRO_UNITS[macro];

  async function handleSave() {
    setSaving(true);
    await upsertGoal(
      macro,
      goalType,
      goalType !== "max" ? Number(valueMin) : null,
      goalType !== "min" ? Number(valueMax) : null,
      dayOfWeek
    );
    setSaving(false);
  }

  async function handleRemove() {
    setSaving(true);
    await removeGoal(macro, dayOfWeek);
    setValueMin("");
    setValueMax("");
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{MACRO_LABELS[macro]}</span>
        {existing && (
          <button
            onClick={handleRemove}
            className="text-red-500 text-xs hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <select
          value={goalType}
          onChange={(e) => setGoalType(e.target.value as GoalType)}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="min">Mínimo</option>
          <option value="max">Máximo</option>
          <option value="range">Rango</option>
        </select>

        {goalType !== "max" && (
          <input
            type="number"
            placeholder={`Mín (${unit})`}
            value={valueMin}
            onChange={(e) => setValueMin(e.target.value)}
            className="w-24 rounded border px-2 py-1 text-sm"
          />
        )}
        {goalType !== "min" && (
          <input
            type="number"
            placeholder={`Máx (${unit})`}
            value={valueMax}
            onChange={(e) => setValueMax(e.target.value)}
            className="w-24 rounded border px-2 py-1 text-sm"
          />
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "..." : existing ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
