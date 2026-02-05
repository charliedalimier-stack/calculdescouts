-- Add yield_quantity column to products table for portion management
-- Default = 1 for backward compatibility with existing recipes
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS yield_quantity INTEGER NOT NULL DEFAULT 1;

-- Add check constraint to ensure yield_quantity is at least 1
ALTER TABLE public.products
ADD CONSTRAINT yield_quantity_check CHECK (yield_quantity >= 1);

-- Add a comment for documentation
COMMENT ON COLUMN public.products.yield_quantity IS 'Number of portions/units produced by this recipe. Cost per portion = total recipe cost / yield_quantity';