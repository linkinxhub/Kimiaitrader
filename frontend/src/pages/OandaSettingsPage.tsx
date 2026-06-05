import { useState } from "react";
import { AppPageFrame } from "@/pages/page-helpers";
import { getOandaConfig, saveOandaConfig, testOandaConnection } from "@/services/oandaService";
import { useToast } from "@/hooks/useToast";
import { Button, Card, Input, Select } from "@/components/ui/primitives";

export default function OandaSettingsPage() {
  const { addToast } = useToast();
  const [config, setConfig] = useState(getOandaConfig());

  return (
    <AppPageFrame
      title="Configuration OANDA"
      description="Préparez la connexion broker pratique ou live sans exposer de clé dans le code."
      action={
        <Button
          onClick={async () => {
            const result = await testOandaConnection(config);
            addToast(result.message, result.ok ? "success" : "error");
          }}
        >
          Tester la connexion
        </Button>
      }
    >
      <Card className="grid gap-4 lg:grid-cols-3">
        <Input value={config.apiKey} onChange={(event) => setConfig((current) => ({ ...current, apiKey: event.target.value }))} placeholder="Clé API" />
        <Input value={config.accountId} onChange={(event) => setConfig((current) => ({ ...current, accountId: event.target.value }))} placeholder="Account ID" />
        <Select value={config.environment} onChange={(event) => setConfig((current) => ({ ...current, environment: event.target.value as "practice" | "live" }))}>
          <option value="practice">Practice</option>
          <option value="live">Live</option>
        </Select>
        <Button className="lg:col-span-3" variant="secondary" onClick={() => { saveOandaConfig(config); addToast("Configuration OANDA enregistrée", "success"); }}>
          Sauvegarder
        </Button>
      </Card>
    </AppPageFrame>
  );
}
