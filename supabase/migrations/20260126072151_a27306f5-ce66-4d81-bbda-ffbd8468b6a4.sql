-- Add fiscal parameters to project_settings
ALTER TABLE public.project_settings 
ADD COLUMN IF NOT EXISTS annee_fiscale_reference integer NOT NULL DEFAULT 2026,
ADD COLUMN IF NOT EXISTS taux_communal numeric NOT NULL DEFAULT 7.0,
ADD COLUMN IF NOT EXISTS nombre_enfants_charge integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quotite_exemptee_base numeric NOT NULL DEFAULT 10570,
ADD COLUMN IF NOT EXISTS majoration_par_enfant numeric NOT NULL DEFAULT 1850;

-- Create tax brackets table
CREATE TABLE IF NOT EXISTS public.tax_brackets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tranche_min numeric NOT NULL DEFAULT 0,
  tranche_max numeric, -- NULL means unlimited
  taux numeric NOT NULL DEFAULT 0,
  ordre integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, ordre)
);

-- Enable RLS
ALTER TABLE public.tax_brackets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view tax_brackets in their projects" 
ON public.tax_brackets 
FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert tax_brackets in their projects" 
ON public.tax_brackets 
FOR INSERT 
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update tax_brackets in their projects" 
ON public.tax_brackets 
FOR UPDATE 
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete tax_brackets in their projects" 
ON public.tax_brackets 
FOR DELETE 
USING (has_project_access(auth.uid(), project_id));

-- Create trigger for updated_at
CREATE TRIGGER update_tax_brackets_updated_at
BEFORE UPDATE ON public.tax_brackets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();