"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { importFoodFromBarcode } from "@/actions/foods";

interface BarcodeFood {
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
  image_url: string | null;
}

type ScanState = "idle" | "scanning" | "fetching" | "detected" | "importing" | "done" | "error";

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [state, setState] = useState<ScanState>("idle");
  const [food, setFood] = useState<BarcodeFood | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [hasDetector, setHasDetector] = useState(false);

  useEffect(() => {
    setHasDetector(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function fetchProduct(code: string) {
    setState("fetching");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/barcode/${code}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Producto no encontrado");
        setState("error");
        return;
      }
      stopCamera();
      setFood(data);
      setState("detected");
    } catch {
      setErrorMsg("Error de conexión");
      setState("error");
    }
  }

  async function startCamera() {
    setState("scanning");
    setErrorMsg("");
    setFood(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      let scanning = true;
      async function scan() {
        if (!scanning || !videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            scanning = false;
            await fetchProduct(barcodes[0].rawValue);
            return;
          }
        } catch { /* ignore individual frame errors */ }
        animFrameRef.current = requestAnimationFrame(scan);
      }
      animFrameRef.current = requestAnimationFrame(scan);
    } catch {
      setErrorMsg("No se pudo acceder a la cámara");
      setState("error");
    }
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
    stopCamera();
    setState("idle");
    setFood(null);
    setErrorMsg("");
    setManualCode("");
  }

  return (
    <div className="space-y-3">
      {state === "idle" && (
        <div className="space-y-2">
          {hasDetector && (
            <button
              onClick={startCamera}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: "var(--amber-glow)",
                color: "var(--amber)",
                border: "1px solid var(--border-warm)",
              }}
            >
              📷 Escanear con cámara
            </button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder={hasDetector ? "O introduce el código manualmente..." : "Introduce el código de barras..."}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.trim())}
              onKeyDown={(e) => { if (e.key === "Enter" && manualCode) fetchProduct(manualCode); }}
              className="input-dark flex-1 text-sm"
            />
            <button
              onClick={() => fetchProduct(manualCode)}
              disabled={!manualCode}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
              style={{
                background: "var(--amber-glow)",
                color: "var(--amber)",
                border: "1px solid var(--border-warm)",
                opacity: !manualCode ? 0.5 : 1,
              }}
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {state === "scanning" && (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-48 h-28 border-2 rounded-lg"
                style={{ borderColor: "var(--amber)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }}
              />
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/60">
              Apunta al código de barras
            </p>
          </div>
          <button onClick={reset} className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Cancelar
          </button>
        </div>
      )}

      {state === "fetching" && (
        <p className="text-sm text-white/40 text-center py-4">Buscando producto...</p>
      )}

      {state === "detected" && food && (
        <div className="space-y-3">
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex gap-3 items-start">
              {food.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={food.image_url}
                  alt={food.name}
                  className="h-14 w-14 object-contain rounded flex-shrink-0"
                />
              )}
              <div>
                <p className="font-semibold text-white/90 text-sm">{food.name || "(sin nombre)"}</p>
                <p className="text-xs text-white/40">{food.brand}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs text-white/50 pt-1">
              <div><span className="font-semibold text-white/75">{food.kcal}</span> kcal</div>
              <div><span className="font-semibold text-white/75">{food.protein}g</span> prot</div>
              <div><span className="font-semibold text-white/75">{food.carbs}g</span> carbs</div>
              <div><span className="font-semibold text-white/75">{food.fat}g</span> grasas</div>
            </div>
          </div>
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
            Escanear otro
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
