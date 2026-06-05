import { Download } from "lucide-react";
import { AppPageFrame, DataRefreshButton, SignalGrid, SignalInsightList, useWorkspaceData } from "@/pages/page-helpers";
import { exportSignalsListToPDF } from "@/services/pdfExportService";
import { Button } from "@/components/ui/primitives";

export default function SignalsPage() {
  const { signals, loading, refresh } = useWorkspaceData();

  return (
    <AppPageFrame
      title="Signaux IA"
      description="Signaux calculés via RSI, MACD, EMA et ATR, avec RR et niveau de risque."
      action={
        <div className="flex gap-3">
          <DataRefreshButton onClick={refresh} loading={loading} />
          <Button variant="secondary" onClick={() => exportSignalsListToPDF(signals)}>
            <Download className="mr-2 size-4" />
            Export PDF
          </Button>
        </div>
      }
    >
      <SignalGrid signals={signals} />
      <SignalInsightList signals={signals} />
    </AppPageFrame>
  );
}
