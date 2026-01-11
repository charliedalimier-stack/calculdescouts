-- =============================================
-- TABLE: projects (Projets / Entreprises)
-- =============================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_projet TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert to projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to projects" ON public.projects FOR DELETE USING (true);

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_categorie TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert to categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to categories" ON public.categories FOR DELETE USING (true);

-- =============================================
-- TABLE: ingredients
-- =============================================
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_ingredient TEXT NOT NULL,
  cout_unitaire DECIMAL(10,4) NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'kg',
  fournisseur TEXT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ingredients" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ingredients" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to ingredients" ON public.ingredients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to ingredients" ON public.ingredients FOR DELETE USING (true);

-- =============================================
-- TABLE: packaging (Emballages)
-- =============================================
CREATE TABLE public.packaging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  cout_unitaire DECIMAL(10,4) NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'unité',
  type_emballage TEXT DEFAULT 'primaire',
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packaging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to packaging" ON public.packaging FOR SELECT USING (true);
CREATE POLICY "Allow public insert to packaging" ON public.packaging FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to packaging" ON public.packaging FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to packaging" ON public.packaging FOR DELETE USING (true);

-- =============================================
-- TABLE: variable_costs (Coûts variables: RH, énergie, eau, autre)
-- =============================================
CREATE TABLE public.variable_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_cout TEXT NOT NULL DEFAULT 'autre',
  nom TEXT NOT NULL,
  cout_unitaire DECIMAL(10,4) NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'heure',
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to variable_costs" ON public.variable_costs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to variable_costs" ON public.variable_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to variable_costs" ON public.variable_costs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to variable_costs" ON public.variable_costs FOR DELETE USING (true);

-- =============================================
-- TABLE: products (Produits)
-- =============================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_produit TEXT NOT NULL,
  categorie_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  unite_vente TEXT NOT NULL DEFAULT 'pièce',
  prix_btc DECIMAL(10,2) NOT NULL DEFAULT 0,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert to products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to products" ON public.products FOR DELETE USING (true);

-- =============================================
-- TABLE: recipes (Recettes: liaison Produit <-> Ingrédients)
-- =============================================
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantite_utilisee DECIMAL(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, ingredient_id)
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Allow public insert to recipes" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to recipes" ON public.recipes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to recipes" ON public.recipes FOR DELETE USING (true);

-- =============================================
-- TABLE: product_packaging (Liaison Produit <-> Emballages)
-- =============================================
CREATE TABLE public.product_packaging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  packaging_id UUID NOT NULL REFERENCES public.packaging(id) ON DELETE CASCADE,
  quantite DECIMAL(10,4) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, packaging_id)
);

ALTER TABLE public.product_packaging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to product_packaging" ON public.product_packaging FOR SELECT USING (true);
CREATE POLICY "Allow public insert to product_packaging" ON public.product_packaging FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to product_packaging" ON public.product_packaging FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to product_packaging" ON public.product_packaging FOR DELETE USING (true);

-- =============================================
-- TABLE: product_variable_costs (Liaison Produit <-> Coûts variables)
-- =============================================
CREATE TABLE public.product_variable_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variable_cost_id UUID NOT NULL REFERENCES public.variable_costs(id) ON DELETE CASCADE,
  quantite DECIMAL(10,4) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, variable_cost_id)
);

ALTER TABLE public.product_variable_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to product_variable_costs" ON public.product_variable_costs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to product_variable_costs" ON public.product_variable_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to product_variable_costs" ON public.product_variable_costs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to product_variable_costs" ON public.product_variable_costs FOR DELETE USING (true);

-- =============================================
-- TABLE: sales_targets (Objectifs de vente mensuels)
-- =============================================
CREATE TABLE public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  mois DATE NOT NULL,
  quantite_objectif DECIMAL(10,2) NOT NULL DEFAULT 0,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, mois)
);

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sales_targets" ON public.sales_targets FOR SELECT USING (true);
CREATE POLICY "Allow public insert to sales_targets" ON public.sales_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to sales_targets" ON public.sales_targets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to sales_targets" ON public.sales_targets FOR DELETE USING (true);

-- =============================================
-- TABLE: sales_actuals (Ventes réelles mensuelles)
-- =============================================
CREATE TABLE public.sales_actuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  mois DATE NOT NULL,
  quantite_reelle DECIMAL(10,2) NOT NULL DEFAULT 0,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, mois)
);

ALTER TABLE public.sales_actuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sales_actuals" ON public.sales_actuals FOR SELECT USING (true);
CREATE POLICY "Allow public insert to sales_actuals" ON public.sales_actuals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to sales_actuals" ON public.sales_actuals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to sales_actuals" ON public.sales_actuals FOR DELETE USING (true);

-- =============================================
-- TABLE: cash_flow (Suivi cash-flow mensuel)
-- =============================================
CREATE TABLE public.cash_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mois DATE NOT NULL,
  encaissements DECIMAL(12,2) NOT NULL DEFAULT 0,
  decaissements DECIMAL(12,2) NOT NULL DEFAULT 0,
  delai_paiement_jours INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, mois)
);

ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cash_flow" ON public.cash_flow FOR SELECT USING (true);
CREATE POLICY "Allow public insert to cash_flow" ON public.cash_flow FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to cash_flow" ON public.cash_flow FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to cash_flow" ON public.cash_flow FOR DELETE USING (true);

-- =============================================
-- FUNCTION: update_updated_at_column
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packaging_updated_at BEFORE UPDATE ON public.packaging FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_variable_costs_updated_at BEFORE UPDATE ON public.variable_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cash_flow_updated_at BEFORE UPDATE ON public.cash_flow FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();