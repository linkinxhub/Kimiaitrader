import { AppPageFrame } from "@/pages/page-helpers";
import { Card } from "@/components/ui/primitives";

export default function TechnicalPage() {
  return (
    <AppPageFrame
      title="Analyse technique"
      description="Résumé opérationnel des indicateurs utilisés par le moteur de signaux."
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          ["RSI", "Mesure le momentum et les zones de surachat/survente."],
          ["MACD", "Capte le changement de vitesse directionnelle."],
          ["EMA", "Filtre la tendance récente et ses croisements."],
          ["ATR", "Adapte le stop au niveau de volatilité."],
        ].map(([title, text]) => (
          <Card key={title} className="space-y-3 text-slate-300">
            <h3 className="font-display text-xl text-white">{title}</h3>
            <p>{text}</p>
          </Card>
        ))}
      </div>
    </AppPageFrame>
  );
}
