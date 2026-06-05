import { useState } from "react";
import { AppPageFrame } from "@/pages/page-helpers";
import { formatCurrency } from "@/lib/format";
import { Card, Input } from "@/components/ui/primitives";

export default function SimulatorPage() {
  const [capital, setCapital] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopDistance, setStopDistance] = useState(120);
  const riskAmount = (capital * riskPercent) / 100;
  const positionSize = riskAmount / stopDistance;

  return (
    <AppPageFrame
      title="Simulateur de trading"
      description="Calculez rapidement le risque par trade, le montant exposé et la taille de position adaptée."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <Input type="number" value={capital} onChange={(event) => setCapital(Number(event.target.value))} />
          <Input type="number" value={riskPercent} onChange={(event) => setRiskPercent(Number(event.target.value))} />
          <Input type="number" value={stopDistance} onChange={(event) => setStopDistance(Number(event.target.value))} />
        </Card>
        <Card className="space-y-4 text-slate-300">
          <p>Capital: {formatCurrency(capital)}</p>
          <p>Risque max: {formatCurrency(riskAmount)}</p>
          <p>Taille de position estimée: {positionSize.toFixed(3)} lots/unité de risque</p>
        </Card>
      </div>
    </AppPageFrame>
  );
}
