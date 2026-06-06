import { AppPageFrame } from "@/pages/page-helpers";
import { getSourcesStatus } from "@/services/marketApi";
import { getActivityLogs } from "@/services/activityLogService";
import { Badge, Card } from "@/components/ui/primitives";

export default function ApiCenterPage() {
  const sources = getSourcesStatus(false);
  const logs = getActivityLogs().slice(0, 8);

  return (
    <AppPageFrame
      title="API Center"
      description="Monitoring simple des fournisseurs de données et revue rapide des journaux d’activité."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="font-display text-xl text-white">Sources</h3>
          {sources.map((source) => (
            <div key={source.name} className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <span>{source.name} • {source.latency}</span>
              <Badge>{source.status}</Badge>
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <h3 className="font-display text-xl text-white">Journal</h3>
          {logs.map((log) => (
            <div key={log.id} className="border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <p className="text-white">{log.action}</p>
              <p className="text-slate-500">{log.actorEmail} • {log.ip}</p>
            </div>
          ))}
        </Card>
      </div>
    </AppPageFrame>
  );
}
