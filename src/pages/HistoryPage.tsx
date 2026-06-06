import { AppPageFrame } from "@/pages/page-helpers";
import { getSignalRecords } from "@/services/packAnalyticsService";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/primitives";

export default function HistoryPage() {
  const records = getSignalRecords();

  return (
    <AppPageFrame
      title="Historique des signaux"
      description="Trace des signaux générés et utilisés pour les statistiques par pack."
    >
      <div className="grid gap-4">
        {records.length ? records.map((record) => (
          <Card key={record.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-lg text-white">{record.asset}</p>
              <p className="text-sm text-slate-400">{formatDate(record.createdAt)}</p>
            </div>
            <p className="text-sm text-slate-300">{record.direction} • confiance {record.confidence}%</p>
          </Card>
        )) : <Card className="text-slate-400">Aucun historique enregistré pour l’instant.</Card>}
      </div>
    </AppPageFrame>
  );
}
