import { useState } from "react";
import { AppPageFrame, DataRefreshButton, useWorkspaceData } from "@/pages/page-helpers";
import { checkAlerts, createAlert, deleteAlert, getAlerts, getTriggeredAlerts } from "@/services/alertService";
import { useToast } from "@/hooks/useToast";
import { Button, Card, Input, Select } from "@/components/ui/primitives";

export default function PriceAlertsPage() {
  const { quotes, priceMap, refresh, loading } = useWorkspaceData();
  const { addToast } = useToast();
  const [asset, setAsset] = useState("BTCUSDT");
  const [condition, setCondition] = useState("ABOVE");
  const [targetPrice, setTargetPrice] = useState("70000");
  const [, rerender] = useState(0);

  const alerts = getAlerts();
  const history = getTriggeredAlerts();

  const addNewAlert = () => {
    createAlert({ asset, condition: condition as never, targetPrice: Number(targetPrice) });
    addToast("Alerte créée", "success");
    rerender((value) => value + 1);
  };

  const runCheck = () => {
    const triggered = checkAlerts(priceMap);
    if (triggered.length) {
      addToast(`${triggered.length} alerte(s) déclenchée(s)`, "warning");
      rerender((value) => value + 1);
    } else {
      addToast("Aucune alerte déclenchée", "info");
    }
  };

  return (
    <AppPageFrame
      title="Alertes de prix"
      description="Créez des seuils simples ABOVE / BELOW / EQUALS et vérifiez-les sur les prix courants."
      action={
        <div className="flex gap-3">
          <DataRefreshButton onClick={refresh} loading={loading} />
          <Button variant="secondary" onClick={runCheck}>Vérifier alertes</Button>
        </div>
      }
    >
      <Card className="grid gap-4 lg:grid-cols-4">
        <Select value={asset} onChange={(event) => setAsset(event.target.value)}>
          {quotes.map((quote) => (
            <option key={quote.symbol} value={quote.symbol}>{quote.label}</option>
          ))}
        </Select>
        <Select value={condition} onChange={(event) => setCondition(event.target.value)}>
          <option value="ABOVE">ABOVE</option>
          <option value="BELOW">BELOW</option>
          <option value="EQUALS">EQUALS</option>
        </Select>
        <Input value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} />
        <Button onClick={addNewAlert}>Ajouter</Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="font-display text-xl text-white">Alertes actives</h3>
          {alerts.length ? alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <span>{alert.asset} {alert.condition} {alert.targetPrice}</span>
              <Button variant="ghost" onClick={() => { deleteAlert(alert.id); rerender((value) => value + 1); }}>Supprimer</Button>
            </div>
          )) : <p className="text-sm text-slate-400">Aucune alerte active.</p>}
        </Card>
        <Card className="space-y-4">
          <h3 className="font-display text-xl text-white">Historique déclenché</h3>
          {history.length ? history.map((alert) => (
            <div key={alert.id + alert.triggeredAt} className="border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <p>{alert.asset} {alert.condition} {alert.targetPrice}</p>
              <p className="text-slate-500">Prix marché {alert.marketPrice}</p>
            </div>
          )) : <p className="text-sm text-slate-400">Aucune alerte déclenchée.</p>}
        </Card>
      </div>
    </AppPageFrame>
  );
}
