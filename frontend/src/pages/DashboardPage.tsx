import { AppPageFrame, DashboardStats, DataRefreshButton, QuoteGrid, SignalGrid, SignalInsightList, useWorkspaceData } from "@/pages/page-helpers";
import { Card } from "@/components/ui/primitives";

export default function DashboardPage() {
  const { quotes, signals, loading, refresh, isDemo } = useWorkspaceData();

  return (
    <AppPageFrame
      title="Dashboard"
      description="Vue globale des signaux IA, marchés suivis, risque et opportunités principales."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <DashboardStats quotes={quotes} signals={signals} isDemo={isDemo} />
      <SignalGrid signals={signals} />
      <QuoteGrid quotes={quotes} />
      <SignalInsightList signals={signals.slice(0, 2)} />
      <Card className="text-sm text-slate-300">
        Gestion du risque recommandée: limiter l'exposition à 1-2% par idée, confirmer les entrées par structure, et éviter l'empilement de corrélations.
      </Card>
    </AppPageFrame>
  );
}
