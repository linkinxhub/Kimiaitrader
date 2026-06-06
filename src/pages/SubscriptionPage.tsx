import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { AppPageFrame, PricingSummary, PublicCtaStrip } from "@/pages/page-helpers";
import { Card } from "@/components/ui/primitives";

export default function SubscriptionPage() {
  const settings = usePlatformSettings();

  return (
    <AppPageFrame
      title="Subscription"
      description="Cette page clarifie les differences de packs et reprend la meme grille tarifaire que la vitrine publique."
    >
      <Card className="space-y-3">
        <p className="font-display text-3xl tracking-[-0.05em] text-white">Packs harmonises</p>
        <p className="text-sm leading-7 text-slate-400">
          Free sert de point d'entree, Pro ouvre les flux live premium, Expert ajoute l'IA avancée et Institutional etend la couche business et admin.
        </p>
      </Card>
      <PricingSummary prices={settings.packPrices} yearlyPrices={settings.packPricesYearly} />
      <PublicCtaStrip />
    </AppPageFrame>
  );
}
