import { useSiteUpdates } from "@/hooks/useSiteUpdates";
import { Badge, Card, SectionHeader } from "@/components/ui/primitives";

export default function UpdatesPage() {
  const updates = useSiteUpdates();

  return (
    <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      <SectionHeader
        title="Updates"
        description="Toutes les nouveautes publiques partent du meme flux que l'admin panel. Cela garde la vitrine alignee avec le vrai produit."
      />
      <div className="grid gap-4">
        {updates.map((update) => (
          <Card key={update.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-3xl tracking-[-0.05em] text-white">{update.title}</h2>
              <Badge>{update.category}</Badge>
            </div>
            <p className="text-sm leading-7 text-slate-400">{update.description}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{new Date(update.publishedAt).toLocaleString("fr-FR")}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
