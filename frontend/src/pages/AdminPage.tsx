import { SectionHeading } from "@/components/SectionHeading";
import { auditModules, packMatrix } from "@/data/audit";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import { formatTimestamp } from "@/lib/formatters";
import type { PaymentHealthResponse, ProviderHealthResponse } from "@/types/audit";

export default function AdminPage() {
  const providers = useRemoteJson<ProviderHealthResponse>("/api/admin/providers-health", 120000);
  const payments = useRemoteJson<PaymentHealthResponse>("/api/admin/payments-health", 120000);
  const providerRows = providers.data?.providers ?? [];
  const paymentRows = payments.data?.providers ?? [];

  const connectedProviders = providerRows.filter((provider) => provider.status === "connected").length;
  const blockedProviders = providerRows.length - connectedProviders;
  const readyPayments = paymentRows.filter((provider) => provider.status === "connected").length;
  const blockedPayments = paymentRows.length - readyPayments;

  return (
    <div className="page-grid">
      <section className="admin-stat-grid">
        <article className="stat-card">
          <span>Provider connections</span>
          <strong>
            {connectedProviders}/{providerRows.length || 4}
          </strong>
          <small>Live data sources currently connected</small>
        </article>
        <article className="stat-card">
          <span>Provider blockers</span>
          <strong>{blockedProviders}</strong>
          <small>Missing keys, secrets, or degraded provider tiers</small>
        </article>
        <article className="stat-card">
          <span>Payment readiness</span>
          <strong>
            {readyPayments}/{paymentRows.length || 3}
          </strong>
          <small>Checkout providers fully configured</small>
        </article>
        <article className="stat-card">
          <span>Last provider audit</span>
          <strong>{formatTimestamp(providers.data?.fetchedAt ?? null)}</strong>
          <small>Serverless health snapshot timestamp</small>
        </article>
      </section>

      <section className="panel">
        <SectionHeading
          title="Admin API Center"
          eyebrow="Priority 1"
          description="Operational view of configured providers, current mode, connection status, latest error surface, and response times."
        />
        <div className="calendar-table">
          <table>
            <thead>
              <tr>
                <th>API</th>
                <th>Status</th>
                <th>Mode</th>
                <th>Key</th>
                <th>Secret</th>
                <th>Response</th>
                <th>Last error</th>
              </tr>
            </thead>
            <tbody>
              {providerRows.map((provider) => (
                <tr key={provider.name}>
                  <td>
                    <div className="table-cell-stack">
                      <strong>{provider.name}</strong>
                      <span>{provider.note}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill${provider.status === "connected" ? " is-live" : " is-blocked"}`}>
                      {provider.status}
                    </span>
                  </td>
                  <td>{provider.mode}</td>
                  <td>{provider.hasKey ? "Configured" : "Missing"}</td>
                  <td>{provider.hasSecret ? "Configured" : "N/A"}</td>
                  <td>{provider.responseTimeMs}ms</td>
                  <td>{provider.lastError ?? provider.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <SectionHeading
          title="Payment Audit"
          eyebrow="Priority 3"
          description="Configuration audit for Stripe, PayPal, and Bancontact. Missing credentials are exposed here instead of being hidden behind a fake checkout path."
        />
        <div className="admin-stat-grid">
          {paymentRows.map((provider) => (
            <article key={provider.name} className="stat-card">
              <span>{provider.name}</span>
              <strong>{provider.status}</strong>
              <small>{provider.mode}</small>
              <p className="muted-copy">
                Public key: {provider.hasPublicKey ? "yes" : "no"} | Secret: {provider.hasSecretKey ? "yes" : "no"}
              </p>
              <p className="muted-copy">{provider.note}</p>
            </article>
          ))}
        </div>
        <p className="muted-copy admin-footnote">
          Payment blockers detected: {blockedPayments}. Real subscription activation still depends on backend webhooks,
          entitlement persistence, and secure billing state.
        </p>
      </section>

      <section className="panel">
        <SectionHeading
          title="Pack Compliance Center"
          eyebrow="Priority 4"
          description="Current SaaS entitlement posture by pack across frontend, backend, API, and mobile surfaces."
        />
        <div className="calendar-table">
          <table>
            <thead>
              <tr>
                <th>Pack</th>
                <th>Frontend</th>
                <th>Backend</th>
                <th>API</th>
                <th>Mobile</th>
              </tr>
            </thead>
            <tbody>
              {packMatrix.map((pack) => (
                <tr key={pack.pack}>
                  <td>{pack.pack}</td>
                  <td>{pack.frontend}</td>
                  <td>{pack.backend}</td>
                  <td>{pack.api}</td>
                  <td>{pack.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Platform health center</h3>
          <ul className="reasoning-list">
            {auditModules.map((module) => (
              <li key={module}>{module}</li>
            ))}
          </ul>
        </div>
        <div className="macro-callout">
          <strong>Backend blocker</strong>
          <p>
            The current Laravel backend snapshot is incomplete and cannot yet serve as a production SaaS control plane.
            Core framework bootstrap files are still missing, which blocks real entitlement storage, payment webhooks,
            secure admin persistence, and API key management from the admin UI.
          </p>
        </div>
      </section>
    </div>
  );
}
