import { AppPageFrame, QuoteGrid, useWorkspaceData } from "@/pages/page-helpers";

export default function MultiAssetPage() {
  const { quotes } = useWorkspaceData();

  return (
    <AppPageFrame
      title="Multi-Asset"
      description="Comparatif côte à côte des actifs suivis pour repérer corrélations et divergences."
    >
      <QuoteGrid quotes={quotes} />
    </AppPageFrame>
  );
}
