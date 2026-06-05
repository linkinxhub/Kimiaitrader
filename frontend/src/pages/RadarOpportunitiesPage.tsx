import { AppPageFrame, DataRefreshButton, useWorkspaceData } from "@/pages/page-helpers";
import { Badge, Card } from "@/components/ui/primitives";

export default function RadarOpportunitiesPage() {
  const { quotes, loading, refresh } = useWorkspaceData();
  const rankedQuotes = [...quotes].sort((left, right) => Math.abs(right.change24h) - Math.abs(left.change24h));

  return (
    <AppPageFrame
      title="Radar d'opportunités"
      description="Classement automatique des actifs les plus dynamiques, pour prioriser l’attention et le timing."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {rankedQuotes.map((quote, index) => (
          <Card key={quote.symbol} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl text-white">{index + 1}. {quote.label}</p>
              <p className="text-sm text-slate-400">{quote.source} • {quote.market}</p>
            </div>
            <Badge className={quote.change24h >= 0 ? "border-emerald-400/20 text-emerald-200" : "border-red-400/20 text-red-200"}>
              {quote.change24h.toFixed(2)}%
            </Badge>
          </Card>
        ))}
      </div>
    </AppPageFrame>
  );
}
