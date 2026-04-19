import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchAllRows } from "@/lib/fetch-all-foods";
import AdminFoodsClient from "@/components/AdminFoodsClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/hoy");

  const allFoods = await fetchAllRows(
    supabase,
    "foods",
    "id, name, brand, kcal, protein, fat, saturated_fat, carbs, sugar, fiber, salt"
  );

  // Foods with kcal = 0 → clearly no macros filled in
  // (foods like olive oil have protein=0 but kcal>0, which is correct)
  const incomplete = allFoods.filter((f: any) => f.kcal === 0) as {
    id: string;
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
  }[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="heading-display text-2xl">Admin · Macros</h1>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm-strong)" }}
        >
          {incomplete.length} alimentos
        </span>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Alimentos con kcal = 0 (sin macros rellenos). Los que tienen kcal &gt; 0 pero otros macros a 0 son correctos (ej. aceite).
      </p>

      <AdminFoodsClient foods={incomplete} />
    </div>
  );
}
