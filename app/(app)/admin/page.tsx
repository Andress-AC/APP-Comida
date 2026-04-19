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

  // Foods with any key macro = 0
  const incomplete = allFoods.filter(
    (f: any) => f.kcal === 0 || f.protein === 0 || f.fat === 0 || f.carbs === 0
  ) as {
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

  // Sort: most zeros first
  incomplete.sort((a, b) => {
    const zeros = (f: typeof a) =>
      [f.kcal, f.protein, f.fat, f.carbs].filter((v) => v === 0).length;
    return zeros(b) - zeros(a);
  });

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
        Alimentos con kcal, proteína, grasa o carbos = 0. Haz clic en Editar para completar.
      </p>

      <AdminFoodsClient foods={incomplete} />
    </div>
  );
}
