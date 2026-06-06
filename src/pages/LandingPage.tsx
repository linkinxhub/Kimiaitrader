import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BellRing, Bot, CandlestickChart, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { getVerifiedFeedback } from "@/services/feedbackService";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useSiteUpdates } from "@/hooks/useSiteUpdates";
import {
  MarketingMetricStrip,
  PricingSummary,
  PublicCtaStrip,
  QuoteGrid,
  SourceStatusGrid,
  WorkspaceHero,
  useWorkspaceData,
} from "@/pages/page-helpers";
import { Badge, Button, Card, SectionHeader } from "@/components/ui/primitives";

const featureList = [
  {
    icon: CandlestickChart,
    title: "Flux live multi-marche",
    description: "Crypto via Binance et CoinGecko, forex via Frankfurter, et or via Currency API avec fallback automatique.",
  },
  {
    icon: Sparkles,
    title: "Signaux IA lisibles",
    description: "Chaque signal expose entry, stop, take profits, niveau de risque, et une explication exploitable.",
  },
  {
    icon: BellRing,
    title: "Discipline d'execution",
    description: "Alertes, journal et suivi de positions travaillent ensemble pour eviter les decisions improvisees.",
  },
  {
    icon: Bot,
    title: "Stack evolutive",
    description: "Le socle reste statique et deployable partout, mais la couche produit garde un comportement tres operationnel.",
  },
];

export default function LandingPage() {
  const settings = usePlatformSettings();
  const updates = useSiteUpdates();
  const feedback = getVerifiedFeedback().slice(0, 4);
  const { quotes, signals, sources, loading } = useWorkspaceData();

  return (
    <div className="mx-auto max-w-[1380px] space-y-8 px-4 py-6 md:px-6 md:py-8">
      <header className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.88),rgba(7,17,29,0.65))] px-6 py-5 shadow-[0_24px_80px_rgba(2,6,23,0.34)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="font-display text-[30px] tracking-[-0.05em] text-white">{settings.platformName}</p>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">{settings.slogan}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Link to="/updates" className="transition hover:text-white">
              Updates
            </Link>
            <Link to="/login" className="transition hover:text-white">
              Login
            </Link>
            <Link to="/register">
              <Button>
                {settings.primaryCtaLabel}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <WorkspaceHero
        title={settings.heroTitle}
        description={settings.heroDescription}
        quotes={quotes}
        signals={signals}
        loading={loading}
      />

      <MarketingMetricStrip />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <SectionHeader
            title="Une vitrine qui montre le produit, pas une promesse vide"
            description="Le site public expose vraiment les flux suivis, la logique de packs, les mises a jour, et une lecture claire de l'outil."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {featureList.map((feature) => (
              <div key={feature.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <feature.icon className="size-5 text-[#6fe7dd]" />
                <h3 className="mt-4 font-display text-2xl tracking-[-0.04em] text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <SectionHeader
            title="Packs pilotables"
            description="Les prix et messages publics sont harmonises avec le panneau admin pour eviter les incoherences."
          />
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#6fe7dd]/18 bg-[linear-gradient(135deg,rgba(111,231,221,0.12),rgba(59,130,246,0.06))] p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Pack actif cote vitrine</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">Free, Pro, Expert, Institutional</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Meme source de verite entre la page publique, la facturation, et l'admin.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                <p className="text-sm text-slate-500">Donnees live</p>
                <p className="mt-2 font-display text-3xl text-white">Oui</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                <p className="text-sm text-slate-500">Deploiement</p>
                <p className="mt-2 font-display text-3xl text-white">Statique</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Sources de donnees visibles"
          description="La nouvelle experience garde les libelles de source et les fallbacks explicites, pour que l'utilisateur sache toujours d'ou vient l'information."
        />
        <SourceStatusGrid sources={sources} />
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Lecture rapide du marche"
          description="Quelques actifs live suffisent a faire comprendre la profondeur produit, sans forcer l'utilisateur a se connecter."
        />
        <QuoteGrid quotes={quotes.slice(0, 6)} />
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Abonnements"
          description="Chaque pack garde sa logique, mais la presentation est plus claire et les prix sont synchronises depuis l'admin."
        />
        <PricingSummary prices={settings.packPrices} yearlyPrices={settings.packPricesYearly} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <SectionHeader
            title="Mises a jour publiees"
            description="Le flux public est directement alimente par le panneau admin."
          />
          <div className="space-y-3">
            {updates.slice(0, 4).map((update) => (
              <div key={update.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl tracking-[-0.04em] text-white">{update.title}</h3>
                  <Badge>{update.category}</Badge>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-400">{update.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <SectionHeader
            title="Temoignages verifies"
            description="Le discours commercial reste ancre dans des resultats et des retours d'usage."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {feedback.map((entry) => (
              <div key={entry.id} className="rounded-[24px] border border-white/8 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl tracking-[-0.04em] text-white">{entry.userName}</p>
                  <Badge>{entry.pack}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{entry.comment}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-400">
                  <p>WR {entry.results.winRate}%</p>
                  <p>PnL {entry.results.pnl} EUR</p>
                  <p>Rating {entry.rating}/5</p>
                  <p>Periode {entry.results.period}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="Concu pour rester fluide"
            description="Le shell, les composants et les ecrans cles ont ete reconstruits pour une lecture plus immediate et un rendu plus haut de gamme."
          />
        </Card>
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Workflow valide</p>
            <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">Vitrine + Produit + Admin</p>
          </div>
          <Wallet className="size-6 text-[#6fe7dd]" />
        </Card>
      </section>

      <PublicCtaStrip />
    </div>
  );
}
