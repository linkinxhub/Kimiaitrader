import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card, Input, Select, SectionHeader } from "@/components/ui/primitives";

export default function RegisterPage() {
  const { register, registerError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pack, setPack] = useState<"free" | "pro" | "expert" | "institutional">("free");

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      <SectionHeader
        title="Inscription"
        description="La nouvelle interface d'inscription reste simple: un choix de pack, puis un acces direct au produit."
      />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <p className="font-display text-4xl tracking-[-0.05em] text-white">Creer votre salle de marche</p>
          <p className="text-sm leading-7 text-slate-400">
            Choisissez un point d'entree, gardez vos reglages en local, puis accedez aux donnees live et au produit complet.
          </p>
        </Card>
        <Card className="space-y-4">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom" />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" type="password" />
          <Select value={pack} onChange={(event) => setPack(event.target.value as typeof pack)}>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="expert">Expert</option>
            <option value="institutional">Institutional</option>
          </Select>
          <Button
            onClick={async () => {
              const ok = await register(name, email, password, pack);
              if (ok) navigate("/dashboard");
            }}
          >
            Creer mon acces
          </Button>
          {registerError ? <p className="text-sm text-rose-300">{registerError}</p> : null}
          <p className="text-sm text-slate-400">
            Deja inscrit ? <Link to="/login" className="text-[#6fe7dd]">Se connecter</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
