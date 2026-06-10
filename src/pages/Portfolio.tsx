import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, TrendingUp, TrendingDown, Trash2,
  CheckCircle, XCircle, Wallet, Target, Percent,
  BarChart3, Calendar, FileDown, X, Save, Edit3
} from 'lucide-react';
import {
  getTrades, addTrade, closeTrade, cancelTrade,
  deleteTrade, updateTradeNotes, getPortfolioStats,
  getMonthlyPerformance, type Trade,
} from '@/services/portfolioService';
import { exportTradeJournalToPDF } from '@/services/pdfExportService';

const ASSETS = ['XAU/USD', 'BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'SOL/USD', 'BNB/USD', 'XRP/USD'];
const STRATEGIES = ['Signal IA', 'Breakout', 'Retracement', 'Smart Money', 'News Trading', 'Scalping', 'Swing'];

export default function Portfolio() {
  const [trades, setTrades] = useState<Trade[]>(getTrades());
  const [stats, setStats] = useState(getPortfolioStats());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'performance'>('open');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({
    asset: 'XAU/USD',
    type: 'ACHAT' as 'ACHAT' | 'VENTE',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    size: '1',
    strategy: 'Signal IA',
    notes: '',
  });

  const refresh = useCallback(() => {
    const t = getTrades();
    setTrades(t);
    setStats(getPortfolioStats());
  }, []);

  const handleAddTrade = () => {
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    const size = parseFloat(form.size);
    if (!entry || !sl || !tp || !size) return;

    addTrade({
      asset: form.asset,
      type: form.type,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      size,
      strategy: form.strategy,
      notes: form.notes,
    });
    setForm({ asset: 'XAU/USD', type: 'ACHAT', entryPrice: '', stopLoss: '', takeProfit: '', size: '1', strategy: 'Signal IA', notes: '' });
    setShowForm(false);
    refresh();
  };

  const handleCloseTrade = (id: string) => {
    const exitPrice = prompt('Prix de clôture ?');
    if (!exitPrice || isNaN(parseFloat(exitPrice))) return;
    closeTrade(id, parseFloat(exitPrice));
    refresh();
  };

  const handleExportPDF = () => {
    exportTradeJournalToPDF(trades, stats);
  };

  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const monthlyPerf = getMonthlyPerformance();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Journal de Trading</h1>
            <p className="text-xs text-slate-400">Suivez vos trades, analysez vos performances</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
          >
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Nouveau Trade
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
          <Wallet className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(0)} EUR
          </p>
          <p className="text-xs text-slate-500">P&L Total</p>
        </div>
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <Percent className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{stats.winRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Win Rate ({stats.winCount}/{stats.closedTrades})</p>
        </div>
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 text-center">
          <Target className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-400">{stats.profitFactor.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Profit Factor</p>
        </div>
        <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-4 text-center">
          <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-400">{stats.totalTrades}</p>
          <p className="text-xs text-slate-500">{stats.openTrades} ouverts / {stats.closedTrades} fermés</p>
        </div>
      </div>

      {/* New Trade Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white mb-2">Enregistrer un trade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Actif</label>
              <select value={form.asset} onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50">
                {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50">
                <option value="ACHAT">ACHAT</option>
                <option value="VENTE">VENTE</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Stratégie</label>
              <select value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50">
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Prix d&apos;entrée</label>
              <input type="number" step="0.0001" value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Stop Loss</label>
              <input type="number" step="0.0001" value={form.stopLoss} onChange={e => setForm(f => ({ ...f, stopLoss: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Take Profit</label>
              <input type="number" step="0.0001" value={form.takeProfit} onChange={e => setForm(f => ({ ...f, takeProfit: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Taille (lots)</label>
              <input type="number" step="0.01" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleAddTrade} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all">
              Enregistrer le trade
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">
              Annuler
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'open' as const, label: `Trades Ouverts (${openTrades.length})`, icon: TrendingUp },
          { id: 'closed' as const, label: `Trades Fermés (${closedTrades.length})`, icon: CheckCircle },
          { id: 'performance' as const, label: 'Performance', icon: BarChart3 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Open Trades */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {openTrades.length > 0 ? openTrades.map(trade => (
            <motion.div key={trade.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.type === 'ACHAT' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {trade.type === 'ACHAT' ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{trade.asset}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trade.type === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{trade.type}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">{trade.strategy}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Entrée: {trade.entryPrice.toFixed(4)} | SL: {trade.stopLoss.toFixed(4)} | TP: {trade.takeProfit.toFixed(4)} | Taille: {trade.size}
                    </p>
                    {trade.notes && <p className="text-xs text-slate-500 mt-1">{trade.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCloseTrade(trade.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                    Clôturer
                  </button>
                  <button onClick={() => { cancelTrade(trade.id); refresh(); }} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-400">Aucun trade ouvert</p>
            </div>
          )}
        </div>
      )}

      {/* Closed Trades */}
      {activeTab === 'closed' && (
        <div className="space-y-3">
          {closedTrades.length > 0 ? closedTrades.map(trade => (
            <motion.div key={trade.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(trade.pnl || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {(trade.pnl || 0) >= 0 ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{trade.asset}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trade.type === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{trade.type}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">{trade.strategy}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>Entrée: {trade.entryPrice.toFixed(4)}</span>
                      <span>Sortie: {trade.exitPrice?.toFixed(4)}</span>
                      <span className={`font-bold ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)} EUR ({(trade.pnlPercent || 0) >= 0 ? '+' : ''}{trade.pnlPercent?.toFixed(2)}%)
                      </span>
                    </div>
                    {editingNotes === trade.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input value={noteText} onChange={e => setNoteText(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white" />
                        <button onClick={() => { updateTradeNotes(trade.id, noteText); setEditingNotes(null); refresh(); }} className="p-1 rounded bg-emerald-500/20">
                          <Save className="w-3 h-3 text-emerald-400" />
                        </button>
                        <button onClick={() => setEditingNotes(null)} className="p-1 rounded bg-red-500/10">
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ) : trade.notes ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{trade.notes}</p>
                        <button onClick={() => { setEditingNotes(trade.id); setNoteText(trade.notes || ''); }} className="text-slate-600 hover:text-slate-400">
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNotes(trade.id); setNoteText(''); }} className="text-xs text-slate-600 hover:text-slate-400 mt-1 flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Ajouter une note
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={() => { deleteTrade(trade.id); refresh(); }} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-400">Aucun trade fermé</p>
            </div>
          )}
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Monthly Performance */}
          {monthlyPerf.length > 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" /> Performance Mensuelle
              </h3>
              <div className="space-y-3">
                {monthlyPerf.map(m => (
                  <div key={m.month} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-slate-400">{m.month}</span>
                    <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.abs(m.pnl) / Math.max(...monthlyPerf.map(x => Math.abs(x.pnl))) * 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${m.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      />
                    </div>
                    <span className={`w-24 text-right text-sm font-bold ${m.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.pnl >= 0 ? '+' : ''}{m.pnl.toFixed(0)} EUR
                    </span>
                    <span className="w-16 text-right text-xs text-slate-500">{m.trades} trades</span>
                    <span className="w-16 text-right text-xs text-slate-400">{m.winRate.toFixed(0)}% WR</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-400">Pas encore assez de données</p>
            </div>
          )}

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Moyennes</h4>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-slate-400">Gain moyen</span><span className="text-sm text-emerald-400">+{stats.avgWin.toFixed(2)} EUR</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Perte moyenne</span><span className="text-sm text-red-400">{stats.avgLoss.toFixed(2)} EUR</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Meilleur trade</span><span className="text-sm text-emerald-400">+{stats.bestTrade.toFixed(2)} EUR</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Pire trade</span><span className="text-sm text-red-400">{stats.worstTrade.toFixed(2)} EUR</span></div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Ratios</h4>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-slate-400">Profit Factor</span><span className="text-sm text-blue-400">{stats.profitFactor.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Win Rate</span><span className="text-sm text-emerald-400">{stats.winRate.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Exposition actuelle</span><span className="text-sm text-amber-400">{stats.currentExposure.toFixed(0)} EUR</span></div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-slate-400">Trades gagnants</span><span className="text-sm text-emerald-400">{stats.winCount}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Trades perdants</span><span className="text-sm text-red-400">{stats.lossCount}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Trades ouverts</span><span className="text-sm text-blue-400">{stats.openTrades}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-400">Trades annulés</span><span className="text-sm text-slate-400">{trades.filter(t => t.status === 'CANCELLED').length}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
