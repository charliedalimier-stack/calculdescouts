-- =====================================================
-- PHASE 1: REFONTE MODÈLE DE DONNÉES - MODE SIMULATION/RÉEL
-- =====================================================

-- 1. Table des paramètres projet (règles métiers paramétrables, TVA)
CREATE TABLE public.project_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Règles de rentabilité
  coefficient_min NUMERIC NOT NULL DEFAULT 2.0,
  coefficient_cible NUMERIC NOT NULL DEFAULT 2.5,
  marge_min NUMERIC NOT NULL DEFAULT 30,
  marge_cible NUMERIC NOT NULL DEFAULT 40,
  
  -- Marges commerciales
  marge_btb NUMERIC NOT NULL DEFAULT 30, -- % de remise BTB vs BTC
  marge_distributeur NUMERIC NOT NULL DEFAULT 15, -- % de remise distributeur vs BTB
  
  -- TVA
  tva_vente NUMERIC NOT NULL DEFAULT 5.5, -- Taux TVA sur ventes (alimentaire)
  tva_achat NUMERIC NOT NULL DEFAULT 20, -- Taux TVA sur achats par défaut
  
  -- Alertes
  seuil_stock_alerte NUMERIC NOT NULL DEFAULT 10,
  delai_paiement_client NUMERIC NOT NULL DEFAULT 30,
  delai_paiement_fournisseur NUMERIC NOT NULL DEFAULT 30,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_project_settings UNIQUE(project_id)
);

-- 2. Ajouter colonne mode aux tables existantes (simulation vs réel)
-- Type de données possibles: 'simulation' ou 'reel'

-- Products
ALTER TABLE public.products 
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
ADD COLUMN tva_taux NUMERIC DEFAULT NULL; -- Taux TVA spécifique au produit si différent

-- Ingredients avec TVA
ALTER TABLE public.ingredients
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
ADD COLUMN tva_taux NUMERIC DEFAULT 20,
ADD COLUMN is_sous_recette BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN source_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Packaging avec TVA
ALTER TABLE public.packaging
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
ADD COLUMN tva_taux NUMERIC DEFAULT 20;

-- Variable costs avec TVA
ALTER TABLE public.variable_costs
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
ADD COLUMN tva_taux NUMERIC DEFAULT 20;

-- Sales targets (objectifs = simulation)
ALTER TABLE public.sales_targets
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel'));

-- Sales actuals (toujours réel, mais on ajoute pour cohérence)
ALTER TABLE public.sales_actuals
ADD COLUMN mode TEXT NOT NULL DEFAULT 'reel' CHECK (mode IN ('simulation', 'reel'));

-- Cash flow
ALTER TABLE public.cash_flow
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
ADD COLUMN tva_collectee NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN tva_deductible NUMERIC NOT NULL DEFAULT 0;

-- Recipes
ALTER TABLE public.recipes
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel'));

-- Product packaging
ALTER TABLE public.product_packaging
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel'));

-- Product variable costs
ALTER TABLE public.product_variable_costs
ADD COLUMN mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel'));

