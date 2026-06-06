import { useEffect, useState } from "react";
import type { PackAnalytics } from "@/types";
import { getAnalytics } from "@/services/packAnalyticsService";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Badge, Button, Card, SectionHeader } from "@/components/ui/primitives";

export function AdminPerformanceTab() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PackAnalytics[]>([]);

  const refresh = () => {
    getAnalytics(user).then(setAnalytics);
  };

  useEffect(() => {
    refresh();
  }, [user]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Performance par pack"
        description="Projection réaliste fusionnée avec les signaux enregistrés, trades journalisés et base utilisateurs."
        action={<Button variant="secondary" onClick={refresh}>Actualiser</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-4">
        {analytics.map((item) => (
          <Card key={item.pack} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-white">{item.pack}</h3>
              <Badge>{item.signals} signaux</Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p>Win rate: {formatPercent(item.winRate)}</p>
              <p>PnL: {formatCurrency(item.pnl)}</p>
              <p>Trades: {item.trades}</p>
              <p>Engagement: {item.engagement}%</p>
            </div>
            <div className="flex items-end gap-2">
              {item.trends7d.map((value, index) => (
                <div key={`${item.pack}-${index}`} className="flex-1 rounded-full bg-blue-500/25" style={{ height: `${Math.max(10, value)}px` }} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
