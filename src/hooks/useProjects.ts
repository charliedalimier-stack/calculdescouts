import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ProjectInsert {
  nom_projet: string;
  description?: string | null;
}

export function useProjects() {
  const { projects, isLoading, refetchProjects, setCurrentProject } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addProject = useMutation({
    mutationFn: async (project: ProjectInsert) => {
      if (!user) throw new Error('Utilisateur non connecté');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          owner_user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      setCurrentProject(data);
      toast.success('Projet créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nom_projet?: string; description?: string | null }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      toast.success('Projet mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      toast.success('Projet supprimé');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const duplicateProject = useMutation({
    mutationFn: async (sourceId: string) => {
      if (!user) throw new Error('Utilisateur non connecté');
      
      const source = projects.find(p => p.id === sourceId);
      if (!source) throw new Error('Projet source non trouvé');

      // Create new project with owner
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          nom_projet: `${source.nom_projet} (copie)`,
          description: source.description,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Copy categories (and map old IDs to new IDs for products)
      const categoryMap: Record<string, string> = {};
      const { data: categories } = await supabase
        .from('categories')
        .select('id, nom_categorie')
        .eq('project_id', sourceId);

      if (categories && categories.length > 0) {
        for (const c of categories) {
          const { data: newCat } = await supabase.from('categories').insert({
            nom_categorie: c.nom_categorie,
            project_id: newProject.id,
          }).select().single();
          if (newCat) categoryMap[c.id] = newCat.id;
        }
      }

      // Copy ingredients (and map old IDs to new IDs for recipes)
      const ingredientMap: Record<string, string> = {};
      const { data: ingredients } = await supabase
        .from('ingredients')
        .select('id, nom_ingredient, cout_unitaire, unite, fournisseur, tva_taux')
        .eq('project_id', sourceId);

      if (ingredients && ingredients.length > 0) {
        for (const i of ingredients) {
          const { data: newIng } = await supabase.from('ingredients').insert({
            nom_ingredient: i.nom_ingredient,
            cout_unitaire: i.cout_unitaire,
            unite: i.unite,
            fournisseur: i.fournisseur,
            tva_taux: i.tva_taux,
            project_id: newProject.id,
          }).select().single();
          if (newIng) ingredientMap[i.id] = newIng.id;
        }
      }

      // Copy packaging (and map IDs)
      const packagingMap: Record<string, string> = {};
      const { data: packaging } = await supabase
        .from('packaging')
        .select('id, nom, cout_unitaire, unite, type_emballage, tva_taux')
        .eq('project_id', sourceId);

      if (packaging && packaging.length > 0) {
        for (const p of packaging) {
          const { data: newPkg } = await supabase.from('packaging').insert({
            nom: p.nom,
            cout_unitaire: p.cout_unitaire,
            unite: p.unite,
            type_emballage: p.type_emballage,
            tva_taux: p.tva_taux,
            project_id: newProject.id,
          }).select().single();
          if (newPkg) packagingMap[p.id] = newPkg.id;
        }
      }

      // Copy variable costs (and map IDs)
      const varCostMap: Record<string, string> = {};
      const { data: varCosts } = await supabase
        .from('variable_costs')
        .select('id, nom, cout_unitaire, unite, type_cout, tva_taux')
        .eq('project_id', sourceId);

      if (varCosts && varCosts.length > 0) {
        for (const vc of varCosts) {
          const { data: newVC } = await supabase.from('variable_costs').insert({
            nom: vc.nom,
            cout_unitaire: vc.cout_unitaire,
            unite: vc.unite,
            type_cout: vc.type_cout,
            tva_taux: vc.tva_taux,
            project_id: newProject.id,
          }).select().single();
          if (newVC) varCostMap[vc.id] = newVC.id;
        }
      }

      // Copy products (and map IDs)
      const productMap: Record<string, string> = {};
      const { data: products } = await supabase
        .from('products')
        .select('id, nom_produit, prix_btc, unite_vente, tva_taux, yield_quantity, categorie_id')
        .eq('project_id', sourceId);

      if (products && products.length > 0) {
        for (const p of products) {
          const { data: newProd } = await supabase.from('products').insert({
            nom_produit: p.nom_produit,
            prix_btc: p.prix_btc,
            unite_vente: p.unite_vente,
            tva_taux: p.tva_taux,
            yield_quantity: p.yield_quantity,
            categorie_id: p.categorie_id ? categoryMap[p.categorie_id] || null : null,
            project_id: newProject.id,
          }).select().single();
          if (newProd) productMap[p.id] = newProd.id;
        }
      }

      // Copy recipes
      const { data: recipes } = await supabase
        .from('recipes')
        .select('product_id, ingredient_id, quantite_utilisee')
        .in('product_id', Object.keys(productMap));

      if (recipes && recipes.length > 0) {
        await supabase.from('recipes').insert(
          recipes.map(r => ({
            product_id: productMap[r.product_id],
            ingredient_id: ingredientMap[r.ingredient_id],
            quantite_utilisee: r.quantite_utilisee,
          }))
        );
      }

      // Copy product_packaging
      const { data: prodPkg } = await supabase
        .from('product_packaging')
        .select('product_id, packaging_id, quantite')
        .in('product_id', Object.keys(productMap));

      if (prodPkg && prodPkg.length > 0) {
        await supabase.from('product_packaging').insert(
          prodPkg.map(pp => ({
            product_id: productMap[pp.product_id],
            packaging_id: packagingMap[pp.packaging_id],
            quantite: pp.quantite,
          }))
        );
      }

      // Copy product_variable_costs
      const { data: prodVC } = await supabase
        .from('product_variable_costs')
        .select('product_id, variable_cost_id, quantite')
        .in('product_id', Object.keys(productMap));

      if (prodVC && prodVC.length > 0) {
        await supabase.from('product_variable_costs').insert(
          prodVC.map(pvc => ({
            product_id: productMap[pvc.product_id],
            variable_cost_id: varCostMap[pvc.variable_cost_id],
            quantite: pvc.quantite,
          }))
        );
      }

      // Copy project settings
      const { data: settings } = await supabase
        .from('project_settings')
        .select('*')
        .eq('project_id', sourceId)
        .single();

      if (settings) {
        const { id, project_id, created_at, updated_at, ...settingsData } = settings;
        await supabase.from('project_settings').insert({
          ...settingsData,
          project_id: newProject.id,
        });
      }

      // Copy seasonality coefficients
      const { data: seasonality } = await supabase
        .from('seasonality_coefficients')
        .select('*')
        .eq('project_id', sourceId);

      if (seasonality && seasonality.length > 0) {
        await supabase.from('seasonality_coefficients').insert(
          seasonality.map(s => {
            const { id, project_id, created_at, updated_at, ...rest } = s;
            return { ...rest, project_id: newProject.id };
          })
        );
      }

      // ❌ NOT copied: annual_sales, monthly_sales_reel, sales_targets, sales_actuals,
      // cash_flow, professional_expenses, stock_movements, stocks

      return newProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refetchProjects();
      setCurrentProject(data);
      toast.success('Projet dupliqué avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la duplication: ' + error.message);
    },
  });

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    duplicateProject,
  };
}
