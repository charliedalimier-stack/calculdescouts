import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useMode } from '@/contexts/ModeContext';
import { useProducts, ProductWithCosts } from './useProducts';
import { useProjectSettings } from './useProjectSettings';
import { toast } from 'sonner';

export type Channel = 'btc' | 'btb' | 'distributeur';

export interface BreakevenResult {
  productId: string;
  productName: string;
  categoryName: string | null;
  channel: Channel;
  
  // Coûts
  coutVariable: number;
  coutFixeAlloue: number;
  
  // Prix selon canal
  prixVente: number;
  prixVenteHT: number;
  prixVenteTTC: number;
  
  // Seuil de rentabilité
  seuilUnites: number;
  seuilCA: number;
  seuilCAHT: number;
  seuilCATTC: number;
  
  // Marge de sécurité
  volumeActuel: number;
  margeSecurite: number;
  margeSecuriteUnites: number;
  
  // Indicateurs
  contributionUnitaire: number;
  tauxContribution: number;
  isRentable: boolean;
  distanceSeuil: number; // % au-dessus ou en-dessous du seuil
}

export interface BreakevenSummary {
  seuilGlobalUnites: number;
  seuilGlobalCA: number;
  margeSecuriteGlobale: number;
  nbProduitsRentables: number;
  nbProduitsSousSeuil: number;
  produitsParCanal: {
    btc: number;
    btb: number;
    distributeur: number;
  };
}

export interface SavedBreakevenAnalysis {
  id: string;
  project_id: string;
  product_id: string | null;
  mode: string;
  canal: string | null;
  mois: string;
  volume_minimum: number | null;
  ca_minimum: number | null;
  marge_securite: number | null;
  inclure_tva: boolean;
  created_at: string;
  updated_at: string;
}

