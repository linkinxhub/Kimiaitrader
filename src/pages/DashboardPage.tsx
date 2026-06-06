import {
  AppPageFrame,
  DashboardStats,
  DataRefreshButton,
  MarketSnapshotRail,
  QuoteGrid,
  SignalGrid,
  SignalInsightList,
  SourceStatusGrid,
  WorkspaceHero,
  useWorkspaceData,
} from "@/pages/page-helpers";

export default function DashboardPage() {
  const { quotes, signals, loading, refresh, isDemo, sources } = useWorkspaceData();

  return (
    <AppPageFrame
      title="Dashboard"
      description="Une vue plus fluide du desk: actifs suivis, signaux, snapshots de marche et visibilite sur les sources live."
      action={<DataRefreshButton onClick={refresh} loading={loading} />}
    >
      <WorkspaceHero
        eyebrow={isDemo ? "Mode Demo" : "Live market room"}
        title="Un dashboard qui sert la decision, pas juste la decoration."
        description="Le nouvel ecran d'accueil fait remonter les signaux les plus exploitables, les flux de marche les plus utiles et l'etat des sources en un seul regard."
        quotes={quotes}
        signals={signals}
        loading={loading}
      />
      <DashboardStats quotes={quotes} signals={signals} isDemo={isDemo} />
      <MarketSnapshotRail quotes={quotes} />
      <SignalGrid signals={signals} />
      <SignalInsightList signals={signals.slice(0, 2)} />
      <QuoteGrid quotes={quotes} />
      <SourceStatusGrid sources={sources} />
    </AppPageFrame>
  );
}
