import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { text } = await request.json();
  if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

  const { data: foods } = await supabase
    .from("foods")
    .select("id, name, food_units(name, grams)");

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, name");

  const foodCatalog = (foods ?? [])
    .map((f: any) => {
      const units = (f.food_units ?? [])
        .map((u: any) => `${u.name}=${u.grams}g`)
        .join(", ");
      return `- ID:${f.id} "${f.name}"${units ? ` (unidades: ${units})` : ""}`;
    })
    .join("\n");

  const recipeCatalog = (recipes ?? [])
    .map((r: any) => `- ID:${r.id} "${r.name}"`)
    .join("\n");

  const prompt = `Eres un parser de alimentos. El usuario describe lo que ha comido en español.
Tu trabajo es identificar los alimentos y cantidades a partir del catálogo disponible.

CATÁLOGO DE ALIMENTOS:
${foodCatalog}

CATÁLOGO DE RECETAS:
${recipeCatalog}

INSTRUCCIONES:
- Identifica cada item que menciona el usuario
- Convierte unidades a gramos (usa las unidades del catálogo si existen)
- Si dice "1 bolsa" y el alimento tiene unidad "bolsa=167g", usa 167g
- Si no especifica cantidad, asume una porción razonable (150g para carne, 200g para arroz, etc.)
- Si un item coincide con una receta, usa recipe_id en lugar de food_id
- Para recetas, el multiplier indica cuántas porciones (ej: "2 fajitas" → multiplier: 2)
- Si no encuentras un alimento en el catálogo, ponlo con food_id: null y el nombre que ha dicho

Responde SOLO con un JSON array, sin markdown, sin explicación:
[
  { "food_id": "uuid-o-null", "recipe_id": null, "name": "nombre", "quantity_grams": 200, "multiplier": 1 }
]

TEXTO DEL USUARIO: "${text}"`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo interpretar la respuesta" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ items: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
