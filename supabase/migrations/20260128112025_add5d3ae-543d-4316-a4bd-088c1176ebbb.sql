-- Create table for monthly real sales entry
CREATE TABLE public.monthly_sales_reel (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month date NOT NULL,
  categorie_prix text NOT NULL DEFAULT 'BTC',
  quantite integer NOT NULL DEFAULT 0,
  prix_ht_override numeric NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique entry per product/month/channel/year
  CONSTRAINT monthly_sales_reel_unique UNIQUE (project_id, product_id, year, month, categorie_prix)
);

-- Enable RLS
ALTER TABLE public.monthly_sales_reel ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view monthly_sales_reel in their projects"
  ON public.monthly_sales_reel FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert monthly_sales_reel in their projects"
  ON public.monthly_sales_reel FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update monthly_sales_reel in their projects"
  ON public.monthly_sales_reel FOR UPDATE
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete monthly_sales_reel in their projects"
  ON public.monthly_sales_reel FOR DELETE
  USING (has_project_access(auth.uid(), project_id));

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_sales_reel_updated_at
  BEFORE UPDATE ON public.monthly_sales_reel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_monthly_sales_reel_project_year ON public.monthly_sales_reel(project_id, year);
CREATE INDEX idx_monthly_sales_reel_product ON public.monthly_sales_reel(product_id);