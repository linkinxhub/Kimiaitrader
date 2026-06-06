import { AppPageFrame } from "@/pages/page-helpers";
import { Card } from "@/components/ui/primitives";

export default function SmartMoneyPage() {
  return (
    <AppPageFrame
      title="Smart Money Tracker"
      description="Lecture structurée des zones de liquidité, des déséquilibres et des confirmations institutionnelles."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {[
          ["Liquidity Sweep", "Repérez les prises de liquidité puis attendez la reprise de structure avant d’entrer."],
          ["Fair Value Gap", "Priorisez les retours dans déséquilibre avec confirmation sur timeframe inférieure."],
          ["Order Blocks", "Les zones propres et récentes restent les plus exploitables, surtout en confluence avec la macro session."],
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
