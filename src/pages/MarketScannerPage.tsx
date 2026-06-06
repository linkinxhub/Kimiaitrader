import { AppPageFrame, useWorkspaceData } from "@/pages/page-helpers";
import { Badge, Card } from "@/components/ui/primitives";

export default function MarketScannerPage() {
  const { quotes } = useWorkspaceData();

  return (
    <AppPageFrame
      title="Scanner de marché"
      description="Détection simple de breakout, retracement et trend based sur la variation récente."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {quotes.map((quote) => {
          const label = quote.change24h > 1 ? "Breakout" : quote.change24h < -1 ? "Pressure" : "Trend watch";
          return (
            <Card key={quote.symbol} className="flex items-center justify-between">
              <div>
                <p className="font-display text-xl text-white">{quote.label}</p>
                <p className="text-sm text-slate-400">{quote.source}</p>
              </div>
              <Badge>{label}</Badge>
            </Card>
          );
        })}
      </div>
    </AppPageFrame>
  );
}
