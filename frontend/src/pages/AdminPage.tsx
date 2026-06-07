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
          <p className="stat-card__note is-up">All critical paths monitored</p>
        </article>

        <article className="stat-card">
          <span>Provider blockers</span>
          <strong>{blockedProviders}</strong>
          <small>Missing keys, secrets, or degraded tiers</small>
          <p className="stat-card__note tone-amber">Requires attention</p>
        </article>

        <article className="stat-card">
          <span>Payment readiness</span>
          <strong>
            {readyPayments}/{paymentRows.length || 3}
          </strong>
          <small>Checkout providers fully configured</small>
          <p className="stat-card__note is-down">Not ready</p>
        </article>

        <article className="stat-card">
          <span>Last audit</span>
          <strong>{formatTimestamp(providers.data?.fetchedAt ?? null)}</strong>
          <small>Serverless health snapshot timestamp</small>
          <p className="stat-card__note is-up">Healthy</p>
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
                <th>Provider</th>
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
                    <div className="provider-name-cell">
                      <span className="provider-initial">{provider.name.slice(0, 2).toUpperCase()}</span>
                      <div className="table-cell-stack">
                        <strong>{provider.name}</strong>
                        <span>{provider.note}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill${provider.status === "connected" ? " is-live" : " is-blocked"}`}>
                      {provider.status}
                    </span>
                  </td>
                  <td>{provider.mode}</td>
                  <td>{provider.hasKey ? "Present" : "Missing"}</td>
                  <td>{provider.hasSecret ? "Present" : "N/A"}</td>
                  <td>{provider.responseTimeMs}ms</td>
                  <td>{provider.lastError ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-detail-grid">
        <article className="panel">
          <SectionHeading
            title="Payment Audit"
            eyebrow="Priority 3"
            description="Configuration audit for Stripe, PayPal, and Bancontact. Missing credentials are surfaced before any false checkout promise."
          />
          <div className="payment-audit-list">
            {paymentRows.map((provider) => (
              <article key={provider.name} className="payment-audit-card">
                <div className="payment-audit-card__top">
                  <div>
                    <strong>{provider.name}</strong>
                    <span>{provider.note}</span>
                  </div>
                  <span className={`status-pill${provider.status === "connected" ? " is-live" : " is-blocked"}`}>
                    {provider.status}
                  </span>
                </div>
                <div className="payment-audit-card__meta">
                  <span>Public key: {provider.hasPublicKey ? "Present" : "Missing"}</span>
                  <span>Secret: {provider.hasSecretKey ? "Present" : "Missing"}</span>
                  <span>Mode: {provider.mode}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="muted-copy admin-footnote">
            Payment blockers detected: {blockedPayments}. Real subscription activation still depends on backend
            webhooks, entitlement persistence, and secure billing state.
          </p>
        </article>

        <article className="panel">
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
        </article>

        <article className="panel">
          <SectionHeading
            title="Platform Health Center"
            description="The monitoring layer now makes blockers visible instead of implying maturity where the backend is still incomplete."
          />
          <div className="platform-health-grid">
            <div className="platform-health-list">
              {auditModules.slice(0, 5).map((module) => (
                <div key={module} className="platform-health-row">
                  <span>{module}</span>
                  <strong className={module === "Audit Paiements" ? "is-down" : "is-up"}>
                    {module === "Audit Paiements" ? "Not ready" : "Live"}
                  </strong>
                </div>
              ))}
            </div>

            <div className="backend-blocker-card">
              <div className="backend-blocker-card__top">
                <strong>Backend blocker</strong>
                <span className="status-pill is-blocked">Critical</span>
              </div>
              <p>
                The current Laravel backend snapshot is incomplete and cannot yet act as a production SaaS control
                plane for entitlements, payment webhooks, secure persistence, and API key management.
              </p>
              <ul className="reasoning-list">
                <li>Secure admin persistence is not implemented end-to-end.</li>
                <li>Subscription state cannot yet activate permissions server-side.</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
