import { getSiteUpdates } from "@/services/siteUpdatesService";
import { formatDate } from "@/lib/format";
import { PublicCtaStrip } from "@/pages/page-helpers";
import { Badge, Card } from "@/components/ui/primitives";

export default function UpdatesPage() {
  const updates = getSiteUpdates();

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-100">Roadmap vivante</Badge>
          <h1 className="font-display text-5xl">Nouveautés plateforme</h1>
          <p className="max-w-3xl text-slate-400">Les entrées ci-dessous sont gérées depuis l’admin panel et remontent automatiquement sur la vitrine.</p>
        </div>
        <div className="grid gap-4">
          {updates.map((update) => (
            <Card key={update.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-white">{update.title}</p>
                  <p className="text-sm text-slate-400">{formatDate(update.publishedAt)}</p>
                </div>
                <Badge>{update.category}</Badge>
              </div>
              <p className="text-slate-300">{update.description}</p>
            </Card>
          ))}
        </div>
        <PublicCtaStrip />
      </div>
    </div>
  );
}
