"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function storeFromBrand(brand: string): string | null {
  if (brand === "Mercadona" || brand === "Hacendado") return "mercadona";
  if (brand === "Consum") return "consum";
  return null;
}

export async function getFoods(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("foods")
    .select("*, food_units(*)")
    .order("name");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFood(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("foods")
    .select("*, food_units(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function uploadImage(file: File, userId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(path, file);

  if (error) return null;

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

export async function createFood(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isGlobal = profile?.is_admin && formData.get("is_global") === "true";

  const imageFile = formData.get("image") as File;
  const imageUrl = await uploadImage(imageFile, user.id);

  const brand = (formData.get("brand") as string) || "Mercadona";

  const { data: newFood, error } = await supabase.from("foods").insert({
    name: formData.get("name") as string,
    brand,
    image_url: imageUrl,
    category: (formData.get("category") as string) || null,
    store: storeFromBrand(brand),
    kcal: Number(formData.get("kcal")),
    protein: Number(formData.get("protein") || 0),
    fat: Number(formData.get("fat") || 0),
    saturated_fat: Number(formData.get("saturated_fat") || 0),
    carbs: Number(formData.get("carbs") || 0),
    sugar: Number(formData.get("sugar") || 0),
    fiber: Number(formData.get("fiber") || 0),
    salt: Number(formData.get("salt") || 0),
    is_global: isGlobal,
    created_by: user.id,
  }).select().single();

  if (error) return { error: error.message };

  // Crear unidades si se definieron en el formulario
  const unitsJson = formData.get("units_json") as string;
  if (unitsJson && newFood) {
    try {
      const units: { name: string; grams: number }[] = JSON.parse(unitsJson);
      if (units.length > 0) {
        await supabase.from("food_units").insert(
          units.map((u) => ({ food_id: newFood.id, name: u.name, grams: u.grams }))
        );
      }
    } catch { /* ignorar JSON inválido */ }
  }

  revalidatePath("/alimentos");
  return { success: true };
}

export async function updateFood(id: string, formData: FormData) {
  const supabase = await createClient();

  const brand = (formData.get("brand") as string) || "Mercadona";

  const { error } = await supabase
    .from("foods")
    .update({
      name: formData.get("name") as string,
      brand,
      category: (formData.get("category") as string) || null,
      store: storeFromBrand(brand),
      kcal: Number(formData.get("kcal")),
      protein: Number(formData.get("protein") || 0),
      fat: Number(formData.get("fat") || 0),
      saturated_fat: Number(formData.get("saturated_fat") || 0),
      carbs: Number(formData.get("carbs") || 0),
      sugar: Number(formData.get("sugar") || 0),
      fiber: Number(formData.get("fiber") || 0),
      salt: Number(formData.get("salt") || 0),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${id}`);
  return { success: true };
}

export async function deleteFood(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const [{ data: food }, { data: profile }] = await Promise.all([
    supabase.from("foods").select("created_by, is_global").eq("id", id).single(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  if (!food) return { error: "Alimento no encontrado" };

  const isAdmin = profile?.is_admin ?? false;
  const isOwner = food.created_by === user.id;

  if (isOwner || (isAdmin && food.is_global)) {
    // Owner or admin deleting global food — hard delete
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) return { error: error.message };
  } else {
    // Non-owner, non-admin → hide global food for this user only
    const { error } = await supabase
      .from("user_hidden_foods")
      .upsert({ user_id: user.id, food_id: id });
    if (error) return { error: error.message };
  }

  revalidatePath("/alimentos");
  return { success: true };
}

export async function cloneAndEditFood(id: string, formData: FormData) {
  // For global foods: clone as personal copy, hide the original
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const imageFile = formData.get("image") as File;
  const imageUrl = imageFile?.size > 0 ? await uploadImage(imageFile, user.id) : null;

  const brand = (formData.get("brand") as string) || "Mercadona";

  const { error: insertError } = await supabase.from("foods").insert({
    name: formData.get("name") as string,
    brand,
    image_url: imageUrl,
    category: (formData.get("category") as string) || null,
    store: storeFromBrand(brand),
    kcal: Number(formData.get("kcal")),
    protein: Number(formData.get("protein") || 0),
    fat: Number(formData.get("fat") || 0),
    saturated_fat: Number(formData.get("saturated_fat") || 0),
    carbs: Number(formData.get("carbs") || 0),
    sugar: Number(formData.get("sugar") || 0),
    fiber: Number(formData.get("fiber") || 0),
    salt: Number(formData.get("salt") || 0),
    is_global: false,
    created_by: user.id,
  });

  if (insertError) return { error: insertError.message };

  // Hide original so user only sees their version
  await supabase.from("user_hidden_foods").upsert({ user_id: user.id, food_id: id });

  revalidatePath("/alimentos");
  return { success: true };
}

export async function addFoodUnit(foodId: string, name: string, grams: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("food_units").insert({
    food_id: foodId,
    name,
    grams,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath(`/alimentos/${foodId}`);
  return { success: true, unit: data };
}

export async function importFoodFromBarcode(food: {
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
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const brand = food.brand || "OpenFoodFacts";

  const { error } = await supabase.from("foods").insert({
    name: food.name || "Producto escaneado",
    brand,
    image_url: food.image_url,
    category: null,
    store: storeFromBrand(brand),
    kcal: food.kcal,
    protein: food.protein,
    fat: food.fat,
    saturated_fat: food.saturated_fat,
    carbs: food.carbs,
    sugar: food.sugar,
    fiber: food.fiber,
    salt: food.salt,
    is_global: false,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function bulkDeleteFoods(ids: string[]) {
  if (!ids.length) return { success: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const [{ data: foods }, { data: profile }] = await Promise.all([
    supabase.from("foods").select("id, created_by, is_global").in("id", ids),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  if (!foods) return { error: "Error al obtener alimentos" };
  const isAdmin = profile?.is_admin ?? false;

  const toDelete: string[] = [];
  const toHide: string[] = [];

  for (const food of foods) {
    if (food.created_by === user.id || (isAdmin && food.is_global)) {
      toDelete.push(food.id);
    } else {
      toHide.push(food.id);
    }
  }

  const errors: string[] = [];

  if (toDelete.length) {
    const { error } = await supabase.from("foods").delete().in("id", toDelete);
    if (error) errors.push(error.message);
  }

  if (toHide.length) {
    const { error } = await supabase
      .from("user_hidden_foods")
      .upsert(toHide.map((food_id) => ({ user_id: user.id, food_id })));
    if (error) errors.push(error.message);
  }

  if (errors.length) return { error: errors.join(", ") };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function bulkUpdateCategory(ids: string[], category: string) {
  if (!ids.length) return { success: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "No autorizado" };

  const { error } = await supabase
    .from("foods")
    .update({ category: category || null })
    .in("id", ids);

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function deleteFoodUnit(unitId: string, foodId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("food_units").delete().eq("id", unitId);
  if (error) return { error: error.message };
  revalidatePath(`/alimentos/${foodId}`);
  return { success: true };
}
