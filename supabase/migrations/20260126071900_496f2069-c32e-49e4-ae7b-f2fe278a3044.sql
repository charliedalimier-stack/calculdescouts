-- Add social contributions rate to project_settings
ALTER TABLE public.project_settings 
ADD COLUMN IF NOT EXISTS taux_cotisations_sociales numeric NOT NULL DEFAULT 20.5;