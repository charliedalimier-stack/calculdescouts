-- Fix RLS policies for seasonality_coefficients table
-- The has_project_access function arguments were inverted

-- 1. Drop existing RLS policies (they have wrong argument order)
DROP POLICY IF EXISTS "Users can view seasonality_coefficients for their projects" ON public.seasonality_coefficients;
DROP POLICY IF EXISTS "Users can insert seasonality_coefficients for their projects" ON public.seasonality_coefficients;
DROP POLICY IF EXISTS "Users can update seasonality_coefficients for their projects" ON public.seasonality_coefficients;
DROP POLICY IF EXISTS "Users can delete seasonality_coefficients for their projects" ON public.seasonality_coefficients;

-- 2. Recreate policies with correct argument order: has_project_access(auth.uid(), project_id)
CREATE POLICY "Users can view seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR SELECT
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR INSERT
WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR UPDATE
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR DELETE
USING (public.has_project_access(auth.uid(), project_id));