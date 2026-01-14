-- Create table for seasonality coefficients (monthly distribution)
CREATE TABLE public.seasonality_coefficients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'budget',
  year INTEGER NOT NULL,
  month_01 NUMERIC NOT NULL DEFAULT 8.33,
  month_02 NUMERIC NOT NULL DEFAULT 8.33,
  month_03 NUMERIC NOT NULL DEFAULT 8.33,
  month_04 NUMERIC NOT NULL DEFAULT 8.33,
  month_05 NUMERIC NOT NULL DEFAULT 8.33,
  month_06 NUMERIC NOT NULL DEFAULT 8.33,
  month_07 NUMERIC NOT NULL DEFAULT 8.33,
  month_08 NUMERIC NOT NULL DEFAULT 8.33,
  month_09 NUMERIC NOT NULL DEFAULT 8.33,
  month_10 NUMERIC NOT NULL DEFAULT 8.33,
  month_11 NUMERIC NOT NULL DEFAULT 8.33,
  month_12 NUMERIC NOT NULL DEFAULT 8.37,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, mode, year)
);

-- Create table for annual sales entry (the main entry point)
CREATE TABLE public.annual_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'budget',
  year INTEGER NOT NULL,
  categorie_prix TEXT NOT NULL DEFAULT 'BTC',
  quantite_annuelle INTEGER NOT NULL DEFAULT 0,
  prix_ht_override NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, product_id, mode, year, categorie_prix)
);

-- Enable RLS on both tables
ALTER TABLE public.seasonality_coefficients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies for seasonality_coefficients
CREATE POLICY "Users can view seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR SELECT
USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can insert seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR INSERT
WITH CHECK (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can update seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR UPDATE
USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can delete seasonality_coefficients for their projects"
ON public.seasonality_coefficients
FOR DELETE
USING (public.has_project_access(project_id, auth.uid()));

-- RLS policies for annual_sales
CREATE POLICY "Users can view annual_sales for their projects"
ON public.annual_sales
FOR SELECT
USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can insert annual_sales for their projects"
ON public.annual_sales
FOR INSERT
WITH CHECK (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can update annual_sales for their projects"
ON public.annual_sales
FOR UPDATE
USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can delete annual_sales for their projects"
ON public.annual_sales
FOR DELETE
USING (public.has_project_access(project_id, auth.uid()));

-- Update triggers
CREATE TRIGGER update_seasonality_coefficients_updated_at
BEFORE UPDATE ON public.seasonality_coefficients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annual_sales_updated_at
BEFORE UPDATE ON public.annual_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();