import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginError, quickLogin, adminPinLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.95fr]">
        <Card className="space-y-4">
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-100">Connexion</Badge>
          <h1 className="font-display text-4xl text-white">Accédez au cockpit XTrendAI Pro</h1>
          <p className="text-slate-400">Comptes de test, login email/mot de passe, ou accès Super Admin par PIN.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["free", "Free"],
              ["pro", "Pro"],
              ["expert", "Expert"],
              ["institutional", "Institutionnel"],
              ["admin", "Admin"],
            ].map(([key, label]) => (
              <Button key={key} variant="secondary" onClick={async () => (await quickLogin(key as never)) && navigate("/dashboard")}>
                Quick login {label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-display text-2xl text-white">Email & mot de passe</h2>
            <p className="text-sm text-slate-400">Compte admin: `admin@xtrendai.com` / `Admin2024!` / PIN `202406`.</p>
          </div>
          <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input type="password" placeholder="Mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button
            onClick={async () => {
              if (await login(email, password)) navigate("/dashboard");
            }}
          >
            Se connecter
          </Button>

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="font-medium text-white">Accès PIN Super Admin</p>
            <Input placeholder="PIN 202406" value={pin} onChange={(event) => setPin(event.target.value)} />
            <Button variant="secondary" onClick={async () => (await adminPinLogin(pin)) && navigate("/admin")}>
              Valider le PIN
            </Button>
          </div>

          {loginError ? <p className="text-sm text-red-300">{loginError}</p> : null}
          <p className="text-sm text-slate-400">
            Pas encore de compte ? <Link className="text-blue-300" to="/register">Créer un profil</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
