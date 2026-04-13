"use client";

import { FoodUnit, FoodWithUnits } from "@/lib/types";
import { ALL_MACROS, MACRO_LABELS, MACRO_UNITS } from "@/lib/types";
import { FOOD_CATEGORIES, SUBCATEGORIES } from "@/lib/categories";
import { useActionState, useRef, useState, useTransition } from "react";
import { addFoodUnit, deleteFoodUnit } from "@/actions/foods";
import ImagePicker from "@/components/ImagePicker";

interface LocalUnit {
  id: string;
  name: string;
  grams: number;
  persisted: boolean; // true = already in DB
}

interface Props {
  food?: FoodWithUnits;
  isAdmin?: boolean;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean } | undefined>;
  submitLabel: string;
}

export default function FoodForm({ food, isAdmin, onSubmit, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await onSubmit(formData);
      if (result?.error) return { error: result.error };
      return null;
    },
    null
  );

  const [selectedCategory, setSelectedCategory] = useState(food?.category ?? "");
  const subcategoryOptions = SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES] ?? null;

  const initialBrand = food?.brand ?? "Mercadona";
  const isPreset = ["Mercadona", "Consum", "Otros"].includes(initialBrand);
  const [brandMode, setBrandMode] = useState<string>(isPreset ? initialBrand : "__custom__");
  const [customBrand, setCustomBrand] = useState(isPreset ? "" : initialBrand);

  const macroRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Units management
  const isEditMode = !!food?.id;
  const [units, setUnits] = useState<LocalUnit[]>(
    (food?.food_units ?? []).map((u) => ({ id: u.id, name: u.name, grams: u.grams, persisted: true }))
  );
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitGrams, setNewUnitGrams] = useState("");
  const [unitsPending, startUnitTransition] = useTransition();

  function handleMacroKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = macroRefs.current[index + 1];
      if (next) next.focus();
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
  }

  const effectiveBrand = brandMode === "__custom__" ? customBrand : brandMode;

  function handleAddUnit() {
    const name = newUnitName.trim();
    const grams = Number(newUnitGrams);
    if (!name || !grams) return;

    if (isEditMode && food?.id) {
      startUnitTransition(async () => {
        const result = await addFoodUnit(food.id, name, grams);
        if (!result.error) {
          const realId = (result as any).unit?.id ?? `tmp-${Date.now()}`;
          setUnits((prev) => [...prev, { id: realId, name, grams, persisted: true }]);
          setNewUnitName("");
          setNewUnitGrams("");
        }
      });
    } else {
      setUnits((prev) => [...prev, { id: `tmp-${Date.now()}`, name, grams, persisted: false }]);
      setNewUnitName("");
      setNewUnitGrams("");
    }
  }

  function handleRemoveUnit(unit: LocalUnit) {
    if (isEditMode && unit.persisted && food?.id) {
      startUnitTransition(async () => {
        await deleteFoodUnit(unit.id, food.id);
        setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      });
    } else {
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nombre</label>
        <input name="name" required defaultValue={food?.name} className="input-dark w-full" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Marca</label>
        <div className="flex gap-2">
          <select
            value={brandMode}
            onChange={(e) => setBrandMode(e.target.value)}
            className="input-dark"
            style={{ width: "auto" }}
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
              className="input-dark flex-1"
            />
          )}
        </div>
        <input type="hidden" name="brand" value={effectiveBrand} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoría</label>
        <select
          name="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-dark w-full"
        >
          <option value="">Sin categoría</option>
          {FOOD_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {subcategoryOptions && (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Subcategoría</label>
          <select name="subcategory" defaultValue={food?.subcategory ?? ""} className="input-dark w-full">
            <option value="">Sin subcategoría</option>
            {subcategoryOptions.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      )}

      <ImagePicker existingUrl={food?.image_url ?? null} />

      <div className="grid grid-cols-2 gap-3">
        {ALL_MACROS.map((macro, idx) => (
          <div key={macro}>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
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
              className="input-dark w-full"
            />
          </div>
        ))}
      </div>

      {/* Units section */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Unidades de medida
        </label>
        <div className="space-y-2">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                1 {unit.name} = {unit.grams}g
              </span>
              <button
                type="button"
                onClick={() => handleRemoveUnit(unit)}
                disabled={unitsPending}
                className="text-xs transition-colors"
                style={{ color: "var(--coral)" }}
              >
                Eliminar
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre (ej: ración)"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUnit())}
              className="input-dark flex-1"
            />
            <input
              type="number"
              placeholder="g"
              value={newUnitGrams}
              onChange={(e) => setNewUnitGrams(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUnit())}
              className="input-dark w-20"
            />
            <button
              type="button"
              onClick={handleAddUnit}
              disabled={unitsPending || !newUnitName.trim() || !newUnitGrams}
              className="btn-primary px-3"
            >
              +
            </button>
          </div>
        </div>

        {/* Serialize units for create mode */}
        {!isEditMode && (
          <input
            type="hidden"
            name="units_json"
            value={JSON.stringify(units.map((u) => ({ name: u.name, grams: u.grams })))}
          />
        )}
      </div>

      {isAdmin && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            name="is_global"
            type="checkbox"
            value="true"
            defaultChecked={food?.is_global}
            className="accent-amber-500"
          />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Alimento global (visible para todos)
          </span>
        </label>
      )}

      {state?.error && (
        <p className="text-sm" style={{ color: "var(--coral)" }}>{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
