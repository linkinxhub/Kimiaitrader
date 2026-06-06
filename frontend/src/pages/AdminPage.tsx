import { SectionHeading } from "@/components/SectionHeading";
import { auditModules, packMatrix } from "@/data/audit";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import type { PaymentHealthResponse, ProviderHealthResponse } from "@/types/audit";

export default function AdminPage() {
  const providers = useRemoteJson<ProviderHealthResponse>("/api/admin/providers-health", 120000);
  const payments = useRemoteJson<PaymentHealthResponse>("/api/admin/payments-health", 120000);

  return (
    <div className="page-grid">
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
              {(providers.data?.providers ?? []).map((provider) => (
                <tr key={provider.name}>
                  <td>{provider.name}</td>
                  <td>{provider.status}</td>
                  <td>{provider.mode}</td>
                  <td>{provider.hasKey ? "Configured" : "Missing"}</td>
                  <td>{provider.hasSecret ? "Configured" : "N/A"}</td>
                  <td>{provider.responseTimeMs}ms</td>
                  <td>{provider.lastError ?? "None"}</td>
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
          {(payments.data?.providers ?? []).map((provider) => (
            <article key={provider.name} className="stat-card">
              <span>{provider.name}</span>
              <strong>{provider.status}</strong>
              <small>{provider.mode}</small>
              <p className="muted-copy">
                Public key: {provider.hasPublicKey ? "yes" : "no"} | Secret: {provider.hasSecretKey ? "yes" : "no"}
              </p>
            </article>
          ))}
        </div>
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
