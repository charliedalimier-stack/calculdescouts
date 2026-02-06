-- Add unique constraint for upsert on monthly_sales_reel
ALTER TABLE public.monthly_sales_reel 
DROP CONSTRAINT IF EXISTS monthly_sales_reel_unique_entry;

ALTER TABLE public.monthly_sales_reel 
ADD CONSTRAINT monthly_sales_reel_unique_entry 
UNIQUE (project_id, product_id, year, month, categorie_prix);