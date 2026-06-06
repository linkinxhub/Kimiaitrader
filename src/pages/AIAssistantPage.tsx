import { useState } from "react";
import { AppPageFrame, useWorkspaceData } from "@/pages/page-helpers";
import { chatWithLLMStream } from "@/services/openaiService";
import { Button, Card, Input, Textarea } from "@/components/ui/primitives";

export default function AIAssistantPage() {
  const { quotes, signals } = useWorkspaceData();
  const [prompt, setPrompt] = useState("Analyse le contexte BTC/USD et XAU/USD pour la session européenne.");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const runAssistant = async () => {
    setLoading(true);
    setResponse("");
    for await (const chunk of chatWithLLMStream({ prompt, quotes, signals })) {
      setResponse((current) => current + chunk);
    }
    setLoading(false);
  };

  return (
    <AppPageFrame
      title="Assistant IA"
      description="Provider configurable en localStorage avec contexte marché injecté automatiquement."
      action={<Button onClick={runAssistant} disabled={loading}>{loading ? "Analyse..." : "Lancer l'analyse"}</Button>}
    >
      <Card className="space-y-4">
        <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        <Textarea value={response} readOnly placeholder="La réponse streamée apparaîtra ici..." className="min-h-[280px]" />
      </Card>
    </AppPageFrame>
  );
}
