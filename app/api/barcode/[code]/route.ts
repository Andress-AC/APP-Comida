import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { code } = await params;

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Error al consultar OpenFoodFacts" }, { status: 502 });
  }

  const data = await res.json();

  if (data.status !== 1 || !data.product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const p = data.product;
  const n = p.nutriments ?? {};

  const kcalRaw = n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0);

  return NextResponse.json({
    name: p.product_name_es || p.product_name || "",
    brand: p.brands || "",
    kcal: Math.round(kcalRaw),
    protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
    saturated_fat: Math.round((n["saturated-fat_100g"] ?? 0) * 10) / 10,
    carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    sugar: Math.round((n.sugars_100g ?? 0) * 10) / 10,
    fiber: Math.round((n.fiber_100g ?? 0) * 10) / 10,
    salt: Math.round((n.salt_100g ?? 0) * 10) / 10,
    image_url: p.image_front_small_url || p.image_url || null,
  });
}
