"use client";

import { Food } from "@/lib/types";
import { ALL_MACROS, MACRO_LABELS, MACRO_UNITS } from "@/lib/types";
import { useActionState, useRef, useState } from "react";

interface Props {
  food?: Food;
  isAdmin?: boolean;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean } | undefined>;
  submitLabel: string;
}

const BRAND_OPTIONS = ["Mercadona", "Consum", "Otros", "__custom__"] as const;

export default function FoodForm({ food, isAdmin, onSubmit, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await onSubmit(formData);
      if (result?.error) return { error: result.error };
      return null;
    },
    null
  );

  const initialBrand = food?.brand ?? "Mercadona";
  const isPreset = ["Mercadona", "Consum", "Otros"].includes(initialBrand);
  const [brandMode, setBrandMode] = useState<string>(isPreset ? initialBrand : "__custom__");
  const [customBrand, setCustomBrand] = useState(isPreset ? "" : initialBrand);

  const macroRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleMacroKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = macroRefs.current[index + 1];
      if (next) {
        next.focus();
      }
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
  }

  const effectiveBrand = brandMode === "__custom__" ? customBrand : brandMode;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          name="name"
          required
          defaultValue={food?.name}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Marca</label>
        <div className="flex gap-2">
          <select
            value={brandMode}
            onChange={(e) => setBrandMode(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Mercadona">Mercadona</option>
            <option value="Consum">Consum</option>
            <option value="Otros">Otros</option>
            <option value="__custom__">Introducir marca...</option>
          </select>
          {brandMode === "__custom__" && (
            <input
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              placeholder="Nombre de la marca"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        <input type="hidden" name="brand" value={effectiveBrand} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Imagen (opcional)</label>
        <input
          name="image"
          type="file"
          accept="image/*"
          className="w-full text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALL_MACROS.map((macro, idx) => (
          <div key={macro}>
            <label className="block text-sm font-medium mb-1">
              {MACRO_LABELS[macro]} ({MACRO_UNITS[macro]}/100g)
            </label>
            <input
              ref={(el) => { macroRefs.current[idx] = el; }}
              name={macro}
              type="number"
              step="0.1"
              min="0"
              required={macro === "kcal"}
              defaultValue={food ? food[macro] : macro === "kcal" ? "" : "0"}
              onFocus={handleFocus}
              onKeyDown={(e) => handleMacroKeyDown(e, idx)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {isAdmin && (
        <label className="flex items-center gap-2">
          <input
            name="is_global"
            type="checkbox"
            value="true"
            defaultChecked={food?.is_global}
          />
          <span className="text-sm">Alimento global (visible para todos)</span>
        </label>
      )}

      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
