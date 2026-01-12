import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, ChefHat } from "lucide-react";

interface RecipeIngredient {
  ingredient_name: string;
  ingredient_unit: string;
  quantite_utilisee: number;
  line_cost: number;
  is_sub_recipe?: boolean;
}

interface RecipeCostBreakdownProps {
  ingredients: RecipeIngredient[];
  totalIngredientsCost: number;
  totalPackagingCost: number;
  totalVariableCost: number;
  totalCost: number;
  prixBTC: number;
}

export function RecipeCostBreakdown({
  ingredients,
  totalIngredientsCost,
  totalPackagingCost,
  totalVariableCost,
  totalCost,
  prixBTC,
}: RecipeCostBreakdownProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const margin = prixBTC > 0 ? ((prixBTC - totalCost) / prixBTC) * 100 : 0;
  const coefficient = totalCost > 0 ? prixBTC / totalCost : 0;

  const subRecipeIngredients = ingredients.filter((i) => i.is_sub_recipe);
  const regularIngredients = ingredients.filter((i) => !i.is_sub_recipe);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Décomposition du coût de revient
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sub-recipes section */}
        {subRecipeIngredients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Sous-recettes utilisées
            </h4>
            <div className="rounded-lg bg-muted/30 p-3 space-y-2">
              {subRecipeIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">SR</Badge>
                    <span>{ing.ingredient_name}</span>
                    <span className="text-muted-foreground">
                      ({ing.quantite_utilisee} {ing.ingredient_unit})
                    </span>
                  </div>
                  <span className="font-mono">{formatCurrency(ing.line_cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular ingredients */}
        {regularIngredients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Ingrédients</h4>
            <div className="space-y-1">
              {regularIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>
                    {ing.ingredient_name}{" "}
                    <span className="text-muted-foreground">
                      ({ing.quantite_utilisee} {ing.ingredient_unit})
                    </span>
                  </span>
                  <span className="font-mono">{formatCurrency(ing.line_cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Coût ingrédients</span>
            <span className="font-mono">{formatCurrency(totalIngredientsCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Coût emballages</span>
            <span className="font-mono">{formatCurrency(totalPackagingCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Coûts variables</span>
            <span className="font-mono">{formatCurrency(totalVariableCost)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Coût de revient total</span>
            <span className="font-mono">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        {/* Pricing info */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Prix de vente BTC</span>
            <span className="font-mono font-semibold">{formatCurrency(prixBTC)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Coefficient</span>
            <span
              className={`font-mono font-semibold ${
                coefficient >= 2 ? "text-green-600" : "text-amber-600"
              }`}
            >
              {coefficient.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Marge brute</span>
            <span
              className={`font-mono font-semibold ${
                margin >= 30 ? "text-green-600" : margin >= 20 ? "text-amber-600" : "text-red-600"
              }`}
            >
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
