import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge, Button, Card, Input, SectionHeader } from "@/components/ui/primitives";

const quickAccounts: Array<"free" | "pro" | "expert" | "institutional" | "admin"> = ["free", "pro", "expert", "institutional", "admin"];

export default function LoginPage() {
  const { login, loginError, quickLogin, adminPinLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      <SectionHeader
        title="Connexion"
        description="La nouvelle base garde les comptes de test et l'entree admin par PIN, mais dans une presentation plus nette."
      />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <p className="font-display text-4xl tracking-[-0.05em] text-white">Reprendre la main sur le desk</p>
          <p className="text-sm leading-7 text-slate-400">
            Connecte-toi pour acceder au dashboard, aux signaux live et a l'espace d'administration.
          </p>
          <div className="flex flex-wrap gap-2">
            {quickAccounts.map((account) => (
              <Button
                key={account}
                variant="secondary"
                onClick={async () => {
                  const ok = await quickLogin(account);
                  if (ok) navigate(account === "admin" ? "/admin" : "/dashboard");
                }}
              >
                Quick {account}
              </Button>
            ))}
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Admin PIN</p>
            <div className="mt-3 flex gap-3">
              <Input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="202406" />
              <Button
                onClick={async () => {
                  const ok = await adminPinLogin(pin);
                  if (ok) navigate("/admin");
                }}
              >
                Entrer
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Connexion classique</p>
          <div className="grid gap-4">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" type="password" />
            <Button
              onClick={async () => {
                const ok = await login(email, password);
                if (ok) navigate("/dashboard");
              }}
            >
              Se connecter
            </Button>
            {loginError ? <Badge className="border-rose-400/20 bg-rose-500/10 text-rose-200">{loginError}</Badge> : null}
          </div>
          <p className="text-sm text-slate-400">
            Pas encore de compte ? <Link to="/register" className="text-[#6fe7dd]">Creer un acces</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
