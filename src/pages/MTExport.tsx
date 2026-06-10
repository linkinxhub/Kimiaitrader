import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, ExternalLink, Code, FileText, Settings, Info, AlertTriangle } from 'lucide-react';
import { MTExportGuide } from '@/components/FeatureGuide';
import { useAISignals } from '@/hooks/useAISignals';

type MTFormat = 'mql4' | 'mql5' | 'csv' | 'json';

export default function MTExport() {
  const { signals } = useAISignals();
  const [format, setFormat] = useState<MTFormat>('mql4');
  const [copied, setCopied] = useState(false);

  const activeSignals = signals.filter(s => s.signal !== 'ATTENTE').slice(0, 10);

  const generateMQL4 = () => {
    const signalsCode = activeSignals.map((s, i) => `
// Signal ${i + 1}: ${s.asset} — ${s.signal} (${s.confidence}%)
string signal_${i + 1}_asset = "${s.asset}";
string signal_${i + 1}_type = "${s.signal}";
double signal_${i + 1}_entry = ${s.entryPoint.toFixed(5)};
double signal_${i + 1}_sl = ${s.stopLoss.toFixed(5)};
double signal_${i + 1}_tp1 = ${s.takeProfit1.toFixed(5)};
double signal_${i + 1}_tp2 = ${s.takeProfit2.toFixed(5)};
double signal_${i + 1}_tp3 = ${s.takeProfit3.toFixed(5)};
int signal_${i + 1}_confidence = ${s.confidence};
string signal_${i + 1}_risk = "${s.riskLevel}";
// ${s.explanations.map(e => `${e.indicator}: ${e.interpretation}`).join(' | ')}`).join('\n');

    return `//+------------------------------------------------------------------+
//| XTrendAI Pro — Signal Export for MetaTrader 4                     |
//| Généré le: ${new Date().toLocaleString('fr-FR')}                               |
//| Source: AI-Engine-Live                                            |
//+------------------------------------------------------------------+
#property copyright "XTrendAI Pro"
#property link      "https://xtrendai-pro.com"
#property version   "1.00"
#property strict

//--- Input parameters
input double   Lots          = 0.1;
input int      Slippage      = 3;
input int      MagicNumber   = 202606;
input bool     UseTP1        = true;
input bool     UseTP2        = false;
input bool     UseTP3        = false;

//--- Signal Data (imported from XTrendAI Pro)
${signalsCode}

//+------------------------------------------------------------------+
//| Execute Signal                                                    |
//+------------------------------------------------------------------+
void ExecuteSignal(string asset, string type, double entry, double sl, double tp, int confidence)
{
   string symbol = StringReplace(asset, "/", "");
   
   if(type == "ACHAT")
   {
      int ticket = OrderSend(symbol, OP_BUY, Lots, Ask, Slippage, sl, tp, "XTrendAI " + asset, MagicNumber, 0, clrGreen);
      if(ticket < 0)
         Print("Error opening BUY order: ", GetLastError());
      else
         Print("BUY order opened: #", ticket, " — ", asset, " @ ", entry, " (Conf: ", confidence, "%)");
   }
   else if(type == "VENTE")
   {
      int ticket = OrderSend(symbol, OP_SELL, Lots, Bid, Slippage, sl, tp, "XTrendAI " + asset, MagicNumber, 0, clrRed);
      if(ticket < 0)
         Print("Error opening SELL order: ", GetLastError());
      else
         Print("SELL order opened: #", ticket, " — ", asset, " @ ", entry, " (Conf: ", confidence, "%)");
   }
}

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("XTrendAI Pro MT4 Connector initialized. Signals loaded: ", ${activeSignals.length});
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("XTrendAI Pro MT4 Connector stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Auto-execution based on signals
   // Uncomment to enable automatic trading:
   // ExecuteSignal(signal_1_asset, signal_1_type, signal_1_entry, signal_1_sl, signal_1_tp1, signal_1_confidence);
}
//+------------------------------------------------------------------+
`;
  };

  const generateMQL5 = () => {
    const signalsCode = activeSignals.map((s, i) => `
// Signal ${i + 1}: ${s.asset} — ${s.signal} (${s.confidence}%)
string signal_${i + 1}_asset = "${s.asset}";
ENUM_ORDER_TYPE signal_${i + 1}_type = ${s.signal === 'ACHAT' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL'};
double signal_${i + 1}_entry = ${s.entryPoint.toFixed(5)};
double signal_${i + 1}_sl = ${s.stopLoss.toFixed(5)};
double signal_${i + 1}_tp1 = ${s.takeProfit1.toFixed(5)};
double signal_${i + 1}_tp2 = ${s.takeProfit2.toFixed(5)};
double signal_${i + 1}_tp3 = ${s.takeProfit3.toFixed(5)};
int signal_${i + 1}_confidence = ${s.confidence};
string signal_${i + 1}_risk = "${s.riskLevel}";
// ${s.explanations.map(e => `${e.indicator}: ${e.interpretation}`).join(' | ')}`).join('\n');

    return `//+------------------------------------------------------------------+
//| XTrendAI Pro — Signal Export for MetaTrader 5                     |
//| Généré le: ${new Date().toLocaleString('fr-FR')}                               |
//| Source: AI-Engine-Live                                            |
//+------------------------------------------------------------------+
#property copyright "XTrendAI Pro"
#property link      "https://xtrendai-pro.com"
#property version   "1.00"

//--- Input parameters
input group "=== Trading Parameters ==="
input double   InpLots       = 0.1;
input int      InpSlippage   = 10;
input ulong    InpMagic      = 202606;
input group "=== Take Profit Settings ==="
input bool     InpUseTP1     = true;
input bool     InpUseTP2     = false;
input bool     InpUseTP3     = false;

//--- Signal Data (imported from XTrendAI Pro)
${signalsCode}

//+------------------------------------------------------------------+
//| Execute Signal (MQL5)                                             |
//+------------------------------------------------------------------+
bool ExecuteSignalMQL5(string asset, ENUM_ORDER_TYPE type, double entry, double sl, double tp, int confidence)
{
   string symbol = StringReplace(asset, "/", "");
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = InpLots;
   request.type = type;
   request.deviation = InpSlippage;
   request.magic = InpMagic;
   request.comment = "XTrendAI " + asset + " (" + IntegerToString(confidence) + "%)";
   
   if(type == ORDER_TYPE_BUY)
      request.price = SymbolInfoDouble(symbol, SYMBOL_ASK);
   else
      request.price = SymbolInfoDouble(symbol, SYMBOL_BID);
   
   request.sl = sl;
   request.tp = tp;
   
   if(!OrderSend(request, result))
   {
      PrintFormat("OrderSend error %d", GetLastError());
      return false;
   }
   
   PrintFormat("Order executed: retcode=%u, deal=%I64u, order=%I64u", result.retcode, result.deal, result.order);
   return true;
}

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("XTrendAI Pro MT5 Connector initialized. Signals loaded: ", ${activeSignals.length});
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("XTrendAI Pro MT5 Connector stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Auto-execution based on signals
   // Uncomment to enable automatic trading:
   // ExecuteSignalMQL5(signal_1_asset, signal_1_type, signal_1_entry, signal_1_sl, signal_1_tp1, signal_1_confidence);
}
//+------------------------------------------------------------------+
`;
  };

  const generateCSV = () => {
    const headers = 'Asset,Signal,Confidence%,EntryPrice,StopLoss,TakeProfit1,TakeProfit2,TakeProfit3,RiskReward,RiskLevel,Timestamp\n';
    const rows = activeSignals.map(s =>
      `${s.asset},${s.signal},${s.confidence},${s.entryPoint.toFixed(5)},${s.stopLoss.toFixed(5)},${s.takeProfit1.toFixed(5)},${s.takeProfit2.toFixed(5)},${s.takeProfit3.toFixed(5)},${s.riskRewardRatio},${s.riskLevel},${s.timestamp.toISOString()}`
    ).join('\n');
    return headers + rows;
  };

  const generateJSON = () => {
    return JSON.stringify({
      source: 'XTrendAI Pro',
      generatedAt: new Date().toISOString(),
      count: activeSignals.length,
      signals: activeSignals.map(s => ({
        asset: s.asset,
        signal: s.signal,
        confidence: s.confidence,
        entryPoint: s.entryPoint,
        stopLoss: s.stopLoss,
        takeProfit1: s.takeProfit1,
        takeProfit2: s.takeProfit2,
        takeProfit3: s.takeProfit3,
        riskRewardRatio: s.riskRewardRatio,
        riskLevel: s.riskLevel,
        timestamp: s.timestamp.toISOString(),
        explanations: s.explanations,
      })),
    }, null, 2);
  };

  const getCode = () => {
    switch (format) {
      case 'mql4': return generateMQL4();
      case 'mql5': return generateMQL5();
      case 'csv': return generateCSV();
      case 'json': return generateJSON();
    }
  };

  const getFileName = () => {
    const ext = format === 'mql4' ? 'mq4' : format === 'mql5' ? 'mq5' : format;
    return `xtrendai-signals-${Date.now()}.${ext}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName();
    a.click();
    URL.revokeObjectURL(url);
  };

  const formats: { id: MTFormat; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'mql4', label: 'MQL4 (MT4)', desc: 'Expert Advisor pour MetaTrader 4', icon: Code },
    { id: 'mql5', label: 'MQL5 (MT5)', desc: 'Expert Advisor pour MetaTrader 5', icon: Code },
    { id: 'csv', label: 'CSV', desc: 'Fichier tableur universel', icon: FileText },
    { id: 'json', label: 'JSON', desc: 'Format API / intégration', icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      <MTExportGuide />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Export MetaTrader</h1>
            <p className="text-xs text-slate-400">Exportez vos signaux vers MT4/MT5 et autres formats</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">{activeSignals.length} signaux actifs</span>
      </motion.div>

      {/* Warning */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">Avertissement</p>
          <p className="text-xs text-slate-400">L&apos;auto-trading est désactivé par défaut. Décommentez la ligne ExecuteSignal dans OnTick() pour activer. Testez toujours sur un compte démo avant de trader en réel.</p>
        </div>
      </div>

      {/* Format Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {formats.map(f => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => { setFormat(f.id); setCopied(false); }}
              className={`p-4 rounded-2xl border transition-all text-left ${
                format === f.id
                  ? 'bg-slate-800 border-blue-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${format === f.id ? 'text-blue-400' : 'text-slate-500'}`} />
              <p className={`text-sm font-semibold ${format === f.id ? 'text-white' : 'text-slate-300'}`}>{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Code Preview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">{getFileName()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </button>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre">
            {getCode()}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" /> Instructions d&apos;installation
        </h3>
        {format === 'mql4' && (
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Ouvrez MetaTrader 4</li>
            <li>Allez dans Fichier → Ouvrir le répertoire des données</li>
            <li>Naviguez vers MQL4/Experts/</li>
            <li>Créez un fichier <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-blue-400">XTrendAI_Signals.mq4</code></li>
            <li>Collez le code et compilez (F7)</li>
            <li>Faites glisser l&apos;EA sur un graphique</li>
          </ol>
        )}
        {format === 'mql5' && (
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Ouvrez MetaTrader 5</li>
            <li>Allez dans Fichier → Ouvrir le répertoire des données</li>
            <li>Naviguez vers MQL5/Experts/</li>
            <li>Créez un fichier <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-blue-400">XTrendAI_Signals.mq5</code></li>
            <li>Collez le code et compilez (F7)</li>
            <li>Faites glisser l&apos;EA sur un graphique</li>
          </ol>
        )}
        {format === 'csv' && (
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Téléchargez le fichier CSV</li>
            <li>Ouvrez avec Excel, Google Sheets ou LibreOffice</li>
            <li>Importez dans votre journal de trading existant</li>
            <li>Compatible avec la plupart des trackers de portfolio</li>
          </ol>
        )}
        {format === 'json' && (
          <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
            <li>Téléchargez le fichier JSON</li>
            <li>Utilisez l&apos;API pour intégrer les signaux dans vos applications</li>
            <li>Compatible avec les webhooks et les automations (Zapier, Make, n8n)</li>
          </ol>
        )}
      </div>

      {/* Quick Link */}
      <a
        href="https://www.metatrader4.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ExternalLink className="w-4 h-4" /> Télécharger MetaTrader
      </a>
    </div>
  );
}
