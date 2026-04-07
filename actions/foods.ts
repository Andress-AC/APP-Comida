"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase.from("foods").insert({
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || "Mercadona",
    image_url: imageUrl,
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
  });

  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function updateFood(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("foods")
    .update({
      name: formData.get("name") as string,
      brand: (formData.get("brand") as string) || "Mercadona",
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
  const { error } = await supabase.from("foods").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/alimentos");
  return { success: true };
}

export async function addFoodUnit(foodId: string, name: string, grams: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("food_units").insert({
    food_id: foodId,
    name,
    grams,
  });
  if (error) return { error: error.message };
  revalidatePath(`/alimentos/${foodId}`);
  return { success: true };
}

export async function deleteFoodUnit(unitId: string, foodId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("food_units").delete().eq("id", unitId);
  if (error) return { error: error.message };
  revalidatePath(`/alimentos/${foodId}`);
  return { success: true };
}
