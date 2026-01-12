-- Table pour les prix par catégorie (BTC, BTB, Distributeur)
CREATE TABLE public.product_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  categorie_prix TEXT NOT NULL CHECK (categorie_prix IN ('BTC', 'BTB', 'Distributeur')),
  prix_ht NUMERIC NOT NULL DEFAULT 0,
  tva_taux NUMERIC NOT NULL DEFAULT 5.5,
  mode TEXT NOT NULL DEFAULT 'simulation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, categorie_prix, mode)
);

-- Enable RLS
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies using has_recipe_access (product-based)
CREATE POLICY "Users can view product_prices in their projects"
  ON public.product_prices FOR SELECT
  USING (has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can insert product_prices in their projects"
  ON public.product_prices FOR INSERT
  WITH CHECK (has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can update product_prices in their projects"
  ON public.product_prices FOR UPDATE
  USING (has_recipe_access(auth.uid(), product_id));

CREATE POLICY "Users can delete product_prices in their projects"
  ON public.product_prices FOR DELETE
  USING (has_recipe_access(auth.uid(), product_id));

-- Ajouter categorie_prix aux tables de ventes existantes
ALTER TABLE public.sales_targets 
  ADD COLUMN categorie_prix TEXT NOT NULL DEFAULT 'BTC' CHECK (categorie_prix IN ('BTC', 'BTB', 'Distributeur'));

ALTER TABLE public.sales_actuals 
  ADD COLUMN categorie_prix TEXT NOT NULL DEFAULT 'BTC' CHECK (categorie_prix IN ('BTC', 'BTB', 'Distributeur'));

-- Index pour les requêtes avec categorie_prix
CREATE INDEX idx_sales_targets_categorie ON public.sales_targets (project_id, product_id, mois, categorie_prix);
CREATE INDEX idx_sales_actuals_categorie ON public.sales_actuals (project_id, product_id, mois, categorie_prix);

-- Trigger pour créer automatiquement les 3 prix quand un produit est créé
CREATE OR REPLACE FUNCTION public.create_default_product_prices()
RETURNS TRIGGER AS $$
DECLARE
  btb_rate NUMERIC;
  dist_rate NUMERIC;
  product_tva NUMERIC;
BEGIN
  -- Get rates from project settings (default 30% for BTB, 15% for Distributeur)
  SELECT COALESCE(marge_btb, 30), COALESCE(marge_distributeur, 15)
  INTO btb_rate, dist_rate
  FROM project_settings
  WHERE project_id = NEW.project_id;

  -- Get TVA rate from product
  product_tva := COALESCE(NEW.tva_taux, 5.5);

  -- Create BTC price (same as product price)
  INSERT INTO product_prices (product_id, categorie_prix, prix_ht, tva_taux, mode)
  VALUES (NEW.id, 'BTC', NEW.prix_btc, product_tva, NEW.mode)
  ON CONFLICT (product_id, categorie_prix, mode) DO UPDATE SET prix_ht = NEW.prix_btc, tva_taux = product_tva;

  -- Create BTB price (70% of BTC by default)
  INSERT INTO product_prices (product_id, categorie_prix, prix_ht, tva_taux, mode)
  VALUES (NEW.id, 'BTB', NEW.prix_btc * (1 - btb_rate / 100), product_tva, NEW.mode)
  ON CONFLICT (product_id, categorie_prix, mode) DO UPDATE SET prix_ht = NEW.prix_btc * (1 - btb_rate / 100), tva_taux = product_tva;

  -- Create Distributeur price (85% of BTB by default)
  INSERT INTO product_prices (product_id, categorie_prix, prix_ht, tva_taux, mode)
  VALUES (NEW.id, 'Distributeur', NEW.prix_btc * (1 - btb_rate / 100) * (1 - dist_rate / 100), product_tva, NEW.mode)
  ON CONFLICT (product_id, categorie_prix, mode) DO UPDATE SET prix_ht = NEW.prix_btc * (1 - btb_rate / 100) * (1 - dist_rate / 100), tva_taux = product_tva;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_product_prices_on_insert
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.create_default_product_prices();

-- Trigger pour mettre à jour les prix quand prix_btc change
CREATE TRIGGER update_product_prices_on_update
AFTER UPDATE OF prix_btc ON public.products
FOR EACH ROW
WHEN (OLD.prix_btc IS DISTINCT FROM NEW.prix_btc)
EXECUTE FUNCTION public.create_default_product_prices();

-- Créer les prix pour les produits existants
INSERT INTO product_prices (product_id, categorie_prix, prix_ht, tva_taux, mode)
SELECT p.id, 'BTC', p.prix_btc, COALESCE(p.tva_taux, 5.5), p.mode FROM products p
ON CONFLICT (product_id, categorie_prix, mode) DO NOTHING;

INSERT INTO product_prices (product_id, categorie_prix, prix_ht, tva_taux, mode)
SELECT p.id, 'BTB', p.prix_btc * 0.7, COALESCE(p.tva_taux, 5.5), p.mode FROM products p
ON CONFLICT (product_id, categorie_prix, mode) DO NOTHING;

INSERT INTO product_prices (product_id, categorie_prix, prix_ht, tva_taux, mode)
SELECT p.id, 'Distributeur', p.prix_btc * 0.7 * 0.85, COALESCE(p.tva_taux, 5.5), p.mode FROM products p
ON CONFLICT (product_id, categorie_prix, mode) DO NOTHING;