-- 1. Add user_id column if it doesn't exist
ALTER TABLE public.annual_sales 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Populate user_id from project owner for existing rows
UPDATE public.annual_sales 
SET user_id = p.owner_user_id
FROM public.projects p
WHERE annual_sales.project_id = p.id
AND annual_sales.user_id IS NULL;

-- 3. Make user_id NOT NULL after populating (with default for safety)
ALTER TABLE public.annual_sales 
ALTER COLUMN user_id SET NOT NULL;

-- 4. Drop existing RLS policies (they have wrong argument order)
DROP POLICY IF EXISTS "Users can delete annual_sales for their projects" ON public.annual_sales;
DROP POLICY IF EXISTS "Users can insert annual_sales for their projects" ON public.annual_sales;
DROP POLICY IF EXISTS "Users can update annual_sales for their projects" ON public.annual_sales;
DROP POLICY IF EXISTS "Users can view annual_sales for their projects" ON public.annual_sales;

-- 5. Create correct RLS policies using user_id
CREATE POLICY "Users can view their annual_sales"
ON public.annual_sales
FOR SELECT
USING (user_id = auth.uid() OR has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert their annual_sales"
ON public.annual_sales
FOR INSERT
WITH CHECK (user_id = auth.uid() AND has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update their annual_sales"
ON public.annual_sales
FOR UPDATE
USING (user_id = auth.uid() OR has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete their annual_sales"
ON public.annual_sales
FOR DELETE
USING (user_id = auth.uid() OR has_project_access(auth.uid(), project_id));