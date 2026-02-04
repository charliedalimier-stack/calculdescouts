-- ========================================
-- NORMALISATION DES MODES: simulation → budget
-- ========================================

-- 1. Drop existing check constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_mode_check;
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_mode_check;
ALTER TABLE packaging DROP CONSTRAINT IF EXISTS packaging_mode_check;
ALTER TABLE variable_costs DROP CONSTRAINT IF EXISTS variable_costs_mode_check;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_mode_check;
ALTER TABLE product_packaging DROP CONSTRAINT IF EXISTS product_packaging_mode_check;
ALTER TABLE product_variable_costs DROP CONSTRAINT IF EXISTS product_variable_costs_mode_check;
ALTER TABLE product_prices DROP CONSTRAINT IF EXISTS product_prices_mode_check;
ALTER TABLE product_comments DROP CONSTRAINT IF EXISTS product_comments_mode_check;
ALTER TABLE breakeven_analysis DROP CONSTRAINT IF EXISTS breakeven_analysis_mode_check;
ALTER TABLE cash_flow DROP CONSTRAINT IF EXISTS cash_flow_mode_check;
ALTER TABLE sales_targets DROP CONSTRAINT IF EXISTS sales_targets_mode_check;
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_mode_check;

-- 2. Update all existing 'simulation' values to 'budget'
UPDATE products SET mode = 'budget' WHERE mode = 'simulation';
UPDATE ingredients SET mode = 'budget' WHERE mode = 'simulation';
UPDATE packaging SET mode = 'budget' WHERE mode = 'simulation';
UPDATE variable_costs SET mode = 'budget' WHERE mode = 'simulation';
UPDATE recipes SET mode = 'budget' WHERE mode = 'simulation';
UPDATE product_packaging SET mode = 'budget' WHERE mode = 'simulation';
UPDATE product_variable_costs SET mode = 'budget' WHERE mode = 'simulation';
UPDATE product_prices SET mode = 'budget' WHERE mode = 'simulation';
UPDATE product_comments SET mode = 'budget' WHERE mode = 'simulation';
UPDATE breakeven_analysis SET mode = 'budget' WHERE mode = 'simulation';
UPDATE cash_flow SET mode = 'budget' WHERE mode = 'simulation';
UPDATE sales_targets SET mode = 'budget' WHERE mode = 'simulation';
UPDATE stocks SET mode = 'budget' WHERE mode = 'simulation';
UPDATE professional_expenses SET mode = 'budget' WHERE mode = 'simulation';

-- 3. Update default values for all mode columns
ALTER TABLE products ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE ingredients ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE packaging ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE variable_costs ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE recipes ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE product_packaging ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE product_variable_costs ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE product_prices ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE product_comments ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE breakeven_analysis ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE cash_flow ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE sales_targets ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE stocks ALTER COLUMN mode SET DEFAULT 'budget';
ALTER TABLE professional_expenses ALTER COLUMN mode SET DEFAULT 'budget';

-- 4. Add new check constraints with 'budget' | 'reel'
ALTER TABLE products ADD CONSTRAINT products_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE ingredients ADD CONSTRAINT ingredients_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE packaging ADD CONSTRAINT packaging_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE variable_costs ADD CONSTRAINT variable_costs_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE recipes ADD CONSTRAINT recipes_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE product_packaging ADD CONSTRAINT product_packaging_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE product_variable_costs ADD CONSTRAINT product_variable_costs_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE product_prices ADD CONSTRAINT product_prices_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE product_comments ADD CONSTRAINT product_comments_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE breakeven_analysis ADD CONSTRAINT breakeven_analysis_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE cash_flow ADD CONSTRAINT cash_flow_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE sales_targets ADD CONSTRAINT sales_targets_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE stocks ADD CONSTRAINT stocks_mode_check CHECK (mode IN ('budget', 'reel'));
ALTER TABLE professional_expenses ADD CONSTRAINT professional_expenses_mode_check CHECK (mode IN ('budget', 'reel'));