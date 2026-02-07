
-- Table des investissements initiaux
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'equipement',
  montant_ht NUMERIC NOT NULL DEFAULT 0,
  tva_taux NUMERIC NOT NULL DEFAULT 21,
  date_achat DATE NOT NULL DEFAULT CURRENT_DATE,
  duree_amortissement INTEGER NOT NULL DEFAULT 5,
  mode TEXT NOT NULL DEFAULT 'budget',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des financements
CREATE TABLE public.financings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type_financement TEXT NOT NULL DEFAULT 'apport',
  montant NUMERIC NOT NULL DEFAULT 0,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  duree_mois INTEGER NOT NULL DEFAULT 60,
  taux_interet NUMERIC NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'budget',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS investments
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view investments in their projects" ON public.investments FOR SELECT USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can insert investments in their projects" ON public.investments FOR INSERT WITH CHECK (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can update investments in their projects" ON public.investments FOR UPDATE USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can delete investments in their projects" ON public.investments FOR DELETE USING (has_project_access(auth.uid(), project_id));

-- RLS financings
ALTER TABLE public.financings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view financings in their projects" ON public.financings FOR SELECT USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can insert financings in their projects" ON public.financings FOR INSERT WITH CHECK (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can update financings in their projects" ON public.financings FOR UPDATE USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can delete financings in their projects" ON public.financings FOR DELETE USING (has_project_access(auth.uid(), project_id));

-- Triggers updated_at
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financings_updated_at BEFORE UPDATE ON public.financings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
