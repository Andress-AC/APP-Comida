"use client";

import { useRef, useState } from "react";
import { importFoodFromBarcode } from "@/actions/foods";

interface LabelFood {
  name: string;
  brand: string;
  kcal: number;
  protein: number;
  fat: number;
  saturated_fat: number;
  carbs: number;
  sugar: number;
  fiber: number;
  salt: number;
  image_url: null;
}

type ScanState = "idle" | "analyzing" | "detected" | "importing" | "done" | "error";

export default function LabelScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [food, setFood] = useState<LabelFood | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Selecciona una imagen");
      setState("error");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setState("analyzing");
    setErrorMsg("");
    setFood(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/ai/label", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "No se pudo analizar la etiqueta");
        setState("error");
        return;
      }

      setFood(data);
      setState("detected");
    } catch {
      setErrorMsg("Error de conexión");
      setState("error");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function handleImport() {
    if (!food) return;
    setState("importing");
    const result = await importFoodFromBarcode(food);
    if (result.error) {
      setErrorMsg(result.error);
      setState("error");
    } else {
      setState("done");
    }
  }

  function reset() {
    setState("idle");
    setFood(null);
    setPreview(null);
    setErrorMsg("");
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {state === "idle" && (
        <div className="space-y-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: "var(--amber-glow)",
              color: "var(--amber)",
              border: "1px solid var(--border-warm)",
            }}
          >
            📸 Hacer foto de la etiqueta
          </button>
          <button
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.removeAttribute("capture");
                inputRef.current.click();
                setTimeout(() => inputRef.current?.setAttribute("capture", "environment"), 500);
              }
            }}
            className="w-full py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-white/50 hover:text-white/70"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            O seleccionar imagen de la galería
          </button>
        </div>
      )}

      {state === "analyzing" && (
        <div className="space-y-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Etiqueta"
              className="w-full max-h-48 object-contain rounded-lg"
              style={{ background: "rgba(0,0,0,0.3)" }}
            />
          )}
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span className="animate-pulse">●</span>
            Analizando etiqueta con IA...
          </div>
        </div>
      )}

      {state === "detected" && food && (
        <div className="space-y-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Etiqueta"
              className="w-full max-h-32 object-contain rounded-lg"
              style={{ background: "rgba(0,0,0,0.3)" }}
            />
          )}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div>
              <p className="font-semibold text-white/90 text-sm">{food.name || "(sin nombre)"}</p>
              {food.brand && <p className="text-xs text-white/40">{food.brand}</p>}
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs text-white/50">
              <div><span className="font-semibold text-white/75">{food.kcal}</span> kcal</div>
              <div><span className="font-semibold text-white/75">{food.protein}g</span> prot</div>
              <div><span className="font-semibold text-white/75">{food.carbs}g</span> carbs</div>
              <div><span className="font-semibold text-white/75">{food.fat}g</span> grasas</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs text-white/30">
              <div>{food.saturated_fat}g sat</div>
              <div>{food.sugar}g azúcar</div>
              <div>{food.fiber}g fibra</div>
              <div>{food.salt}g sal</div>
            </div>
          </div>
          <p className="text-xs text-white/30">
            Revisa los valores antes de importar — la IA puede cometer errores.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "#4ade80",
                border: "1px solid rgba(74,222,128,0.25)",
              }}
            >
              Añadir a mis alimentos
            </button>
            <button
              onClick={reset}
              className="text-xs px-3 text-white/40 hover:text-white/60 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {state === "importing" && (
        <p className="text-sm text-white/40 text-center py-4">Guardando alimento...</p>
      )}

      {state === "done" && (
        <div className="text-center space-y-2 py-2">
          <p className="text-emerald-400 text-sm font-medium">✓ Alimento añadido correctamente</p>
          <button onClick={reset} className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Analizar otra etiqueta
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="text-center space-y-2 py-2">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <button onClick={reset} className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
