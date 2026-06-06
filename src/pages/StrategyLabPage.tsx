import { AppPageFrame } from "@/pages/page-helpers";
import { Badge, Card } from "@/components/ui/primitives";

const strategies = [
  { name: "London Reversal", winRate: "68%", rr: "2.1", status: "Validé" },
  { name: "Gold Breakout H1", winRate: "71%", rr: "2.8", status: "En test" },
  { name: "Crypto Trend Ride", winRate: "64%", rr: "3.0", status: "Scale-ready" },
];

export default function StrategyLabPage() {
  return (
    <AppPageFrame
      title="Strategy Lab"
      description="Espace d’expérimentation pour vos setups, avec observations de performance et préparation backtest."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <Card key={strategy.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-white">{strategy.name}</h3>
              <Badge>{strategy.status}</Badge>
            </div>
            <p className="text-sm text-slate-300">Win rate {strategy.winRate}</p>
            <p className="text-sm text-slate-400">Risk/Reward {strategy.rr}</p>
          </Card>
        ))}
      </div>
    </AppPageFrame>
  );
}
