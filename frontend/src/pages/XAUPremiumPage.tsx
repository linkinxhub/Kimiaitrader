import { AppPageFrame, DataRefreshButton, useWorkspaceData } from "@/pages/page-helpers";
import { Card, StatCard } from "@/components/ui/primitives";
import { formatNumber } from "@/lib/format";

export default function XAUPremiumPage() {
  const { quotes, loading, refresh } = useWorkspaceData();
  const gold = quotes.find((quote) => quote.symbol === "XAUUSD");

  return (
    <AppPageFrame
      title="XAU/USD Premium"
      description="Flux dédié à l’or avec lecture de volatilité, biais court terme et scénarios premium."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Prix spot" value={gold ? formatNumber(gold.price, 2) : "--"} />
        <StatCard label="Variation 24h" value={gold ? `${gold.change24h.toFixed(2)}%` : "--"} tone={gold && gold.change24h >= 0 ? "text-emerald-300" : "text-red-300"} />
        <StatCard label="Source" value={gold?.source ?? "--"} helper="Fallback automatique actif" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 text-slate-300">
          <h3 className="font-display text-xl text-white">Scénario haussier</h3>
          <p>Maintien au-dessus du pivot intraday avec extension progressive vers les zones de liquidité supérieures.</p>
          <p>Trigger: bougie de continuation H1 + reprise du momentum USD réel.</p>
        </Card>
        <Card className="space-y-3 text-slate-300">
          <h3 className="font-display text-xl text-white">Scénario défensif</h3>
          <p>Retour sous le pivot et absorption de la demande: privilégier la patience avant rechargement.</p>
          <p>Trigger: cassure ratée et divergence momentum sur la session US.</p>
        </Card>
      </div>
    </AppPageFrame>
  );
}
