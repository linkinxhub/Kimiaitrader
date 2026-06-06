import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Crown,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { BrandMark } from "@/components/BrandMark";
import { SectionHeading } from "@/components/SectionHeading";
import { featureCards, landingHighlights, landingQuickBadges, plans, trustedStats } from "@/data/platform";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import { formatCurrency, formatMarketPrice } from "@/lib/formatters";
import type { MarketSnapshot } from "@/types/audit";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);
  const heroAssets = (snapshot.data?.assets ?? []).slice(0, 6);
  const gold = snapshot.data?.assets.find((asset) => asset.code === "XAU/USD") ?? null;

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <header className="landing-nav">
          <BrandMark />
          <nav className="landing-nav__links">
            <a href="#platform">Platform</a>
            <a href="#markets">Markets</a>
            <a href="#pricing">Pricing</a>
            <a href="#resources">Resources</a>
            <a href="#company">Company</a>
          </nav>
          <div className="landing-nav__actions">
            <button className="ghost-button">Log in</button>
            <Link className="primary-button" to="/dashboard">
              Start Free
            </Link>
          </div>
        </header>

        <div className="landing-hero__content">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }} className="landing-hero__copy">
            <h1>Professional trading SaaS starts with real data, not demo illusions.</h1>
            <p>
              XTrendAI Pro now exposes provider health, live market provenance, pack compliance, and payment readiness
              so every premium promise can be audited before it is sold.
            </p>
            <div className="landing-hero__cta">
              <Link className="primary-button" to="/dashboard">
                Open Audit Dashboard
              </Link>
              <Link className="secondary-button" to="/admin">
                Open API Center
              </Link>
            </div>
            <div className="landing-badge-row">
              {landingQuickBadges.map(({ label, icon: Icon }) => (
                <span key={label} className="landing-badge">
                  <Icon size={15} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="hero-device"
          >
            <div className="hero-device__topbar">
              <span>Live market provenance</span>
              <div className="hero-device__dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="hero-device__body">
              <div className="hero-device__chart">
                <div className="chart-caption">
                  <span>XAU/USD</span>
                  <strong>{gold?.source ?? "Loading"}</strong>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={snapshot.data?.charts["XAU/USD"] ?? []}>
                    <defs>
                      <linearGradient id="heroArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 11 }} />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Area type="monotone" dataKey="price" stroke="#4ade80" strokeWidth={2.5} fill="url(#heroArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="hero-device__signal">
                <span>Fallback chain</span>
                <strong>{snapshot.data?.providerChain.length ?? 0} tiers</strong>
                <div className="signal-ring">
                  <div className="signal-ring__inner">
                    <small>{heroAssets.length || 0}/14</small>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Quality</dt>
                    <dd>{gold?.quality ?? "pending"}</dd>
                  </div>
                  <div>
                    <dt>Goal</dt>
                    <dd>No blank markets</dd>
                  </div>
                </dl>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="hero-market-strip">
          {heroAssets.length ? (
            heroAssets.map((item) => (
              <div className="hero-market-card" key={item.code}>
                <span>{item.code}</span>
                <strong>{formatMarketPrice(item.price, item.code)}</strong>
                <em className={(item.changePercent ?? 0) >= 0 ? "is-up" : "is-down"}>
                  {item.changePercent == null ? item.source : `${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%`}
                </em>
              </div>
            ))
          ) : (
            <div className="hero-market-card">
              <span>Live market board</span>
              <strong>{snapshot.isLoading ? "Loading..." : "Unavailable locally"}</strong>
              <em className="is-down">{snapshot.error ?? "Awaiting serverless response"}</em>
            </div>
          )}
        </div>
      </section>

      <section className="trust-band">
        <div className="trust-band__headline">
          <ShieldCheck size={20} />
          <div>
            <strong>Built for professionalization, not just presentation.</strong>
            <p>The platform now exposes what is real, what is missing, and what still blocks SaaS-grade operations.</p>
          </div>
        </div>
        <div className="trust-band__stats">
          {trustedStats.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-grid" id="platform">
        {featureCards.map(({ title, description, icon: Icon }) => (
          <article className="feature-card" key={title}>
            <div className="feature-card__icon">
              <Icon size={18} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="analysis-section" id="markets">
        <div className="analysis-section__copy">
          <SectionHeading
            title="Audit-first market intelligence"
            description="Before scaling signals, subscriptions, and automation, the platform must prove source quality, provider redundancy, and update freshness."
          />
          <ul className="check-list">
            {landingHighlights.map((item) => (
              <li key={item}>
                <CheckCircle2 size={18} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="analysis-panel">
          <div className="analysis-panel__tabs">
            {(snapshot.data?.providerChain ?? ["Twelve Data", "Finnhub", "Alpha Vantage", "Yahoo Finance"]).map((item, index) => (
              <button key={item} className={index === 0 ? "is-active" : ""}>
                {item}
              </button>
            ))}
          </div>
          <div className="analysis-panel__body">
            <div className="analysis-panel__chart">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={snapshot.data?.charts["EUR/USD"] ?? []}>
                  <defs>
                    <linearGradient id="analysisArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#73859e", fontSize: 11 }} />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Area type="monotone" dataKey="price" stroke="#60a5fa" strokeWidth={2.4} fill="url(#analysisArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="confidence-card">
              <strong>Current stance</strong>
              <div className="confidence-card__ring">Live</div>
              <dl>
                <div>
                  <dt>Board status</dt>
                  <dd>{snapshot.data?.assets.length ? "Operational" : "Pending"}</dd>
                </div>
                <div>
                  <dt>Refresh model</dt>
                  <dd>Serverless polling</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="gold-section">
        <div className="gold-section__visual">
          <div className="gold-section__card">
            <span className="tag-pill">XAU/USD</span>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={snapshot.data?.charts["XAU/USD"] ?? []}>
                <defs>
                  <linearGradient id="goldArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#73859e", fontSize: 11 }} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2.4} fill="url(#goldArea)" />
              </AreaChart>
            </ResponsiveContainer>
            <ul className="mini-list">
              <li>Source: {gold?.source ?? "pending"}</li>
              <li>Quality: {gold?.quality ?? "pending"}</li>
              <li>Updated: {gold?.asOf ?? "pending"}</li>
              <li>Fallback aware</li>
            </ul>
          </div>
        </div>
        <div className="gold-section__copy">
          <SectionHeading
            title="Institutional Gold Module"
            description="The gold surface now highlights real provenance first. Premium strategy logic can only come after secure backend execution and persistence."
          />
          <div className="icon-stat-row">
            <div>
              <Crown size={18} />
              <span>Live source visibility</span>
            </div>
            <div>
              <Activity size={18} />
              <span>Fallback awareness</span>
            </div>
            <div>
              <Sparkles size={18} />
              <span>Quality surfacing</span>
            </div>
            <div>
              <Star size={18} />
              <span>Operational honesty</span>
            </div>
          </div>
        </div>
      </section>

      <section className="risk-section">
        <div className="risk-section__copy">
          <SectionHeading
            title="Readiness before monetization"
            description="A professional SaaS should not sell broken flows. Payment health, pack compliance, and provider configuration now sit in the operating story."
          />
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} />
              Provider status is visible from the admin API Center
            </li>
            <li>
              <CheckCircle2 size={18} />
              Pack inconsistencies are surfaced instead of hidden in marketing copy
            </li>
            <li>
              <CheckCircle2 size={18} />
              Payment providers are audited for missing configuration
            </li>
            <li>
              <CheckCircle2 size={18} />
              Fake performance and fictional signal claims are being removed
            </li>
          </ul>
        </div>
        <div className="risk-overview-grid">
          <article>
            <span>Frontend status</span>
            <strong>Rebuilt</strong>
            <small>Premium UI with audit-first flows</small>
          </article>
          <article>
            <span>Data layer</span>
            <strong>Live</strong>
            <small>Fallback chain visible</small>
          </article>
          <article>
            <span>Payments</span>
            <strong>Audit only</strong>
            <small>Real checkout still incomplete</small>
          </article>
          <article>
            <span>Backend</span>
            <strong>Blocked</strong>
            <small>Laravel snapshot incomplete</small>
          </article>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <SectionHeading
          title="Pack structure under review"
          description="The commercial offer is now aligned to FREE, PRO, EXPERT, and INSTITUTIONNEL with euro-denominated pricing and explicit entitlement auditing."
        />
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`pricing-card${plan.featured ? " is-featured" : ""}`}>
              <div className="pricing-card__header">
                <div>
                  <h3>{plan.name}</h3>
                  <strong>{plan.priceLabel ?? formatCurrency(plan.price)}</strong>
                  <span>{plan.price == null ? "" : "/month"}</span>
                </div>
                {plan.featured ? <span className="featured-pill">Current Focus</span> : null}
              </div>
              <p>{plan.description}</p>
              <ul>
                {plan.bullets.map((bullet) => (
                  <li key={bullet}>
                    <CheckCircle2 size={16} />
                    {bullet}
                  </li>
                ))}
              </ul>
              <button className={plan.featured ? "primary-button" : "secondary-button"}>Audit {plan.name}</button>
            </article>
          ))}
        </div>
        <p className="pricing-footnote">
          All public subscription amounts are now normalized in EUR. Institutional scope remains quoted manually until
          backend entitlement and billing enforcement are complete.
        </p>
      </section>

      <section className="mobile-admin-section" id="resources">
        <div className="mobile-preview">
          <div className="phone-card phone-card--left">
            <div className="phone-card__notch" />
            <span>Data quality</span>
            <strong>14 live assets</strong>
            <div className="phone-chart" />
          </div>
          <div className="phone-card phone-card--right">
            <div className="phone-card__notch" />
            <span>Audit modules</span>
            <strong>Ops center</strong>
            <ul className="phone-list">
              <li>API Center</li>
              <li>Payments Audit</li>
              <li>Pack Compliance</li>
              <li>Platform Health</li>
            </ul>
          </div>
        </div>
        <div className="mobile-admin-section__copy">
          <SectionHeading
            title="Operate like a real SaaS."
            description="The platform now prioritizes verifiable operations: live market provenance, provider health, payment readiness, and explicit backend blockers."
            action={
              <Link className="text-link" to="/admin">
                Open admin ops <ArrowRight size={16} />
              </Link>
            }
          />
          <div className="store-row">
            <button className="store-button">API Center</button>
            <button className="store-button">Data Quality</button>
          </div>

          <div className="admin-preview-card" id="company">
            <div className="admin-preview-card__header">
              <div>
                <span>Admin Ops</span>
                <strong>Production readiness audit</strong>
              </div>
              <Link to="/admin" className="text-link">
                Open Admin <ChevronRight size={16} />
              </Link>
            </div>
            <div className="admin-preview-card__stats">
              <article>
                <span>Provider chain</span>
                <strong>4 tiers</strong>
                <small>Twelve → Finnhub → Alpha → Yahoo</small>
              </article>
              <article>
                <span>Payment rails</span>
                <strong>3 audited</strong>
                <small>Stripe, PayPal, Bancontact</small>
              </article>
              <article>
                <span>Pack families</span>
                <strong>4 reviewed</strong>
                <small>FREE, PRO, EXPERT, INSTITUTIONNEL</small>
              </article>
              <article>
                <span>Backend truth</span>
                <strong>Visible</strong>
                <small>Blockers surfaced, not hidden</small>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to professionalize XTrendAI?</h2>
        <p>Open the audit dashboard, validate the providers, and turn each commercial promise into an operationally verifiable capability.</p>
        <div className="landing-hero__cta">
          <Link className="primary-button" to="/dashboard">
            Open Audit Dashboard
          </Link>
          <Link className="secondary-button" to="/admin">
            Open Admin Ops
          </Link>
        </div>
      </section>
    </div>
  );
}
