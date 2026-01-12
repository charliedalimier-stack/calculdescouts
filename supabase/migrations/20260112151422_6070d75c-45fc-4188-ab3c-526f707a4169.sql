-- Create table for professional expenses
CREATE TABLE public.professional_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mois DATE NOT NULL,
  categorie_frais TEXT NOT NULL DEFAULT 'autres',
  libelle TEXT NOT NULL,
  montant_ht NUMERIC NOT NULL DEFAULT 0,
  tva_taux NUMERIC DEFAULT 20,
  montant_ttc NUMERIC GENERATED ALWAYS AS (montant_ht * (1 + COALESCE(tva_taux, 0) / 100)) STORED,
  mode TEXT NOT NULL DEFAULT 'simulation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to professional_expenses"
ON public.professional_expenses
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to professional_expenses"
ON public.professional_expenses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update to professional_expenses"
ON public.professional_expenses
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete to professional_expenses"
ON public.professional_expenses
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_professional_expenses_updated_at
BEFORE UPDATE ON public.professional_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();