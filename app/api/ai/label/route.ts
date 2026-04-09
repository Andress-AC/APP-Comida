import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/gemini";

const PROMPT = `Analiza esta imagen de una etiqueta nutricional de un producto alimenticio.
Extrae la siguiente información y devuelve SOLO un objeto JSON válido, sin markdown, sin explicación:

{
  "name": "nombre del producto (si aparece)",
  "brand": "marca del producto (si aparece)",
  "kcal": número de calorías por 100g (o por 100ml),
  "protein": gramos de proteína por 100g,
  "fat": gramos de grasa total por 100g,
  "saturated_fat": gramos de grasa saturada por 100g,
  "carbs": gramos de carbohidratos por 100g,
  "sugar": gramos de azúcares por 100g,
  "fiber": gramos de fibra por 100g (0 si no aparece),
  "salt": gramos de sal por 100g (0 si no aparece)
}

IMPORTANTE:
- Todos los valores deben ser por 100g o 100ml (convierte si la etiqueta muestra otra porción)
- Si un valor no aparece, usa 0
- Devuelve SOLO el JSON, nada más`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
  }

  const maxBytes = 4 * 1024 * 1024; // 4MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "La imagen es demasiado grande (máx 4MB)" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  try {
    const result = await geminiModel.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      { text: PROMPT },
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo leer la etiqueta" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize: ensure all numeric fields are numbers
    const food = {
      name: String(parsed.name ?? ""),
      brand: String(parsed.brand ?? ""),
      kcal: Math.round(Number(parsed.kcal) || 0),
      protein: Math.round((Number(parsed.protein) || 0) * 10) / 10,
      fat: Math.round((Number(parsed.fat) || 0) * 10) / 10,
      saturated_fat: Math.round((Number(parsed.saturated_fat) || 0) * 10) / 10,
      carbs: Math.round((Number(parsed.carbs) || 0) * 10) / 10,
      sugar: Math.round((Number(parsed.sugar) || 0) * 10) / 10,
      fiber: Math.round((Number(parsed.fiber) || 0) * 10) / 10,
      salt: Math.round((Number(parsed.salt) || 0) * 10) / 10,
      image_url: null as null,
    };

    return NextResponse.json(food);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    const friendly = msg.includes("429") || msg.includes("quota")
      ? "Has alcanzado el límite de la IA. Espera unos minutos e inténtalo de nuevo."
      : "Error al procesar la imagen. Inténtalo de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
