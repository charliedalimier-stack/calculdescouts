import { useNavigate } from "react-router-dom";
import { ChefHat, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RESTAURANT_APP_URL, isRestaurantAvailable } from "@/lib/config";

const SelectActivity = () => {
  const navigate = useNavigate();

  const handleTransformation = () => {
    navigate("/");
  };

  const handleRestauration = () => {
    if (isRestaurantAvailable) {
      window.location.href = RESTAURANT_APP_URL;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">PilotFood</h1>
        <p className="text-muted-foreground">Choisissez votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
          onClick={handleTransformation}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Transformation alimentaire</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Production de produits finis : recettes, coûts de production, tarification BTC/BTB/Distributeur, plan financier.
            </CardDescription>
          </CardContent>
        </Card>

        <Card
          className={`transition-all ${
            isRestaurantAvailable
              ? "cursor-pointer hover:shadow-lg hover:border-primary group"
              : "opacity-60 cursor-not-allowed"
          }`}
          onClick={handleRestauration}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors mb-2">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">
              Restauration
              {!isRestaurantAvailable && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Bientôt disponible
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Gestion de restaurant : fiches techniques, food cost, carte et menus, couverts, sur place / livraison / traiteur.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelectActivity;
