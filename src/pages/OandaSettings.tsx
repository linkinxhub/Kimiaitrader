import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Check, AlertTriangle, Loader2, ExternalLink, Copy, CheckCircle, Info, BookOpen, TrendingUp } from 'lucide-react';
import {
  saveOandaConfig, isOandaConfigured, testOandaConnection, getOandaInstructions
} from '@/services/oandaService';
import { getOandaAvailableSymbols } from '@/services/oandaService';

export default function OandaSettings() {
  const config = JSON.parse(localStorage.getItem('xtrendai_oanda_config') || '{}');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [accountId, setAccountId] = useState(config.accountId || '');
  const [enabled, setEnabled] = useState(config.enabled || false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveOandaConfig({ apiKey: apiKey.trim(), accountId: accountId.trim(), enabled });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    saveOandaConfig({ apiKey: apiKey.trim(), accountId: accountId.trim(), enabled: true });
    const result = await testOandaConnection();
    setTestResult(result);
    setTesting(false);
    if (result.success) {
      setEnabled(true);
    }
  };

  const symbols = getOandaAvailableSymbols();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">OANDA API</h2>
          <p className="text-xs text-slate-400">Alternative gratuite a XTB — Forex, Metaux, Indices en temps reel</p>
        </div>
        {isOandaConfigured() && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <CheckCircle className="w-3 h-3 inline mr-1" />Active
          </span>
        )}
      </div>

      {/* Warning XTB */}
      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-400">Pourquoi OANDA et pas XTB ?</p>
          <p className="text-xs text-slate-400 mt-1">
            L&apos;API publique de XTB (xapi.xtb.com) a ete fermee definitivement le 14 mars 2025. 
            OANDA est un broker forex/CFD majeur equivalent, avec une API REST gratuite accessible via compte demo.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" /> Comment configurer OANDA
        </h3>
        <ol className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">1.</span>
            <span>Creez un compte <strong className="text-white">DEMO gratuit</strong> sur{' '}
              <a href="https://www.oanda.com/demo-account/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                oanda.com <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">2.</span>
            <span>Connectez-vous au{' '}
              <a href="https://trade.oanda.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                portal de trading <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">3.</span>
            <span>Generez une API Key dans &quot;Manage API Access&quot;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">4.</span>
            <span>Collez votre API Key ci-dessous</span>
          </li>
        </ol>
      </div>

      {/* Configuration Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Configuration</h3>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">API Key OANDA</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Votre cle API OANDA (commence par votre ID de compte)"
            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          <p className="text-[10px] text-slate-600 mt-1">La cle est stockee localement dans votre navigateur, jamais sur nos serveurs.</p>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Account ID (optionnel — auto-detecte)</label>
          <input
            type="text"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            placeholder="Ex: 001-001-1234567-001"
            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            {saved ? <Check className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {saved ? 'Sauvegarde !' : 'Sauvegarder'}
          </button>

          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500"
            />
            <span className="text-sm text-slate-400">Active</span>
          </label>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p className={`text-sm ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {testResult.success ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <AlertTriangle className="w-4 h-4 inline mr-1" />}
              {testResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Available Symbols */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> Symboles disponibles ({symbols.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {symbols.map(s => (
            <div key={s.symbol} className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-lg">
              <span className="text-sm font-bold text-white w-20">{s.symbol}</span>
              <span className="text-xs text-slate-400 flex-1">{s.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[10px] text-blue-400">{s.category}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
