-- Add Belgian VAT configuration fields to project_settings
ALTER TABLE public.project_settings
ADD COLUMN IF NOT EXISTS pays text NOT NULL DEFAULT 'Belgique',
ADD COLUMN IF NOT EXISTS regime_tva text NOT NULL DEFAULT 'assujetti_normal',
ADD COLUMN IF NOT EXISTS tva_standard numeric NOT NULL DEFAULT 21,
ADD COLUMN IF NOT EXISTS tva_reduit_1 numeric NOT NULL DEFAULT 12,
ADD COLUMN IF NOT EXISTS tva_reduit_2 numeric NOT NULL DEFAULT 6;

-- Update default tva_vente from French 5.5% to Belgian 6%
ALTER TABLE public.project_settings ALTER COLUMN tva_vente SET DEFAULT 6;

-- Update default tva_achat from French 20% to Belgian 21%
ALTER TABLE public.project_settings ALTER COLUMN tva_achat SET DEFAULT 21;

-- Update existing records to Belgian defaults
UPDATE public.project_settings
SET 
  pays = 'Belgique',
  regime_tva = 'assujetti_normal',
  tva_standard = 21,
  tva_reduit_1 = 12,
  tva_reduit_2 = 6,
  tva_vente = 6,
  tva_achat = 21
WHERE tva_vente = 5.5 AND tva_achat = 20;

-- Update default tva_taux for ingredients from 20% to 21%
ALTER TABLE public.ingredients ALTER COLUMN tva_taux SET DEFAULT 21;

-- Update default tva_taux for packaging from 20% to 21%
ALTER TABLE public.packaging ALTER COLUMN tva_taux SET DEFAULT 21;

-- Update default tva_taux for variable_costs from 20% to 21%
ALTER TABLE public.variable_costs ALTER COLUMN tva_taux SET DEFAULT 21;

-- Comment for documentation
COMMENT ON COLUMN public.project_settings.pays IS 'Country for VAT rules (Belgique by default)';
COMMENT ON COLUMN public.project_settings.regime_tva IS 'VAT regime: assujetti_normal or franchise_taxe';
COMMENT ON COLUMN public.project_settings.tva_standard IS 'Standard VAT rate (21% for Belgium)';
COMMENT ON COLUMN public.project_settings.tva_reduit_1 IS 'Reduced VAT rate 1 (12% for Belgium)';
COMMENT ON COLUMN public.project_settings.tva_reduit_2 IS 'Reduced VAT rate 2 (6% for Belgium)';