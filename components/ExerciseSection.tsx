"use client";

import { useState } from "react";
import { DailyExercise } from "@/lib/types";
import { addExercise, updateSteps, deleteExercise } from "@/actions/exercise";

interface Props {
  date: string;
  exercises: DailyExercise[];
  currentSteps: number | null;
}

export default function ExerciseSection({ date, exercises, currentSteps }: Props) {
  const [steps, setSteps] = useState(currentSteps?.toString() ?? "");
  const [desc, setDesc] = useState("");
  const [cals, setCals] = useState("");
  const [savingSteps, setSavingSteps] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [open, setOpen] = useState(true);

  async function handleSaveSteps() {
    if (!steps) return;
    setSavingSteps(true);
    await updateSteps(date, Number(steps));
    setSavingSteps(false);
  }

  async function handleAddExercise() {
    if (!desc.trim()) return;
    setSavingExercise(true);
    await addExercise(date, desc.trim(), cals ? Number(cals) : null);
    setDesc("");
    setCals("");
    setSavingExercise(false);
  }

  // Activities (entries with description)
  const activities = exercises.filter((e) => e.description);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
      >
        <span>Ejercicio</span>
        <span className="text-white/30">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* Steps */}
          <div className="space-y-1 pt-3">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Pasos</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Ej: 8000"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="input-dark flex-1"
              />
              <button
                onClick={handleSaveSteps}
                disabled={savingSteps || !steps}
                className="btn-primary"
              >
                {savingSteps ? "..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* Activity list */}
          {activities.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Actividades</label>
              {activities.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 text-sm">
                  <div>
                    <span className="text-white/80">{ex.description}</span>
                    {ex.calories_burned && (
                      <span className="text-xs text-amber-500/50 ml-2">~{ex.calories_burned} kcal</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteExercise(ex.id)}
                    className="text-red-400/60 hover:text-red-400 text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add activity */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Añadir actividad</label>
            <div className="flex gap-2">
              <input
                placeholder="Ej: 1h gimnasio — pecho y bíceps"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="input-dark flex-1"
              />
              <input
                type="number"
                placeholder="kcal"
                value={cals}
                onChange={(e) => setCals(e.target.value)}
                className="input-dark w-20"
              />
              <button
                onClick={handleAddExercise}
                disabled={savingExercise || !desc.trim()}
                className="btn-sage"
              >
                {savingExercise ? "..." : "+"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
