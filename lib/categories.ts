export const FOOD_CATEGORIES = [
  "Carnes y aves",
  "Lácteos y huevos",
  "Pasta, arroz y legumbres",
  "Frutas",
  "Verduras y hortalizas",
  "Congelados",
  "Embutidos y charcutería",
  "Pan y bollería",
  "Postres y yogures",
  "Pescados y mariscos",
  "Aceites y vinagres",
  "Salsas y condimentos",
  "Conservas",
  "Snacks y aperitivos",
  "Bebidas",
  "Café, té e infusiones",
  "Cereales y galletas",
  "Platos preparados",
  "Dulces y chocolates",
  "Otros",
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(
  FOOD_CATEGORIES.map((cat, i) => [cat, i])
);