export function useBreakevenAnalysis() {
  const { currentProject } = useProject();
  const { mode } = useMode();
  const { productsWithCosts, isLoadingWithCosts } = useProducts();
  const { settings } = useProjectSettings();
  const queryClient = useQueryClient();

  // Récupérer les données de ventes
  const { data: salesData = { targets: [], actuals: [] }, isLoading: isLoadingSales } = useQuery({
    queryKey: ['breakeven-sales', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return { targets: [], actuals: [] };
      
      const [targetsRes, actualsRes] = await Promise.all([
        supabase
          .from('sales_targets')
          .select('*')
          .eq('project_id', currentProject.id),
        supabase
          .from('sales_actuals')
          .select('*')
          .eq('project_id', currentProject.id),
      ]);
      
      return {
        targets: targetsRes.data || [],
        actuals: actualsRes.data || [],
      };
    },
    enabled: !!currentProject?.id,
  });

  // Récupérer les analyses sauvegardées
  const { data: savedAnalyses = [], isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['breakeven-analyses', currentProject?.id, mode],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      
      const { data, error } = await supabase
        .from('breakeven_analysis')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('mode', mode)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedBreakevenAnalysis[];
    },
    enabled: !!currentProject?.id,
  });

  // Calculer le seuil de rentabilité pour un produit et un canal
  const calculateBreakeven = (
    product: ProductWithCosts,
    channel: Channel,
    volumeActuel: number = 0,
    coutFixeAlloue: number = 0,
    includeTva: boolean = false
  ): BreakevenResult => {
    const tvaTaux = product.tva_taux ?? settings?.tva_vente ?? 5.5;
    
    // Prix selon le canal
    let prixVenteHT: number;
    switch (channel) {
      case 'btc':
        prixVenteHT = product.prix_btc;
        break;
      case 'btb':
        prixVenteHT = product.prix_btb;
        break;
      case 'distributeur':
        prixVenteHT = product.prix_distributor;
        break;
    }
    
    const prixVenteTTC = prixVenteHT * (1 + tvaTaux / 100);
    const prixVente = includeTva ? prixVenteTTC : prixVenteHT;
    
    // Coût variable unitaire (matières + emballage + charges variables)
    const coutVariable = product.cost_total;
    
    // Contribution unitaire (prix - coût variable)
    const contributionUnitaire = prixVenteHT - coutVariable;
    
    // Taux de contribution
    const tauxContribution = prixVenteHT > 0 ? (contributionUnitaire / prixVenteHT) * 100 : 0;
    
    // Seuil de rentabilité en unités
    // Si pas de coûts fixes alloués, le seuil est 0 si contribution positive
    let seuilUnites = 0;
    if (contributionUnitaire > 0 && coutFixeAlloue > 0) {
      seuilUnites = Math.ceil(coutFixeAlloue / contributionUnitaire);
    } else if (contributionUnitaire <= 0) {
      seuilUnites = Infinity; // Jamais rentable
    }
    
    // Seuil en CA
    const seuilCAHT = seuilUnites * prixVenteHT;
    const seuilCATTC = seuilUnites * prixVenteTTC;
    const seuilCA = includeTva ? seuilCATTC : seuilCAHT;
    
    // Marge de sécurité
    let margeSecurite = 0;
    let margeSecuriteUnites = 0;
    if (volumeActuel > 0 && seuilUnites !== Infinity && seuilUnites > 0) {
      margeSecuriteUnites = volumeActuel - seuilUnites;
      margeSecurite = ((volumeActuel - seuilUnites) / volumeActuel) * 100;
    } else if (volumeActuel > 0 && seuilUnites === 0) {
      margeSecurite = 100;
      margeSecuriteUnites = volumeActuel;
    }
    
    // Distance au seuil (%)
    const distanceSeuil = seuilUnites > 0 && seuilUnites !== Infinity
      ? ((volumeActuel - seuilUnites) / seuilUnites) * 100
      : volumeActuel > 0 ? 100 : 0;
    
    return {
      productId: product.id,
      productName: product.nom_produit,
      categoryName: product.category_name,
      channel,
      coutVariable,
      coutFixeAlloue,
      prixVente,
      prixVenteHT,
      prixVenteTTC,
      seuilUnites: seuilUnites === Infinity ? -1 : seuilUnites,
      seuilCA: seuilUnites === Infinity ? -1 : seuilCA,
      seuilCAHT: seuilUnites === Infinity ? -1 : seuilCAHT,
      seuilCATTC: seuilUnites === Infinity ? -1 : seuilCATTC,
      volumeActuel,
      margeSecurite,
      margeSecuriteUnites,
      contributionUnitaire,
      tauxContribution,
      isRentable: volumeActuel >= seuilUnites || (seuilUnites === 0 && contributionUnitaire > 0),
      distanceSeuil,
    };
  };

  // Obtenir l'analyse pour un produit sur tous les canaux
  const getProductBreakeven = (
    productId: string,
    coutFixeTotal: number = 0,
    includeTva: boolean = false
  ): BreakevenResult[] | null => {
    const product = productsWithCosts.find(p => p.id === productId);
    if (!product) return null;

    // Calculer le volume actuel depuis les ventes
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const volumeActuel = salesData.actuals.find(
      (s: any) => s.product_id === productId && s.mois.startsWith(currentMonth.slice(0, 7))
    )?.quantite_reelle ?? 
    salesData.targets.find(
      (s: any) => s.product_id === productId && s.mois.startsWith(currentMonth.slice(0, 7))
    )?.quantite_objectif ?? 0;

    // Allocation des coûts fixes (proportionnel au CA prévu ou égal)
    const nbProducts = productsWithCosts.length || 1;
    const coutFixeAlloue = coutFixeTotal / nbProducts;

    const channels: Channel[] = ['btc', 'btb', 'distributeur'];
    return channels.map(channel => 
      calculateBreakeven(product, channel, volumeActuel, coutFixeAlloue, includeTva)
    );
  };

  // Obtenir l'analyse globale pour tous les produits
  const getAllProductsBreakeven = (
    coutFixeTotal: number = 0,
    channel: Channel = 'btc',
    includeTva: boolean = false
  ): BreakevenResult[] => {
    if (!productsWithCosts.length) return [];

    const nbProducts = productsWithCosts.length;
    const coutFixeAlloue = coutFixeTotal / nbProducts;

    return productsWithCosts.map(product => {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const volumeActuel = salesData.actuals.find(
        (s: any) => s.product_id === product.id && s.mois.startsWith(currentMonth.slice(0, 7))
      )?.quantite_reelle ?? 
      salesData.targets.find(
        (s: any) => s.product_id === product.id && s.mois.startsWith(currentMonth.slice(0, 7))
      )?.quantite_objectif ?? 0;

      return calculateBreakeven(product, channel, volumeActuel, coutFixeAlloue, includeTva);
    });
  };

  // Calculer le résumé global
  const getBreakevenSummary = (
    coutFixeTotal: number = 0,
    includeTva: boolean = false
  ): BreakevenSummary => {
    const channels: Channel[] = ['btc', 'btb', 'distributeur'];
    let seuilGlobalUnites = 0;
    let seuilGlobalCA = 0;
    let nbProduitsRentables = 0;
    let nbProduitsSousSeuil = 0;
    const produitsParCanal = { btc: 0, btb: 0, distributeur: 0 };

    const allResults = productsWithCosts.flatMap(product => {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const volumeActuel = salesData.actuals.find(
        (s: any) => s.product_id === product.id && s.mois.startsWith(currentMonth.slice(0, 7))
      )?.quantite_reelle ?? 0;

      const coutFixeAlloue = coutFixeTotal / (productsWithCosts.length || 1);
      
      return channels.map(channel => 
        calculateBreakeven(product, channel, volumeActuel, coutFixeAlloue, includeTva)
      );
    });

    // Calculer les totaux (on prend BTC comme référence pour le global)
    const btcResults = allResults.filter(r => r.channel === 'btc');
    
    btcResults.forEach(result => {
      if (result.seuilUnites >= 0) {
        seuilGlobalUnites += result.seuilUnites;
        seuilGlobalCA += result.seuilCA;
      }
      if (result.isRentable) {
        nbProduitsRentables++;
      } else {
        nbProduitsSousSeuil++;
      }
    });

    // Compter les produits rentables par canal
    channels.forEach(channel => {
      const channelResults = allResults.filter(r => r.channel === channel);
      produitsParCanal[channel] = channelResults.filter(r => r.isRentable).length;
    });

    // Marge de sécurité globale
    const volumeTotal = btcResults.reduce((sum, r) => sum + r.volumeActuel, 0);
    const margeSecuriteGlobale = volumeTotal > 0 && seuilGlobalUnites > 0
      ? ((volumeTotal - seuilGlobalUnites) / volumeTotal) * 100
      : 0;

    return {
      seuilGlobalUnites,
      seuilGlobalCA,
      margeSecuriteGlobale,
      nbProduitsRentables,
      nbProduitsSousSeuil,
      produitsParCanal,
    };
  };

  // Sauvegarder une analyse
  const saveAnalysis = useMutation({
    mutationFn: async (analysis: {
      productId: string | null;
      canal: Channel | null;
      mois: string;
      volumeMinimum: number;
      caMinimum: number;
      margeSecurite: number;
      inclureTva: boolean;
    }) => {
      if (!currentProject?.id) throw new Error('Aucun projet sélectionné');

      const { data, error } = await supabase
        .from('breakeven_analysis')
        .insert({
          project_id: currentProject.id,
          product_id: analysis.productId,
          mode,
          canal: analysis.canal,
          mois: analysis.mois,
          volume_minimum: analysis.volumeMinimum,
          ca_minimum: analysis.caMinimum,
          marge_securite: analysis.margeSecurite,
          inclure_tva: analysis.inclureTva,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakeven-analyses', currentProject?.id, mode] });
      toast.success('Analyse sauvegardée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Supprimer une analyse
  const deleteAnalysis = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('breakeven_analysis')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakeven-analyses', currentProject?.id, mode] });
      toast.success('Analyse supprimée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    productsWithCosts,
    savedAnalyses,
    isLoading: isLoadingWithCosts || isLoadingAnalyses || isLoadingSales,
    calculateBreakeven,
    getProductBreakeven,
    getAllProductsBreakeven,
    getBreakevenSummary,
    saveAnalysis,
    deleteAnalysis,
  };
}
