import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, registerError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pack, setPack] = useState("free");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <Card className="w-full max-w-2xl space-y-5">
        <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-100">Inscription</Badge>
        <div>
          <h1 className="font-display text-4xl text-white">Créez votre espace de trading IA</h1>
          <p className="mt-2 text-slate-400">Authentification locale, choix de pack immédiat, activation statique compatible hébergement simple.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Nom complet" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Input type="password" placeholder="Mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Select value={pack} onChange={(event) => setPack(event.target.value)}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="expert">Expert</option>
          <option value="institutional">Institutionnel</option>
        </Select>
        <Button
          onClick={async () => {
            if (await register(name, email, password, pack as never)) navigate("/dashboard");
          }}
        >
          Créer mon compte
        </Button>
        {registerError ? <p className="text-sm text-red-300">{registerError}</p> : null}
        <p className="text-sm text-slate-400">
          Déjà inscrit ? <Link className="text-blue-300" to="/login">Se connecter</Link>
        </p>
      </Card>
    </div>
  );
}
