import { useState } from "react";
import { AppPageFrame } from "@/pages/page-helpers";
import { Card, Input } from "@/components/ui/primitives";

export default function RiskPage() {
  const [accountSize, setAccountSize] = useState(25000);
  const [riskPercent, setRiskPercent] = useState(1.5);
  const [openTrades, setOpenTrades] = useState(3);
  const totalRisk = accountSize * (riskPercent / 100) * openTrades;

  return (
    <AppPageFrame
      title="Gestion du risque"
      description="Gardez une vue nette sur l’exposition totale et la discipline de portefeuille."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <Input type="number" value={accountSize} onChange={(event) => setAccountSize(Number(event.target.value))} />
          <Input type="number" value={riskPercent} onChange={(event) => setRiskPercent(Number(event.target.value))} />
          <Input type="number" value={openTrades} onChange={(event) => setOpenTrades(Number(event.target.value))} />
        </Card>
        <Card className="space-y-3 text-slate-300">
          <p>Exposition cumulée: {totalRisk.toFixed(2)} EUR</p>
          <p>Règle proposée: plafonner sous 5% si corrélations fortes.</p>
          <p>Astuce: combinez scanner + journal + alertes pour éviter la suractivité.</p>
        </Card>
      </div>
    </AppPageFrame>
  );
}
