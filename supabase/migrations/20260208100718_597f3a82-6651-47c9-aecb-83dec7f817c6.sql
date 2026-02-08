
-- Add financial objectives to project_settings
ALTER TABLE public.project_settings
ADD COLUMN seuil_viabilite numeric NOT NULL DEFAULT 0,
ADD COLUMN revenu_ideal numeric NOT NULL DEFAULT 0;
