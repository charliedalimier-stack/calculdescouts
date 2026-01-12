-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'accompagnateur', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Add owner_user_id to projects
ALTER TABLE public.projects ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check project access
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
  ) OR EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND owner_user_id = _user_id
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Project members policies
CREATE POLICY "Users can view project memberships they belong to"
  ON public.project_members FOR SELECT
  USING (auth.uid() = user_id OR public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Project owners can manage members"
  ON public.project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_user_id = auth.uid()
    )
  );

-- Drop old public policies on projects
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public delete to projects" ON public.projects;

-- New projects policies (user-based)
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (owner_user_id = auth.uid() OR public.has_project_access(auth.uid(), id));

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (owner_user_id = auth.uid() OR public.has_project_access(auth.uid(), id));

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (owner_user_id = auth.uid());

-- Update RLS policies for all project-related tables
-- Categories
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public insert to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public update to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public delete to categories" ON public.categories;

CREATE POLICY "Users can view categories in their projects"
  ON public.categories FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert categories in their projects"
  ON public.categories FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update categories in their projects"
  ON public.categories FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete categories in their projects"
  ON public.categories FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Ingredients
DROP POLICY IF EXISTS "Allow public read access to ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow public insert to ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow public update to ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow public delete to ingredients" ON public.ingredients;

CREATE POLICY "Users can view ingredients in their projects"
  ON public.ingredients FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert ingredients in their projects"
  ON public.ingredients FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update ingredients in their projects"
  ON public.ingredients FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete ingredients in their projects"
  ON public.ingredients FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Products
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert to products" ON public.products;
DROP POLICY IF EXISTS "Allow public update to products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete to products" ON public.products;

CREATE POLICY "Users can view products in their projects"
  ON public.products FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert products in their projects"
  ON public.products FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update products in their projects"
  ON public.products FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete products in their projects"
  ON public.products FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Packaging
DROP POLICY IF EXISTS "Allow public read access to packaging" ON public.packaging;
DROP POLICY IF EXISTS "Allow public insert to packaging" ON public.packaging;
DROP POLICY IF EXISTS "Allow public update to packaging" ON public.packaging;
DROP POLICY IF EXISTS "Allow public delete to packaging" ON public.packaging;

CREATE POLICY "Users can view packaging in their projects"
  ON public.packaging FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert packaging in their projects"
  ON public.packaging FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update packaging in their projects"
  ON public.packaging FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete packaging in their projects"
  ON public.packaging FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Variable costs
DROP POLICY IF EXISTS "Allow public read access to variable_costs" ON public.variable_costs;
DROP POLICY IF EXISTS "Allow public insert to variable_costs" ON public.variable_costs;
DROP POLICY IF EXISTS "Allow public update to variable_costs" ON public.variable_costs;
DROP POLICY IF EXISTS "Allow public delete to variable_costs" ON public.variable_costs;

CREATE POLICY "Users can view variable_costs in their projects"
  ON public.variable_costs FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert variable_costs in their projects"
  ON public.variable_costs FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update variable_costs in their projects"
  ON public.variable_costs FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete variable_costs in their projects"
  ON public.variable_costs FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Project settings
DROP POLICY IF EXISTS "Allow public read access to project_settings" ON public.project_settings;
DROP POLICY IF EXISTS "Allow public insert to project_settings" ON public.project_settings;
DROP POLICY IF EXISTS "Allow public update to project_settings" ON public.project_settings;
DROP POLICY IF EXISTS "Allow public delete to project_settings" ON public.project_settings;

CREATE POLICY "Users can view project_settings in their projects"
  ON public.project_settings FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert project_settings in their projects"
  ON public.project_settings FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update project_settings in their projects"
  ON public.project_settings FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete project_settings in their projects"
  ON public.project_settings FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Professional expenses
DROP POLICY IF EXISTS "Allow public read access to professional_expenses" ON public.professional_expenses;
DROP POLICY IF EXISTS "Allow public insert to professional_expenses" ON public.professional_expenses;
DROP POLICY IF EXISTS "Allow public update to professional_expenses" ON public.professional_expenses;
DROP POLICY IF EXISTS "Allow public delete to professional_expenses" ON public.professional_expenses;

CREATE POLICY "Users can view professional_expenses in their projects"
  ON public.professional_expenses FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert professional_expenses in their projects"
  ON public.professional_expenses FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update professional_expenses in their projects"
  ON public.professional_expenses FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete professional_expenses in their projects"
  ON public.professional_expenses FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Sales targets
DROP POLICY IF EXISTS "Allow public read access to sales_targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Allow public insert to sales_targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Allow public update to sales_targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Allow public delete to sales_targets" ON public.sales_targets;

CREATE POLICY "Users can view sales_targets in their projects"
  ON public.sales_targets FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert sales_targets in their projects"
  ON public.sales_targets FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update sales_targets in their projects"
  ON public.sales_targets FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete sales_targets in their projects"
  ON public.sales_targets FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Sales actuals
DROP POLICY IF EXISTS "Allow public read access to sales_actuals" ON public.sales_actuals;
DROP POLICY IF EXISTS "Allow public insert to sales_actuals" ON public.sales_actuals;
DROP POLICY IF EXISTS "Allow public update to sales_actuals" ON public.sales_actuals;
DROP POLICY IF EXISTS "Allow public delete to sales_actuals" ON public.sales_actuals;

