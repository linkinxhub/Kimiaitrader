import { useMemo, useState } from "react";
import { AppPageFrame, DataRefreshButton, SignalGrid, SignalInsightList, WorkspaceHero, useWorkspaceData } from "@/pages/page-helpers";
import { Card, Select } from "@/components/ui/primitives";

export default function SignalsPage() {
  const { quotes, signals, loading, refresh } = useWorkspaceData();
  const [market, setMarket] = useState<"all" | "crypto" | "forex" | "metal">("all");

  const filteredSignals = useMemo(
    () => (market === "all" ? signals : signals.filter((signal) => signal.market === market)),
    [market, signals],
  );

  return (
    <AppPageFrame
      title="Signals"
      description="Chaque signal garde sa logique complete: source, niveaux, ratio de risque et explications brutes."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <WorkspaceHero
        eyebrow="AI signals"
        title="Une salle de signaux plus lisible et plus exploitable."
        description="Filtrez les set-ups par marche, gardez les niveaux cles sous les yeux, et comparez rapidement conviction, risque et biais."
        quotes={quotes}
        signals={filteredSignals}
        loading={loading}
      />
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Filtrage des marches</p>
          <p className="mt-2 text-sm text-slate-400">Le moteur IA reste live, mais tu choisis ici quelle famille d'actifs mettre en avant.</p>
        </div>
        <div className="w-full md:w-[240px]">
          <Select value={market} onChange={(event) => setMarket(event.target.value as typeof market)}>
            <option value="all">Tous les marches</option>
            <option value="crypto">Crypto</option>
            <option value="forex">Forex</option>
            <option value="metal">Metal</option>
          </Select>
        </div>
      </Card>
      <SignalGrid signals={filteredSignals} />
      <SignalInsightList signals={filteredSignals.slice(0, 4)} />
    </AppPageFrame>
  );
}
