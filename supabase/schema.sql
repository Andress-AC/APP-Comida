-- ============================================
-- CALORIE TRACKER — Full Database Schema
-- Run this in Supabase SQL Editor (supabase.com > project > SQL Editor)
-- ============================================

-- 1. PROFILES (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  is_admin boolean default false,
  day_start_hour smallint not null default 5,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. FOODS
create table foods (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  brand text not null default 'Mercadona',
  image_url text,
  is_global boolean default false,
  created_by uuid references profiles(id) on delete cascade not null,
  kcal numeric not null,
  protein numeric not null default 0,
  fat numeric not null default 0,
  saturated_fat numeric not null default 0,
  carbs numeric not null default 0,
  sugar numeric not null default 0,
  fiber numeric not null default 0,
  salt numeric not null default 0,
  created_at timestamptz default now()
);

alter table foods enable row level security;
create policy "Read global + own foods" on foods for select using (is_global = true or created_by = auth.uid());
create policy "Create own foods" on foods for insert with check (created_by = auth.uid());
create policy "Update own foods" on foods for update using (created_by = auth.uid());
create policy "Delete own foods" on foods for delete using (created_by = auth.uid());

-- 3. FOOD UNITS (smart units: "1 bolsa = 167g")
create table food_units (
  id uuid default gen_random_uuid() primary key,
  food_id uuid references foods(id) on delete cascade not null,
  name text not null,
  grams numeric not null,
  created_at timestamptz default now()
);

alter table food_units enable row level security;
create policy "Read units for visible foods" on food_units for select using (
  exists (select 1 from foods where foods.id = food_units.food_id and (foods.is_global or foods.created_by = auth.uid()))
);
create policy "Create units for own foods" on food_units for insert with check (
  exists (select 1 from foods where foods.id = food_units.food_id and foods.created_by = auth.uid())
);
create policy "Update units for own foods" on food_units for update using (
  exists (select 1 from foods where foods.id = food_units.food_id and foods.created_by = auth.uid())
);
create policy "Delete units for own foods" on food_units for delete using (
  exists (select 1 from foods where foods.id = food_units.food_id and foods.created_by = auth.uid())
);

-- 4. RECIPES
create table recipes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  categories text[] not null default '{comida,cena}',
  image_url text,
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table recipes enable row level security;
create policy "Read own recipes" on recipes for select using (created_by = auth.uid());
create policy "Create own recipes" on recipes for insert with check (created_by = auth.uid());
create policy "Update own recipes" on recipes for update using (created_by = auth.uid());
create policy "Delete own recipes" on recipes for delete using (created_by = auth.uid());

-- 5. RECIPE INGREDIENTS
create table recipe_ingredients (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade not null,
  food_id uuid references foods(id) on delete cascade not null,
  quantity_grams numeric not null,
  created_at timestamptz default now()
);

alter table recipe_ingredients enable row level security;
create policy "Read own recipe ingredients" on recipe_ingredients for select using (
  exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.created_by = auth.uid())
);
create policy "Create own recipe ingredients" on recipe_ingredients for insert with check (
  exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.created_by = auth.uid())
);
create policy "Update own recipe ingredients" on recipe_ingredients for update using (
  exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.created_by = auth.uid())
);
create policy "Delete own recipe ingredients" on recipe_ingredients for delete using (
  exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.created_by = auth.uid())
);

-- 6. DAILY LOGS
create table daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  food_id uuid references foods(id) on delete set null,
  recipe_id uuid references recipes(id) on delete set null,
  quantity_grams numeric,
  multiplier numeric not null default 1,
  meal_type text not null default 'comida',
  logged_at timestamptz default now(),
  constraint chk_food_or_recipe check (
    (food_id is not null and recipe_id is null) or
    (food_id is null and recipe_id is not null)
  )
);

alter table daily_logs enable row level security;
create policy "Read own logs" on daily_logs for select using (user_id = auth.uid());
create policy "Create own logs" on daily_logs for insert with check (user_id = auth.uid());
create policy "Update own logs" on daily_logs for update using (user_id = auth.uid());
create policy "Delete own logs" on daily_logs for delete using (user_id = auth.uid());

-- 7. PANTRY
create table pantry (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  food_id uuid references foods(id) on delete cascade not null,
  quantity_grams numeric not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, food_id)
);

alter table pantry enable row level security;
create policy "Read own pantry" on pantry for select using (user_id = auth.uid());
create policy "Create own pantry" on pantry for insert with check (user_id = auth.uid());
create policy "Update own pantry" on pantry for update using (user_id = auth.uid());
create policy "Delete own pantry" on pantry for delete using (user_id = auth.uid());

-- 8. USER GOALS (per day of week — null = default)
create table user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  macro text not null,
  goal_type text not null check (goal_type in ('min', 'max', 'range')),
  value_min numeric,
  value_max numeric,
  day_of_week smallint,
  created_at timestamptz default now(),
  constraint chk_goal_values check (
    (goal_type = 'min' and value_min is not null) or
    (goal_type = 'max' and value_max is not null) or
    (goal_type = 'range' and value_min is not null and value_max is not null)
  )
);

alter table user_goals enable row level security;
create policy "Read own goals" on user_goals for select using (user_id = auth.uid());
create policy "Create own goals" on user_goals for insert with check (user_id = auth.uid());
create policy "Update own goals" on user_goals for update using (user_id = auth.uid());
create policy "Delete own goals" on user_goals for delete using (user_id = auth.uid());

-- 9. GOAL OVERRIDES (for specific dates)
create table goal_overrides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  macro text not null,
  goal_type text not null check (goal_type in ('min', 'max', 'range')),
  value_min numeric,
  value_max numeric,
  created_at timestamptz default now(),
  unique(user_id, date, macro),
  constraint chk_override_values check (
    (goal_type = 'min' and value_min is not null) or
    (goal_type = 'max' and value_max is not null) or
    (goal_type = 'range' and value_min is not null and value_max is not null)
  )
);

alter table goal_overrides enable row level security;
create policy "Read own overrides" on goal_overrides for select using (user_id = auth.uid());
create policy "Create own overrides" on goal_overrides for insert with check (user_id = auth.uid());
create policy "Update own overrides" on goal_overrides for update using (user_id = auth.uid());
create policy "Delete own overrides" on goal_overrides for delete using (user_id = auth.uid());

-- 10. DAILY NOTES
create table daily_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table daily_notes enable row level security;
create policy "Read own notes" on daily_notes for select using (user_id = auth.uid());
create policy "Create own notes" on daily_notes for insert with check (user_id = auth.uid());
create policy "Update own notes" on daily_notes for update using (user_id = auth.uid());
create policy "Delete own notes" on daily_notes for delete using (user_id = auth.uid());

-- 11. DAILY EXERCISE
create table daily_exercise (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  steps integer,
  steps_source text not null default 'manual',
  description text,
  calories_burned numeric,
  created_at timestamptz default now()
);

alter table daily_exercise enable row level security;
create policy "Read own exercise" on daily_exercise for select using (user_id = auth.uid());
create policy "Create own exercise" on daily_exercise for insert with check (user_id = auth.uid());
create policy "Update own exercise" on daily_exercise for update using (user_id = auth.uid());
create policy "Delete own exercise" on daily_exercise for delete using (user_id = auth.uid());

-- 12. STORAGE BUCKET for food/recipe images
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Anyone can read images" on storage.objects for select using (bucket_id = 'images');
create policy "Authenticated users can upload images" on storage.objects for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');
create policy "Users can delete own images" on storage.objects for delete using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);