CREATE POLICY "Users can view sales_actuals in their projects"
  ON public.sales_actuals FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert sales_actuals in their projects"
  ON public.sales_actuals FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update sales_actuals in their projects"
  ON public.sales_actuals FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete sales_actuals in their projects"
  ON public.sales_actuals FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Stocks
DROP POLICY IF EXISTS "Allow public read access to stocks" ON public.stocks;
DROP POLICY IF EXISTS "Allow public insert to stocks" ON public.stocks;
DROP POLICY IF EXISTS "Allow public update to stocks" ON public.stocks;
DROP POLICY IF EXISTS "Allow public delete to stocks" ON public.stocks;

CREATE POLICY "Users can view stocks in their projects"
  ON public.stocks FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert stocks in their projects"
  ON public.stocks FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update stocks in their projects"
  ON public.stocks FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete stocks in their projects"
  ON public.stocks FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Stock movements
DROP POLICY IF EXISTS "Allow public read access to stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Allow public insert to stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Allow public update to stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Allow public delete to stock_movements" ON public.stock_movements;

CREATE POLICY "Users can view stock_movements in their projects"
  ON public.stock_movements FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert stock_movements in their projects"
  ON public.stock_movements FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update stock_movements in their projects"
  ON public.stock_movements FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete stock_movements in their projects"
  ON public.stock_movements FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Cash flow
DROP POLICY IF EXISTS "Allow public read access to cash_flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow public insert to cash_flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow public update to cash_flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow public delete to cash_flow" ON public.cash_flow;

CREATE POLICY "Users can view cash_flow in their projects"
  ON public.cash_flow FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert cash_flow in their projects"
  ON public.cash_flow FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update cash_flow in their projects"
  ON public.cash_flow FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete cash_flow in their projects"
  ON public.cash_flow FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Breakeven analysis
DROP POLICY IF EXISTS "Allow public read access to breakeven_analysis" ON public.breakeven_analysis;
DROP POLICY IF EXISTS "Allow public insert to breakeven_analysis" ON public.breakeven_analysis;
DROP POLICY IF EXISTS "Allow public update to breakeven_analysis" ON public.breakeven_analysis;
DROP POLICY IF EXISTS "Allow public delete to breakeven_analysis" ON public.breakeven_analysis;

CREATE POLICY "Users can view breakeven_analysis in their projects"
  ON public.breakeven_analysis FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert breakeven_analysis in their projects"
  ON public.breakeven_analysis FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update breakeven_analysis in their projects"
  ON public.breakeven_analysis FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete breakeven_analysis in their projects"
  ON public.breakeven_analysis FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Sensitivity scenarios
DROP POLICY IF EXISTS "Allow public read access to sensitivity_scenarios" ON public.sensitivity_scenarios;
DROP POLICY IF EXISTS "Allow public insert to sensitivity_scenarios" ON public.sensitivity_scenarios;
DROP POLICY IF EXISTS "Allow public update to sensitivity_scenarios" ON public.sensitivity_scenarios;
DROP POLICY IF EXISTS "Allow public delete to sensitivity_scenarios" ON public.sensitivity_scenarios;

CREATE POLICY "Users can view sensitivity_scenarios in their projects"
  ON public.sensitivity_scenarios FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert sensitivity_scenarios in their projects"
  ON public.sensitivity_scenarios FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update sensitivity_scenarios in their projects"
  ON public.sensitivity_scenarios FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete sensitivity_scenarios in their projects"
  ON public.sensitivity_scenarios FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Cashflow stress tests
DROP POLICY IF EXISTS "Allow public read access to cashflow_stress_tests" ON public.cashflow_stress_tests;
DROP POLICY IF EXISTS "Allow public insert to cashflow_stress_tests" ON public.cashflow_stress_tests;
DROP POLICY IF EXISTS "Allow public update to cashflow_stress_tests" ON public.cashflow_stress_tests;
DROP POLICY IF EXISTS "Allow public delete to cashflow_stress_tests" ON public.cashflow_stress_tests;

CREATE POLICY "Users can view cashflow_stress_tests in their projects"
  ON public.cashflow_stress_tests FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert cashflow_stress_tests in their projects"
  ON public.cashflow_stress_tests FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update cashflow_stress_tests in their projects"
  ON public.cashflow_stress_tests FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete cashflow_stress_tests in their projects"
  ON public.cashflow_stress_tests FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Product comments
DROP POLICY IF EXISTS "Allow public read access to product_comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow public insert to product_comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow public update to product_comments" ON public.product_comments;
DROP POLICY IF EXISTS "Allow public delete to product_comments" ON public.product_comments;

CREATE POLICY "Users can view product_comments in their projects"
  ON public.product_comments FOR SELECT
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert product_comments in their projects"
  ON public.product_comments FOR INSERT
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update product_comments in their projects"
  ON public.product_comments FOR UPDATE
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete product_comments in their projects"
  ON public.product_comments FOR DELETE
  USING (public.has_project_access(auth.uid(), project_id));

-- Update trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();