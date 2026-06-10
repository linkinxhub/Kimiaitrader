/**
 * AIConfigPage — Configuration des clés API IA
 * L'utilisateur choisit son provider, modèle, et entre sa clé API
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Key, Check, AlertTriangle, Zap, Globe, Server, Cpu, RefreshCw, Eye, EyeOff, Save, TestTube, ChevronRight,
} from 'lucide-react';
import { getAIConfig, saveAIConfig, isAIEnabled, type AIConfig, type AIModel } from '@/services/aiService';

const PROVIDERS = [
  { id: 'openai' as const, name: 'OpenAI', desc: 'GPT-3.5 / GPT-4 / GPT-4 Turbo — Payant, très performant', icon: Zap, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  { id: 'anthropic' as const, name: 'Anthropic Claude', desc: 'Claude 3 Sonnet / Haiku — Payant, excellent pour l\'analyse', icon: Brain, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
  { id: 'google' as const, name: 'Google Gemini', desc: 'Gemini Pro / Flash — Gratuit (limite quotidienne), bon rapport qualité', icon: Globe, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  { id: 'ollama' as const, name: 'Ollama (Local)', desc: 'Llama 3 / Mistral — Gratuit, tourne sur votre machine', icon: Server, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
  { id: 'demo' as const, name: 'Mode Démo', desc: 'Sans clé API — Réponses pré-enregistrées limitées', icon: Cpu, color: 'text-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-500/10' },
];

const MODELS: Record<string, { value: AIModel; label: string }[]> = {
  openai: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo — Rapide & économique' },
    { value: 'gpt-4', label: 'GPT-4 — Plus précis, plus cher' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo — Le plus performant' },
  ],
  anthropic: [
    { value: 'claude-sonnet', label: 'Claude 3 Sonnet — Équilibré' },
    { value: 'claude-haiku', label: 'Claude 3 Haiku — Rapide & économique' },
  ],
  google: [
    { value: 'gemini-flash', label: 'Gemini 1.5 Flash — Gratuit, rapide' },
    { value: 'gemini-pro', label: 'Gemini 1.5 Pro — Plus puissant' },
  ],
  ollama: [
    { value: 'ollama-llama3', label: 'Llama 3 — Meta, open source' },
    { value: 'ollama-mistral', label: 'Mistral — Performant, léger' },
  ],
  demo: [
    { value: 'gpt-3.5-turbo', label: 'Mode démo — Pas d\'appel API' },
  ],
};

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig>(getAIConfig());
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (partial: Partial<AIConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
    setSaved(false);
    setTestResult(null);
  };

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (config.provider === 'demo') {
      setTestResult({ success: true, message: 'Mode démo actif — Pas besoin de clé API' });
      return;
    }
    if (!config.apiKey || config.apiKey.length < 10) {
      setTestResult({ success: false, message: 'Clé API requise (min 10 caractères)' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { sendMessage } = await import('@/services/aiService');
      const response = await sendMessage('Bonjour, peux-tu confirmer que tu fonctionnes ? Réponds en 1 phrase.');
      setTestResult({
        success: !response.includes('Erreur') && !response.includes('error'),
        message: response.length > 200 ? response.slice(0, 200) + '...' : response,
      });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Erreur de connexion' });
    } finally {
      setTesting(false);
    }
  };

  const provider = PROVIDERS.find(p => p.id === config.provider) || PROVIDERS[4];
  const ProviderIcon = provider.icon;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Configuration IA</h1>
          <p className="text-xs text-slate-400">Choisissez votre assistant IA — API gratuites ou payantes</p>
        </div>
        {isAIEnabled() && (
          <span className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <Check className="w-3 h-3" /> Actif
          </span>
        )}
      </div>

      {/* Status */}
      <div className={`bg-gradient-to-r ${provider.bg} ${provider.border} border rounded-2xl p-4 flex items-center gap-3`}>
        <ProviderIcon className={`w-6 h-6 ${provider.color}`} />
        <div>
          <p className={`text-sm font-semibold ${provider.color}`}>{provider.name}</p>
          <p className="text-xs text-slate-400">{provider.desc}</p>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">1. Choisissez un provider</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROVIDERS.map(p => {
            const Icon = p.icon;
            const isActive = config.provider === p.id;
            return (
              <button key={p.id} onClick={() => update({ provider: p.id, model: MODELS[p.id][0].value })}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${isActive ? `${p.border} ${p.bg} ring-1 ring-offset-0 ring-offset-slate-950 ${p.color.replace('text-', 'ring-')}` : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40'}`}>
                <Icon className={`w-5 h-5 mt-0.5 ${isActive ? p.color : 'text-slate-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection */}
      {config.provider !== 'demo' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">2. Choisissez un modèle</p>
          <div className="grid grid-cols-1 gap-2">
            {MODELS[config.provider]?.map(m => (
              <button key={m.value} onClick={() => update({ model: m.value })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${config.model === m.value ? 'border-blue-500/30 bg-blue-500/10' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.model === m.value ? 'border-blue-400' : 'border-slate-600'}`}>
                  {config.model === m.value && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                </div>
                <span className={`text-sm ${config.model === m.value ? 'text-white font-medium' : 'text-slate-400'}`}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* API Key */}
      {config.provider !== 'demo' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">3. Clé API</p>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={e => update({ apiKey: e.target.value, enabled: e.target.value.length >= 10 })}
              placeholder={config.provider === 'google' ? 'AIza... (Google AI Studio)' : config.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              className="w-full pl-10 pr-10 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {config.provider === 'openai' && 'Obtenez votre clé sur platform.openai.com/api-keys'}
            {config.provider === 'anthropic' && 'Obtenez votre clé sur console.anthropic.com'}
            {config.provider === 'google' && 'Obtenez votre clé gratuite sur aistudio.google.com/apikey'}
            {config.provider === 'ollama' && 'Ollama tourne localement — pas besoin de clé, mais vérifiez que le serveur est démarré'}
          </p>
        </div>
      )}

      {/* Ollama Base URL */}
      {config.provider === 'ollama' && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">URL du serveur Ollama</p>
          <input
            type="text"
            value={config.baseUrl || 'http://localhost:11434'}
            onChange={e => update({ baseUrl: e.target.value })}
            placeholder="http://localhost:11434"
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          <p className="text-xs text-slate-500">Par défaut : http://localhost:11434 — Lancez `ollama serve` dans un terminal</p>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Paramètres avancés</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Max tokens</label>
            <input type="number" value={config.maxTokens} onChange={e => update({ maxTokens: parseInt(e.target.value) || 2000 })}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Température (0-1)</label>
            <input type="number" step="0.1" min="0" max="1" value={config.temperature} onChange={e => update({ temperature: parseFloat(e.target.value) || 0.7 })}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors border border-blue-500/30">
          <Save className="w-4 h-4" /> {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
        <button onClick={handleTest} disabled={testing}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 disabled:opacity-50">
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
          {testing ? 'Test en cours...' : 'Tester la connexion'}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-start gap-2">
            {testResult.success ? <Check className="w-4 h-4 text-emerald-400 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />}
            <p className={`text-sm ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>{testResult.message}</p>
          </div>
        </motion.div>
      )}

      {/* Help */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-blue-400" /> Comment obtenir une clé API ?
        </p>
        <div className="space-y-2 text-xs text-slate-400">
          <p><strong className="text-emerald-400">Google Gemini (Gratuit)</strong> → aistudio.google.com/apikey → Créez une clé gratuite</p>
          <p><strong className="text-emerald-400">OpenAI</strong> → platform.openai.com → Créditez 5$ minimum</p>
          <p><strong className="text-emerald-400">Anthropic Claude</strong> → console.anthropic.com → Demandez l'accès</p>
          <p><strong className="text-emerald-400">Ollama (Gratuit)</strong> → ollama.com → Téléchargez, lancez `ollama run llama3`</p>
        </div>
      </div>
    </div>
  );
}
