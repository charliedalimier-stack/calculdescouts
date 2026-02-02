-- Add payment delay columns per sales channel
ALTER TABLE public.project_settings
ADD COLUMN IF NOT EXISTS delai_paiement_btc integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delai_paiement_btb integer NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS delai_paiement_distributeur integer NOT NULL DEFAULT 30;

-- Add comment for documentation
COMMENT ON COLUMN public.project_settings.delai_paiement_btc IS 'Payment delay in days for BTC (direct consumer) sales - typically 0 for immediate payment';
COMMENT ON COLUMN public.project_settings.delai_paiement_btb IS 'Payment delay in days for BTB (business to business) sales';
COMMENT ON COLUMN public.project_settings.delai_paiement_distributeur IS 'Payment delay in days for Distributor sales';