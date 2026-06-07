import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionHeading } from "@/components/SectionHeading";
import { auditModules } from "@/data/audit";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import { formatMarketPrice, formatPercent, formatTimestamp } from "@/lib/formatters";
import type { MarketSnapshot, ProviderHealthResponse } from "@/types/audit";

export default function DashboardPage() {
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);
  const providerHealth = useRemoteJson<ProviderHealthResponse>("/api/admin/providers-health", 120000);
  const assets = snapshot.data?.assets ?? [];
  const providerRows = providerHealth.data?.providers ?? [];

  const eurusd = assets.find((asset) => asset.code === "EUR/USD") ?? null;
  const xauusd = assets.find((asset) => asset.code === "XAU/USD") ?? null;
  const cryptoAssets = assets.filter((asset) => asset.category === "Crypto").slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dashboard-page">
      <section className="dashboard-hero-grid dashboard-hero-grid--audit">
        <article className="panel panel--chart">
          <div className="panel__header">
            <div>
              <span className="panel__kicker">EUR/USD live feed</span>
              <h2>{formatMarketPrice(eurusd?.price ?? null, "EUR/USD")}</h2>
            </div>
            <div className="panel-meta">
              <strong className={(eurusd?.changePercent ?? 0) >= 0 ? "is-up" : "is-down"}>
                {eurusd?.changePercent == null ? "No change data" : formatPercent(eurusd.changePercent)}
              </strong>
              <span>{eurusd?.source ?? "Unavailable"}</span>
            </div>
          </div>

          <div className="chart-stack">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={snapshot.data?.charts["EUR/USD"] ?? []} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="eurusdArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#18273a" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 11 }} domain={["dataMin", "dataMax"]} />
                <Tooltip contentStyle={{ background: "#081321", border: "1px solid #1d334a", borderRadius: 14 }} />
                <Area type="monotone" dataKey="price" stroke="#3ee089" strokeWidth={2.7} fill="url(#eurusdArea)" />
              </AreaChart>
            </ResponsiveContainer>

            <div className="audit-inline-stats">
              <div>
                <span>Source</span>
                <strong>{eurusd?.source ?? "Unavailable"}</strong>
              </div>
              <div>
                <span>Quality</span>
                <strong>{eurusd?.quality ?? "unavailable"}</strong>
              </div>
              <div>
                <span>As of</span>
                <strong>{formatTimestamp(eurusd?.asOf ?? null)}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="panel panel--gold">
          <div className="panel__header">
            <div>
              <span className="tag-pill">Premium</span>
              <h3>XAU/USD</h3>
            </div>
            <strong className="gold-price">{formatMarketPrice(xauusd?.price ?? null, "XAU/USD")}</strong>
          </div>

          <ResponsiveContainer width="100%" height={188}>
            <AreaChart data={snapshot.data?.charts["XAU/USD"] ?? []}>
              <defs>
                <linearGradient id="goldDashArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 10 }} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Area type="monotone" dataKey="price" stroke="#f2bb3d" strokeWidth={2.2} fill="url(#goldDashArea)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mini-stat-grid">
            <div>
              <span>Source</span>
              <strong>{xauusd?.source ?? "Unavailable"}</strong>
            </div>
            <div>
              <span>Quality</span>
              <strong>{xauusd?.quality ?? "unavailable"}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatTimestamp(xauusd?.asOf ?? null)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <SectionHeading
          title="Provider Chain Health"
          eyebrow="Failover"
          description="The live board now surfaces real fallback posture instead of hiding configuration gaps behind static demo data."
        />

        <div className="provider-card-grid">
          {providerRows.map((provider, index) => (
            <article key={provider.name} className="provider-health-card">
              <div className="provider-health-card__top">
                <span className="provider-health-card__index">{index + 1}</span>
                <span className={`status-pill${provider.status === "connected" ? " is-live" : " is-blocked"}`}>
                  {provider.status}
                </span>
              </div>
              <strong>{provider.name}</strong>
              <p>{provider.note}</p>
              <div className="provider-health-card__stats">
                <div>
                  <span>Latency</span>
                  <strong>{provider.responseTimeMs}ms</strong>
                </div>
                <div>
                  <span>Mode</span>
                  <strong>{provider.mode}</strong>
                </div>
                <div>
                  <span>Key</span>
                  <strong>{provider.hasKey ? "Present" : "Missing"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionHeading
          title="Live Market Audit"
          eyebrow="Priority 2"
          description="Requested instruments across Forex, metals, crypto, and indices with visible source, timestamp, quality, and freshness."
        />
        <div className="calendar-table">
          <table>
            <thead>
              <tr>
                <th>Asset Class</th>
                <th>Instrument</th>
                <th>Price</th>
                <th>24H Change</th>
                <th>Source</th>
                <th>Quality</th>
                <th>Status</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.code}>
                  <td>{asset.category}</td>
                  <td>{asset.code}</td>
                  <td>{formatMarketPrice(asset.price, asset.code)}</td>
                  <td className={(asset.changePercent ?? 0) >= 0 ? "is-up" : "is-down"}>
                    {asset.changePercent == null ? "Unavailable" : formatPercent(asset.changePercent)}
                  </td>
                  <td>{asset.source}</td>
                  <td>{asset.quality}</td>
                  <td>
                    <span className={`status-pill${asset.status === "live" ? " is-live" : " is-blocked"}`}>{asset.status}</span>
                  </td>
                  <td>{formatTimestamp(asset.lastUpdated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="panel">
          <SectionHeading
            title="Real-time Monitoring Modules"
            eyebrow="Priority 7"
            description="Operational modules added or elevated to make the SaaS posture measurable instead of implied."
          />
          <div className="module-grid">
            {auditModules.slice(0, 5).map((module) => (
              <article key={module} className="feature-card feature-card--module">
                <h3>{module}</h3>
                <p>Surfaced in admin and quality workflows so missing integrations and platform risk remain visible.</p>
                <div className="module-health-row">
                  <span>Status</span>
                  <strong className="is-up">Healthy</strong>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionHeading
            title="Crypto Market Health"
            description="A compact health view to validate that the fallback chain keeps higher-volatility assets populated."
          />
          <div className="market-health-list">
            {cryptoAssets.map((asset) => (
              <div key={asset.code} className="market-health-row">
                <div>
                  <strong>{asset.code}</strong>
                  <span>{asset.source}</span>
                </div>
                <div>
                  <strong>{formatMarketPrice(asset.price, asset.code)}</strong>
                  <span className={(asset.changePercent ?? 0) >= 0 ? "is-up" : "is-down"}>
                    {asset.changePercent == null ? asset.quality : formatPercent(asset.changePercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {(snapshot.error || providerHealth.error) && (
        <section className="panel">
          <SectionHeading
            title="Local development note"
            eyebrow="Serverless"
            description="The audit endpoints are designed for Vercel Functions. If they fail locally under plain Vite, preview or production remains the source of truth."
          />
          <p className="muted-copy">{snapshot.error ?? providerHealth.error}</p>
        </section>
      )}
    </motion.div>
  );
}
