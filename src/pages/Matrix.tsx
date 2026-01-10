import { AppLayout } from "@/components/layout/AppLayout";
import { BCGMatrix } from "@/components/dashboard/BCGMatrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Lightbulb } from "lucide-react";

const Matrix = () => {
  return (
    <AppLayout
      title="Matrice BCG"
      subtitle="Analysez le positionnement stratégique de vos produits"
    >
      <div className="mb-6">
        <Card className="bg-accent/30">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Comment interpréter cette matrice ?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                La matrice BCG croise la rentabilité (axe X) et le volume des ventes (axe Y) pour identifier 
                4 catégories de produits : les Stars (à développer), les Cash Cows (à maintenir), 
                les Dilemmes (à analyser) et les Dogs (à supprimer ou repositionner).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BCGMatrix />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              Recommandations stratégiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                ⭐ Stars - À développer
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Ces produits génèrent du volume ET de la marge. Investissez dans leur promotion, 
                augmentez leur visibilité et développez des déclinaisons.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Sauce tomate
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Sirop menthe
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 p-4">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                💰 Cash Cows - À maintenir
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Ces produits vendent bien mais avec une marge modérée. Maintenez leur qualité, 
                évitez les investissements lourds, et utilisez leur trésorerie pour développer les Stars.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-chart-2/10 px-3 py-1 text-xs font-medium" style={{ color: "hsl(var(--chart-2))" }}>
                  Confiture fraise
                </span>
                <span className="rounded-full bg-chart-2/10 px-3 py-1 text-xs font-medium" style={{ color: "hsl(var(--chart-2))" }}>
                  Jus pomme
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                ❓ Dilemmes - À analyser
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Rentables mais faible volume. Analysez le potentiel : si le marché existe, 
                investissez en communication. Sinon, considérez l'abandon.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-chart-4/10 px-3 py-1 text-xs font-medium" style={{ color: "hsl(var(--chart-4))" }}>
                  Pesto basilic
                </span>
                <span className="rounded-full bg-chart-4/10 px-3 py-1 text-xs font-medium" style={{ color: "hsl(var(--chart-4))" }}>
                  Miel lavande
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                🐶 Dogs - À repositionner
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Faible volume ET faible marge. Analysez les causes : problème de prix, de qualité, 
                de positionnement ? Décidez entre repositionnement ou arrêt.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                  Terrine porc
                </span>
                <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                  Rillettes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Matrix;
