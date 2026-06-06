import { getSiteUpdates } from "@/services/siteUpdatesService";
import { getSourcesStatus } from "@/services/marketApi";
import { AppPageFrame } from "@/pages/page-helpers";
import { Badge, Card } from "@/components/ui/primitives";

export default function IntelligenceCenterPage() {
  const updates = getSiteUpdates();
  const sources = getSourcesStatus(false);

  return (
    <AppPageFrame
      title="Intelligence Center"
      description="Centre de synthèse entre nouvelles de la plateforme, qualité des flux et points d’attention marché."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="font-display text-xl text-white">Sources & statut</h3>
          {sources.map((source) => (
            <div key={source.name} className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <span>{source.name}</span>
              <Badge>{source.status}</Badge>
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <h3 className="font-display text-xl text-white">Fil d'updates</h3>
          {updates.map((update) => (
            <div key={update.id} className="border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <p className="font-medium text-white">{update.title}</p>
              <p className="mt-1">{update.description}</p>
            </div>
          ))}
        </Card>
      </div>
    </AppPageFrame>
  );
}
