import { createClient } from "@/lib/supabase/server";
import { FoodWithUnits } from "@/lib/types";
import FoodForm from "@/components/FoodForm";
import SearchInput from "@/components/SearchInput";
import BarcodeScanner from "@/components/BarcodeScanner";
import LabelScanner from "@/components/LabelScanner";
import AlimentosClient from "@/components/AlimentosClient";
import { createFood } from "@/actions/foods";
import { getFavorites } from "@/actions/favorites";

export default async function AlimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const [profileResult, favsResult, hiddenResult] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user!.id).single(),
    getFavorites(),
    supabase.from("user_hidden_foods").select("food_id").eq("user_id", user!.id),
  ]);
  const profile = profileResult.data;
  const favIds = Array.from(favsResult.foodIds);
  const hiddenIds = new Set((hiddenResult.data ?? []).map((r: any) => r.food_id as string));

  let query = supabase
    .from("foods")
    .select("*, food_units(*)")
    .order("name");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: rawFoods } = await query;
  const foods = (rawFoods ?? []).filter((f: any) => !hiddenIds.has(f.id)) as FoodWithUnits[];

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">Alimentos</h1>

      <SearchInput basePath="/alimentos" />

      <details className="glass-card p-4">
        <summary className="font-medium text-white/70 cursor-pointer">📷 Escanear código de barras</summary>
        <div className="mt-4 border-t border-white/5 pt-4">
          <BarcodeScanner />
        </div>
      </details>

      <details className="glass-card p-4">
        <summary className="font-medium text-white/70 cursor-pointer">🤖 Leer etiqueta con IA</summary>
        <div className="mt-4 border-t border-white/5 pt-4">
          <LabelScanner />
        </div>
      </details>

      <details className="glass-card p-4">
        <summary className="font-medium text-white/70 cursor-pointer">+ Añadir alimento</summary>
        <div className="mt-4 border-t border-white/5 pt-4">
          <FoodForm
            isAdmin={profile?.is_admin}
            onSubmit={createFood}
            submitLabel="Crear alimento"
          />
        </div>
      </details>

      <AlimentosClient foods={foods} favIds={favIds} isAdmin={profile?.is_admin ?? false} />
    </div>
  );
}
