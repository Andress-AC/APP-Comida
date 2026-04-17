import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/gemini";
import { fetchAllRows } from "@/lib/fetch-all-foods";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

function similarity(a: string, b: string): number {
  const ab = bigrams(a);
  const bb = new Set(bigrams(b));
  if (!ab.length || !bb.size) return 0;
  const overlap = ab.filter((bg) => bb.has(bg)).length;
  return (2 * overlap) / (ab.length + bb.size);
}

function findBestFood(name: string, foods: any[]): any | null {
  const q = norm(name);
  if (!q) return null;
  let best: any = null;
  let bestScore = 0;

  for (const f of foods) {
    const fn = norm(f.name);
    let score = 0;
    if (fn === q) score = 1.0;
    else if (fn.startsWith(q) || q.startsWith(fn)) score = 0.85;
    else if (fn.includes(q) || q.includes(fn)) score = 0.75;
    else score = similarity(q, fn);

    // Boost if brand matches too
    if (f.brand && norm(f.brand).split(" ").some((w: string) => q.includes(w) && w.length > 3)) score += 0.1;

    if (score > bestScore) { best = f; bestScore = score; }
  }

  return bestScore >= 0.35 ? best : null;
}

function findBestRecipe(name: string, recipes: any[]): any | null {
  const q = norm(name);
  if (!q) return null;
  let best: any = null;
  let bestScore = 0;
  for (const r of recipes) {
    const rn = norm(r.name);
    let score = 0;
    if (rn === q) score = 1.0;
    else if (rn.includes(q) || q.includes(rn)) score = 0.8;
    else score = similarity(q, rn);
    if (score > bestScore) { best = r; bestScore = score; }
  }
  return bestScore >= 0.4 ? best : null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { text } = await request.json();
  if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

  // Step 1: AI extracts items from text (NO catalog — keeps prompt tiny)
  const prompt = `Eres un extractor de alimentos. El usuario describe en español lo que ha comido.
Extrae cada alimento con su cantidad en gramos.

Reglas:
- Si dice "ml", trata 1ml = 1g (agua, leche, zumo, etc.)
- Si no hay cantidad, usa una porción típica (150g carne, 200g pasta cocida, 250ml leche, etc.)
- Si menciona una receta o plato complejo (ej: "paella", "tortilla"), ponlo como plato con quantity_grams: 0 y is_recipe: true
- Para platos, el multiplier indica raciones (ej: "2 tortillas" → multiplier: 2, quantity_grams: 0)
- Devuelve SOLO JSON, sin markdown ni explicación

Formato:
[{"name": "nombre del alimento", "quantity_grams": 200, "multiplier": 1, "is_recipe": false}]

Texto: "${text}"`;

  let extracted: Array<{ name: string; quantity_grams: number; multiplier: number; is_recipe: boolean }>;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo interpretar el texto" }, { status: 500 });
    extracted = JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    const msg = error.message ?? "";
    const friendly = msg.includes("429") || msg.includes("quota")
      ? "Has alcanzado el límite de la IA. Espera unos minutos e inténtalo de nuevo."
      : "Error al conectar con la IA. Inténtalo de nuevo.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  // Step 2: Fuzzy-match extracted names against local DB (no AI tokens wasted)
  const [foods, recipesResult] = await Promise.all([
    fetchAllRows(supabase, "foods", "id, name, brand, food_units(id, name, grams)"),
    supabase.from("recipes").select("id, name"),
  ]);
  const recipes = recipesResult.data ?? [];

  const items = extracted.map((item) => {
    // Try recipe first if flagged, then food
    if (item.is_recipe) {
      const recipe = findBestRecipe(item.name, recipes);
      if (recipe) {
        return { food_id: null, recipe_id: recipe.id, name: recipe.name, quantity_grams: 0, multiplier: item.multiplier || 1 };
      }
    }

    // Try food
    const food = findBestFood(item.name, foods);
    if (food) {
      // Resolve unit quantity if the extracted name hints at a unit
      let grams = item.quantity_grams;
      if (food.food_units?.length) {
        const normName = norm(item.name);
        const matchedUnit = food.food_units.find((u: any) => normName.includes(norm(u.name)));
        if (matchedUnit) grams = matchedUnit.grams * (item.multiplier || 1);
      }
      return { food_id: food.id, recipe_id: null, name: food.name, quantity_grams: grams, multiplier: 1 };
    }

    // Try recipe as fallback
    const recipe = findBestRecipe(item.name, recipes);
    if (recipe) {
      return { food_id: null, recipe_id: recipe.id, name: recipe.name, quantity_grams: 0, multiplier: item.multiplier || 1 };
    }

    // Not found
    return { food_id: null, recipe_id: null, name: item.name, quantity_grams: item.quantity_grams, multiplier: 1 };
  });

  return NextResponse.json({ items });
}
