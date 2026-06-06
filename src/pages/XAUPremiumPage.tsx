import { AppPageFrame, DataRefreshButton, QuoteGrid, SignalInsightList, WorkspaceHero, useWorkspaceData } from "@/pages/page-helpers";
import { Card, StatCard } from "@/components/ui/primitives";
import { formatNumber } from "@/lib/format";

export default function XAUPremiumPage() {
  const { quotes, signals, loading, refresh } = useWorkspaceData();
  const goldQuote = quotes.find((quote) => quote.symbol === "XAUUSD") ?? quotes[0];
  const goldSignal = signals.find((signal) => signal.asset === "XAU/USD") ?? signals[0];

  return (
    <AppPageFrame
      title="Gold Room"
      description="Un espace premium dedie au XAU/USD, avec lecture live, niveaux IA et scenario d'execution plus clair."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <WorkspaceHero
        eyebrow="XAU/USD premium"
        title="Le bureau or est traite comme une salle de marche a part entiere."
        description="Prix live, scenario principal, lecture de volatilite et contexte operationnel sont regroupes dans une presentation plus nette."
        quotes={goldQuote ? [goldQuote, ...quotes.filter((quote) => quote.symbol !== goldQuote.symbol)] : quotes}
        signals={goldSignal ? [goldSignal, ...signals.filter((signal) => signal.id !== goldSignal.id)] : signals}
        loading={loading}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Spot live" value={goldQuote ? formatNumber(goldQuote.price, 2) : "--"} helper="Source gold active" />
        <StatCard label="Bias" value={goldSignal?.direction ?? "ATTENTE"} helper={`Confidence ${goldSignal?.confidence ?? 0}%`} />
        <StatCard label="RR max" value={goldSignal ? goldSignal.riskRewardRatio.toFixed(2) : "--"} helper={goldSignal?.riskLevel ?? "Pending"} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Execution plan</p>
          <h3 className="font-display text-3xl tracking-[-0.05em] text-white">{goldSignal?.asset ?? "XAU/USD"}</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Entry {goldSignal ? formatNumber(goldSignal.entryPoint, 2) : "--"}</p>
            <p>Stop {goldSignal ? formatNumber(goldSignal.stopLoss, 2) : "--"}</p>
            <p>Take profits {goldSignal?.takeProfits.map((value) => formatNumber(value, 2)).join(" / ") ?? "--"}</p>
          </div>
        </Card>
        <SignalInsightList signals={goldSignal ? [goldSignal] : []} />
      </div>
      <QuoteGrid quotes={goldQuote ? [goldQuote] : []} />
    </AppPageFrame>
  );
}
