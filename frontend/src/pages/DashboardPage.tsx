import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionHeading } from "@/components/SectionHeading";
import { auditModules } from "@/data/audit";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import type { MarketSnapshot, ProviderHealthResponse } from "@/types/audit";

function formatPrice(value: number | null, code: string) {
  if (value == null) return "Unavailable";
  const digits = code.includes("/") || code === "BTC" || code === "ETH" || code === "SOL" || code === "BNB" ? 4 : 2;
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function formatTimestamp(value: string | null) {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);
  const providerHealth = useRemoteJson<ProviderHealthResponse>("/api/admin/providers-health", 120000);

  const eurusd = snapshot.data?.assets.find((asset) => asset.code === "EUR/USD") ?? null;
  const xauusd = snapshot.data?.assets.find((asset) => asset.code === "XAU/USD") ?? null;
  const btc = snapshot.data?.assets.find((asset) => asset.code === "BTC") ?? null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dashboard-page">
      <section className="dashboard-hero-grid dashboard-hero-grid--audit">
        <article className="panel panel--chart">
          <div className="panel__header">
            <div>
              <span className="panel__kicker">EUR/USD live feed</span>
              <h2>{formatPrice(eurusd?.price ?? null, "EUR/USD")}</h2>
            </div>
            <div className="panel-meta">
              <strong className={(eurusd?.changePercent ?? 0) >= 0 ? "is-up" : "is-down"}>
                {eurusd?.changePercent == null ? "No change data" : `${eurusd.changePercent >= 0 ? "+" : ""}${eurusd.changePercent.toFixed(2)}%`}
              </strong>
              <span>{eurusd?.source ?? "Unavailable"}</span>
            </div>
          </div>
          <div className="chart-stack">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={snapshot.data?.charts["EUR/USD"] ?? []} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="eurusdArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1a2534" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 11 }} domain={["dataMin", "dataMax"]} />
                <Tooltip contentStyle={{ background: "#0b1524", border: "1px solid #1a2c42", borderRadius: 12 }} />
                <Area type="monotone" dataKey="price" stroke="#4ade80" strokeWidth={2.6} fill="url(#eurusdArea)" />
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
              <span className="tag-pill">Live gold</span>
              <h3>XAU/USD</h3>
            </div>
            <strong className="gold-price">{formatPrice(xauusd?.price ?? null, "XAU/USD")}</strong>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={snapshot.data?.charts["XAU/USD"] ?? []}>
              <defs>
                <linearGradient id="goldDashArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 10 }} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Area type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2.2} fill="url(#goldDashArea)" />
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

        <article className="panel">
          <SectionHeading
            title="Provider Chain"
            eyebrow="Failover"
            description="The market board now prioritizes real provider fallback instead of static demo quotes."
          />
          <div className="provider-stack">
            {(providerHealth.data?.providers ?? []).map((provider) => (
              <div key={provider.name} className="provider-row">
                <div>
                  <strong>{provider.name}</strong>
                  <span>{provider.note}</span>
                </div>
                <div className="provider-row__meta">
                  <em className={provider.status === "connected" ? "is-up" : "is-down"}>{provider.status}</em>
                  <small>{provider.responseTimeMs}ms</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionHeading
            title="Operational Notes"
            eyebrow="Audit result"
            description="What was removed or tightened to prevent the product from presenting fake SaaS maturity."
          />
          <ul className="reasoning-list">
            <li>Fake uptime, execution speed, and inflated asset claims removed from the public narrative.</li>
            <li>Live data now reports source, timestamp, quality, and last update instead of unnamed static prices.</li>
            <li>Provider status is explicit, so missing credentials surface as an operational issue rather than silent failure.</li>
          </ul>
        </article>
      </section>

      <section className="panel">
        <SectionHeading
          title="Live Market Audit"
          eyebrow="Priority 2"
          description="Requested instruments across Forex, metals, crypto, and indices with visible data provenance."
        />
        <div className="calendar-table">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Price</th>
                <th>Source</th>
                <th>Quality</th>
                <th>As of</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {(snapshot.data?.assets ?? []).map((asset) => (
                <tr key={asset.code}>
                  <td>{asset.code}</td>
                  <td>{asset.category}</td>
                  <td>{formatPrice(asset.price, asset.code)}</td>
                  <td>{asset.source}</td>
                  <td>{asset.quality}</td>
                  <td>{formatTimestamp(asset.asOf)}</td>
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
            title="Realtime Monitoring Modules"
            eyebrow="Priority 7"
            description="Operational modules added or surfaced to support a more professional SaaS posture."
          />
          <div className="module-grid">
            {auditModules.map((module) => (
              <article key={module} className="feature-card">
                <h3>{module}</h3>
                <p>Surfaced inside the admin and quality workflows to expose missing integrations and platform risk.</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel panel--phone">
          <SectionHeading
            title="Crypto health spot-check"
            description="Quick visibility on BTC live market data, useful for fallback validation."
          />
          <div className="phone-preview">
            <div className="phone-preview__notch" />
            <div className="phone-preview__message">
              <strong>BTC source: {btc?.source ?? "Unavailable"}</strong>
              <p>Price: {formatPrice(btc?.price ?? null, "BTC")}</p>
              <span>Quality: {btc?.quality ?? "unavailable"}</span>
              <em>Updated: {formatTimestamp(btc?.asOf ?? null)}</em>
            </div>
          </div>
        </article>
      </section>

      {(snapshot.error || providerHealth.error) && (
        <section className="panel">
          <SectionHeading
            title="Local development note"
            eyebrow="Serverless"
            description="The audit endpoints are designed for Vercel Functions. If they fail locally under plain Vite, deploy preview/prod is the source of truth."
          />
          <p className="muted-copy">{snapshot.error ?? providerHealth.error}</p>
        </section>
      )}
    </motion.div>
  );
}