-- 3. Table des stocks (gestion basique)
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Type de stock
  type_stock TEXT NOT NULL CHECK (type_stock IN ('ingredient', 'packaging', 'produit_fini', 'sous_recette')),
  
  -- Référence vers l'élément stocké
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  packaging_id UUID REFERENCES public.packaging(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Quantités et valorisation
  quantite NUMERIC NOT NULL DEFAULT 0,
  cout_unitaire NUMERIC NOT NULL DEFAULT 0,
  valeur_totale NUMERIC GENERATED ALWAYS AS (quantite * cout_unitaire) STORED,
  
  -- Alertes
  seuil_alerte NUMERIC DEFAULT 0,
  
  mode TEXT NOT NULL DEFAULT 'reel' CHECK (mode IN ('simulation', 'reel')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Une seule référence doit être renseignée
  CONSTRAINT check_single_reference CHECK (
    (ingredient_id IS NOT NULL AND packaging_id IS NULL AND product_id IS NULL) OR
    (ingredient_id IS NULL AND packaging_id IS NOT NULL AND product_id IS NULL) OR
    (ingredient_id IS NULL AND packaging_id IS NULL AND product_id IS NOT NULL)
  )
);

-- 4. Table des mouvements de stock
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement')),
  quantite NUMERIC NOT NULL,
  cout_unitaire NUMERIC,
  motif TEXT, -- 'achat', 'vente', 'production', 'perte', 'ajustement'
  reference_id UUID, -- ID de la vente ou production liée
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Table des commentaires accompagnateur
CREATE TABLE public.product_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Statut et commentaire
  statut TEXT NOT NULL DEFAULT 'ok' CHECK (statut IN ('ok', 'a_optimiser', 'non_viable')),
  commentaire TEXT,
  recommandation TEXT,
  
  -- Canal de vente concerné
  canal TEXT CHECK (canal IN ('btc', 'btb', 'distributeur', 'tous')),
  
  mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Table pour les analyses de sensibilité (sauvegarde des scénarios)
CREATE TABLE public.sensitivity_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  
  nom_scenario TEXT NOT NULL,
  
  -- Variations en pourcentage
  variation_cout_matieres NUMERIC NOT NULL DEFAULT 0,
  variation_prix_vente NUMERIC NOT NULL DEFAULT 0,
  variation_volume NUMERIC NOT NULL DEFAULT 0,
  
  -- Résultats calculés
  impact_cout_revient NUMERIC,
  impact_marge NUMERIC,
  impact_rentabilite NUMERIC,
  impact_cash_flow NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Table pour le seuil de rentabilité
CREATE TABLE public.breakeven_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Par produit
  volume_minimum NUMERIC,
  ca_minimum NUMERIC,
  marge_securite NUMERIC,
  
  -- Par canal
  canal TEXT CHECK (canal IN ('btc', 'btb', 'distributeur', 'global')),
  
  -- Mode
  mode TEXT NOT NULL DEFAULT 'simulation' CHECK (mode IN ('simulation', 'reel')),
  inclure_tva BOOLEAN NOT NULL DEFAULT false,
  
  mois DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Table pour les scénarios de stress test trésorerie
CREATE TABLE public.cashflow_stress_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  nom_scenario TEXT NOT NULL,
  
  -- Paramètres du scénario
  retard_paiement_jours NUMERIC DEFAULT 0,
  hausse_cout_matieres_pct NUMERIC DEFAULT 0,
  baisse_ventes_pct NUMERIC DEFAULT 0,
  augmentation_stock_pct NUMERIC DEFAULT 0,
  
  -- Résultats
  cash_flow_projete NUMERIC[],
  besoin_tresorerie_max NUMERIC,
  mois_tension_critique INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitivity_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakeven_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_stress_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_settings
CREATE POLICY "Allow public read access to project_settings" ON public.project_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to project_settings" ON public.project_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to project_settings" ON public.project_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to project_settings" ON public.project_settings FOR DELETE USING (true);

-- RLS Policies for stocks
CREATE POLICY "Allow public read access to stocks" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "Allow public insert to stocks" ON public.stocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to stocks" ON public.stocks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to stocks" ON public.stocks FOR DELETE USING (true);

-- RLS Policies for stock_movements
CREATE POLICY "Allow public read access to stock_movements" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert to stock_movements" ON public.stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to stock_movements" ON public.stock_movements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to stock_movements" ON public.stock_movements FOR DELETE USING (true);

-- RLS Policies for product_comments
CREATE POLICY "Allow public read access to product_comments" ON public.product_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert to product_comments" ON public.product_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to product_comments" ON public.product_comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to product_comments" ON public.product_comments FOR DELETE USING (true);

-- RLS Policies for sensitivity_scenarios
CREATE POLICY "Allow public read access to sensitivity_scenarios" ON public.sensitivity_scenarios FOR SELECT USING (true);
CREATE POLICY "Allow public insert to sensitivity_scenarios" ON public.sensitivity_scenarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to sensitivity_scenarios" ON public.sensitivity_scenarios FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to sensitivity_scenarios" ON public.sensitivity_scenarios FOR DELETE USING (true);

-- RLS Policies for breakeven_analysis
CREATE POLICY "Allow public read access to breakeven_analysis" ON public.breakeven_analysis FOR SELECT USING (true);
CREATE POLICY "Allow public insert to breakeven_analysis" ON public.breakeven_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to breakeven_analysis" ON public.breakeven_analysis FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to breakeven_analysis" ON public.breakeven_analysis FOR DELETE USING (true);

-- RLS Policies for cashflow_stress_tests
CREATE POLICY "Allow public read access to cashflow_stress_tests" ON public.cashflow_stress_tests FOR SELECT USING (true);
CREATE POLICY "Allow public insert to cashflow_stress_tests" ON public.cashflow_stress_tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to cashflow_stress_tests" ON public.cashflow_stress_tests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to cashflow_stress_tests" ON public.cashflow_stress_tests FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON public.project_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON public.stocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_comments_updated_at BEFORE UPDATE ON public.product_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_breakeven_analysis_updated_at BEFORE UPDATE ON public.breakeven_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour performances
CREATE INDEX idx_products_mode ON public.products(mode);
CREATE INDEX idx_products_project_mode ON public.products(project_id, mode);
CREATE INDEX idx_ingredients_mode ON public.ingredients(mode);
CREATE INDEX idx_ingredients_sous_recette ON public.ingredients(is_sous_recette);
CREATE INDEX idx_stocks_project ON public.stocks(project_id);
CREATE INDEX idx_stocks_type ON public.stocks(type_stock);
CREATE INDEX idx_stock_movements_stock ON public.stock_movements(stock_id);
CREATE INDEX idx_product_comments_product ON public.product_comments(product_id);
CREATE INDEX idx_sensitivity_scenarios_project ON public.sensitivity_scenarios(project_id);