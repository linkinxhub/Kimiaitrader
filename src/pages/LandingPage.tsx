import { motion } from "framer-motion";
import { CheckCircle2, Layers3, ShieldCheck, Sparkles, TrendingUp, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { getVerifiedFeedback, getAverageRating } from "@/services/feedbackService";
import { getPlatformSettings } from "@/services/platformSettingsService";
import { getSiteUpdates } from "@/services/siteUpdatesService";
import { getSourcesStatus } from "@/services/marketApi";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PublicCtaStrip } from "@/pages/page-helpers";
import { Badge, Button, Card } from "@/components/ui/primitives";

export default function LandingPage() {
  const settings = getPlatformSettings();
  const feedback = getVerifiedFeedback();
  const updates = getSiteUpdates().slice(0, 3);
  const sources = getSourcesStatus(false);
  const averageRating = getAverageRating();

  return (
    <div className="min-h-screen bg-hero-grid text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-semibold">{settings.platformName}</p>
            <p className="text-sm text-slate-400">{settings.slogan}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/updates" className="text-sm text-slate-300">Updates</Link>
            <Link to="/login"><Button variant="secondary">Connexion</Button></Link>
            <Link to="/register"><Button>Essai immédiat</Button></Link>
          </div>
        </header>

        <section className="grid gap-10 py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-100">Realtime AI Signals</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight md:text-6xl">
                Trading assisté par IA, packs live, et cockpit admin dans une seule plateforme statique.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                XTrendAI Pro connecte signaux IA, radar multi-actifs, XAU/USD premium, alertes, journal de trading et administration business sans backend.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"><Button>Créer mon compte</Button></Link>
              <Link to="/login"><Button variant="secondary">Tester les comptes démo</Button></Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Signaux mensuels", value: "312+" },
                { label: "Note vérifiée", value: `${averageRating.toFixed(1)}/5` },
                { label: "Pack Pro", value: formatCurrency(settings.packPrices.pro) },
              ].map((stat) => (
                <motion.div key={stat.label} animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-3 font-display text-3xl text-white">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <Card className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl text-white">Vue cockpit</p>
                <p className="text-sm text-slate-400">Signals, risk, pricing, packs</p>
              </div>
              <Badge className="border-emerald-400/20 text-emerald-200">LIVE</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "BTC/USD", move: "+1.92%", tone: "text-emerald-200" },
                { title: "XAU/USD", move: "+0.48%", tone: "text-emerald-200" },
                { title: "EUR/USD", move: "-0.15%", tone: "text-red-200" },
                { title: "Signal IA", move: "ACHAT 78%", tone: "text-blue-200" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">{item.title}</p>
                  <p className={`mt-2 font-display text-2xl ${item.tone}`}>{item.move}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-slate-100">
              Super Admin: toujours en LIVE, même hors pack utilisateur classique.
            </div>
          </Card>
        </section>

        <section className="space-y-5 py-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl">Sources de données</h2>
              <p className="text-slate-400">Fallbacks actifs pour ne jamais laisser la plateforme vide.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sources.map((source) => (
              <Card key={source.name}>
                <p className="font-display text-lg text-white">{source.name}</p>
                <p className="mt-2 text-sm text-slate-400">Latence {source.latency}</p>
                <Badge className="mt-4 border-slate-700">{source.status}</Badge>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-10 md:grid-cols-2 xl:grid-cols-5">
          {[
            { icon: Webhook, title: "WebSockets", text: "Flux Binance temps réel sous 200ms." },
            { icon: Sparkles, title: "IA LLM", text: "Assistant Expert avec contexte marché injecté." },
            { icon: TrendingUp, title: "Signaux", text: "Entrée, SL, TP, RR et explications naturelles." },
            { icon: Layers3, title: "Scanner", text: "Breakout, trend, multi-actifs, opportunités." },
            { icon: ShieldCheck, title: "Sécurité", text: "PIN admin, lockout, 2FA, OTP, sessions." },
          ].map((feature) => (
            <Card key={feature.title} className="space-y-3">
              <feature.icon className="size-5 text-blue-300" />
              <p className="font-display text-lg text-white">{feature.title}</p>
              <p className="text-sm text-slate-400">{feature.text}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 py-10 lg:grid-cols-4">
          {[
            { name: "Free", price: settings.packPrices.free, accent: "text-slate-200", features: ["Dashboard", "Signaux IA", "Journal", "Démo fixe"] },
            { name: "Pro", price: settings.packPrices.pro, accent: "text-amber-200", features: ["XAU/USD", "Radar", "Simulator", "LIVE APIs"] },
            { name: "Expert", price: settings.packPrices.expert, accent: "text-violet-200", features: ["Smart Money", "Assistant IA", "Strategy Lab", "Export MT4/5"] },
            { name: "Institutionnel", price: settings.packPrices.institutional, accent: "text-rose-200", features: ["API Center", "Multi-comptes", "White Label", "Support 24/7"] },
          ].map((pack) => (
            <Card key={pack.name} className="space-y-4">
              <p className={`font-display text-2xl ${pack.accent}`}>{pack.name}</p>
              <p className="font-display text-4xl text-white">{formatCurrency(pack.price)}</p>
              <div className="space-y-2 text-sm text-slate-300">
                {pack.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" />{feature}</p>
                ))}
              </div>
            </Card>
          ))}
        </section>

        <section className="space-y-6 py-10">
          <div>
            <h2 className="font-display text-3xl">Témoignages vérifiés</h2>
            <p className="text-slate-400">Résultats réels déclarés par les utilisateurs par pack.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {feedback.map((item) => (
              <Card key={item.id} className="space-y-3">
                <p className="font-display text-lg text-white">{item.userName}</p>
                <p className="text-sm text-slate-300">{item.comment}</p>
                <p className="text-sm text-slate-400">WR {formatPercent(item.results.winRate)} • PnL {formatCurrency(item.results.pnl)}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4 py-10">
          <div>
            <h2 className="font-display text-3xl">FAQ & updates</h2>
            <p className="text-slate-400">Les dernières évolutions du produit pilotées par l’admin panel.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {updates.map((item) => (
              <Card key={item.id} className="space-y-3">
                <Badge>{item.category}</Badge>
                <p className="font-display text-xl text-white">{item.title}</p>
                <p className="text-sm text-slate-400">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <PublicCtaStrip />
      </div>
    </div>
  );
}
