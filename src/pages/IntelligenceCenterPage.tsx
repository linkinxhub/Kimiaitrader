import { AppPageFrame, DataRefreshButton, MarketSnapshotRail, SourceStatusGrid, WorkspaceHero, useWorkspaceData } from "@/pages/page-helpers";
import { useSiteUpdates } from "@/hooks/useSiteUpdates";
import { Badge, Card } from "@/components/ui/primitives";

export default function IntelligenceCenterPage() {
  const { quotes, signals, loading, refresh, sources } = useWorkspaceData();
  const updates = useSiteUpdates();

  return (
    <AppPageFrame
      title="Intelligence Center"
      description="Le centre d'intelligence relie donnees live, regime de marche et flux de publication admin."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <WorkspaceHero
        eyebrow="Market intelligence"
        title="Un centre de marche qui connecte les flux, les signaux et les changements produit."
        description="L'utilisateur ne doit plus naviguer entre plusieurs surfaces pour comprendre ce qui bouge: les sources, les actifs et le flux d'updates sont rapproches."
        quotes={quotes}
        signals={signals}
        loading={loading}
      />
      <MarketSnapshotRail quotes={quotes} />
      <SourceStatusGrid sources={sources} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Updates publiees</p>
          <div className="space-y-3">
            {updates.slice(0, 4).map((update) => (
              <div key={update.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl tracking-[-0.04em] text-white">{update.title}</h3>
                  <Badge>{update.category}</Badge>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-400">{update.description}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Lecture du regime</p>
          <div className="grid gap-3">
            {quotes.slice(0, 4).map((quote) => (
              <div key={`${quote.symbol}-regime`} className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl tracking-[-0.04em] text-white">{quote.label}</p>
                  <span className={quote.change24h >= 0 ? "text-emerald-300" : "text-rose-300"}>{quote.change24h >= 0 ? "Momentum positif" : "Pression vendeuse"}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Source {quote.source}, variation {quote.change24h.toFixed(2)}%, marche {quote.market}.
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppPageFrame>
  );
}
