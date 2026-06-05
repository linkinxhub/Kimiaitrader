import { useState } from "react";
import { AppPageFrame, useWorkspaceData } from "@/pages/page-helpers";
import { Button, Card, Textarea } from "@/components/ui/primitives";

export default function MTExportPage() {
  const { signals } = useWorkspaceData();
  const [output, setOutput] = useState("");

  const exportJson = () => setOutput(JSON.stringify(signals, null, 2));
  const exportCsv = () =>
    setOutput(["asset,direction,entry,stop,tp1,tp2,tp3", ...signals.map((signal) => `${signal.asset},${signal.direction},${signal.entryPoint},${signal.stopLoss},${signal.takeProfits.join(",")}`)].join("\n"));
  const exportMql = () =>
    setOutput(signals.map((signal) => `// ${signal.asset}\ninput double Entry_${signal.asset.replace(/[^\w]/g, "")}=${signal.entryPoint};`).join("\n\n"));

  return (
    <AppPageFrame
      title="Export MT4 / MT5"
      description="Préparez un export rapide au format JSON, CSV ou snippets MQL4/5."
      action={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportJson}>JSON</Button>
          <Button variant="secondary" onClick={exportCsv}>CSV</Button>
          <Button onClick={exportMql}>MQL4/5</Button>
        </div>
      }
    >
      <Card>
        <Textarea value={output} readOnly className="min-h-[360px]" placeholder="Choisissez un format d'export..." />
      </Card>
    </AppPageFrame>
  );
}
