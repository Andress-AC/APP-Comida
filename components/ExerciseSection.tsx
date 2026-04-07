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
    <div className="bg-white rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600"
      >
        <span>Ejercicio</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Steps */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Pasos</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Ej: 8000"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveSteps}
                disabled={savingSteps || !steps}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSteps ? "..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* Activity list */}
          {activities.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Actividades</label>
              {activities.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <span>{ex.description}</span>
                    {ex.calories_burned && (
                      <span className="text-xs text-gray-400 ml-2">~{ex.calories_burned} kcal</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteExercise(ex.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add activity */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Añadir actividad</label>
            <div className="flex gap-2">
              <input
                placeholder="Ej: 1h gimnasio — pecho y bíceps"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="kcal"
                value={cals}
                onChange={(e) => setCals(e.target.value)}
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddExercise}
                disabled={savingExercise || !desc.trim()}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
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
