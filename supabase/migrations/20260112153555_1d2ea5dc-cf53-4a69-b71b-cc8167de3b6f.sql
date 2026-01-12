-- Fix remaining RLS policies for recipes and product_packaging (tables without project_id)
-- These need to check via product_id -> products -> project_id

-- Recipes - drop old policies
DROP POLICY IF EXISTS "Allow public read access to recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public insert to recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public update to recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public delete to recipes" ON public.recipes;

-- Create function to check recipe access via product
CREATE OR REPLACE FUNCTION public.has_recipe_access(_user_id UUID, _product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = _product_id
      AND public.has_project_access(_user_id, p.project_id)
  )
$$;

-- Recipes policies
CREATE POLICY "Users can view recipes in their projects"
  ON public.recipes FOR SELECT
  USING (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can insert recipes in their projects"
  ON public.recipes FOR INSERT
  WITH CHECK (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can update recipes in their projects"
  ON public.recipes FOR UPDATE
  USING (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can delete recipes in their projects"
  ON public.recipes FOR DELETE
  USING (public.has_recipe_access(auth.uid(), product_id));

-- Product packaging - drop old policies
DROP POLICY IF EXISTS "Allow public read access to product_packaging" ON public.product_packaging;
DROP POLICY IF EXISTS "Allow public insert to product_packaging" ON public.product_packaging;
DROP POLICY IF EXISTS "Allow public update to product_packaging" ON public.product_packaging;
DROP POLICY IF EXISTS "Allow public delete to product_packaging" ON public.product_packaging;

-- Product packaging policies
CREATE POLICY "Users can view product_packaging in their projects"
  ON public.product_packaging FOR SELECT
  USING (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can insert product_packaging in their projects"
  ON public.product_packaging FOR INSERT
  WITH CHECK (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can update product_packaging in their projects"
  ON public.product_packaging FOR UPDATE
  USING (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can delete product_packaging in their projects"
  ON public.product_packaging FOR DELETE
  USING (public.has_recipe_access(auth.uid(), product_id));

-- Product variable costs - drop old policies
DROP POLICY IF EXISTS "Allow public read access to product_variable_costs" ON public.product_variable_costs;
DROP POLICY IF EXISTS "Allow public insert to product_variable_costs" ON public.product_variable_costs;
DROP POLICY IF EXISTS "Allow public update to product_variable_costs" ON public.product_variable_costs;
DROP POLICY IF EXISTS "Allow public delete to product_variable_costs" ON public.product_variable_costs;

-- Product variable costs policies
CREATE POLICY "Users can view product_variable_costs in their projects"
  ON public.product_variable_costs FOR SELECT
  USING (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can insert product_variable_costs in their projects"
  ON public.product_variable_costs FOR INSERT
  WITH CHECK (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can update product_variable_costs in their projects"
  ON public.product_variable_costs FOR UPDATE
  USING (public.has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can delete product_variable_costs in their projects"
  ON public.product_variable_costs FOR DELETE
  USING (public.has_recipe_access(auth.uid(), product_id));