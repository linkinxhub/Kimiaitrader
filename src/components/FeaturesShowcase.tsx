/**
 * FeaturesShowcase — Projection de TOUTES les fonctionnalités admin sur la vitrine
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import {
  Activity, Brain, BarChart3, Zap, Shield, TrendingUp,
  Sparkles, Check, Star, Crown, ChevronRight, XCircle,
  Bell, FlaskConical, Bot, Globe, Newspaper, Cpu,
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  capabilities: string[];
  pack: string;
  color: string;
  bg: string;
}

const FEATURES: Feature[] = [
  { icon: Activity, title: 'Dashboard Temps Réel', description: 'Votre cockpit de trading. 90+ actifs surveillés en permanence avec prix live, signaux IA, et indicateurs techniques.', capabilities: ['Prix live 90+ actifs', 'Signaux IA temps réel', 'RSI, MACD, EMA', 'WebSocket <200ms'], pack: 'Free', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
  { icon: Brain, title: 'Signaux IA — Entry/SL/TP', description: 'Notre IA analyse le marché 24/7 et génère des signaux complets avec prix d\'entrée, Stop Loss et 3 niveaux de Take Profit.', capabilities: ['Signaux ACHAT/VENTE', 'Entry/SL/TP1/TP2/TP3', 'Ratio R/R calculé', 'Score confiance 0-100'], pack: 'Free', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
  { icon: BarChart3, title: 'Analyse Technique', description: 'Indicateurs techniques avancés calculés sur données réelles : RSI, MACD, EMA 20/50, Bollinger, supports/résistances.', capabilities: ['RSI/MACD/EMA', 'Bollinger Bands', 'Supports/Résistances', 'Multi-timeframes'], pack: 'Free', color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-600/5 border-purple-500/20' },
  { icon: Bell, title: 'Alertes de Prix', description: 'Créez des alertes personnalisées sur 9 actifs. Déclenchement automatique quand un prix atteint votre niveau cible.', capabilities: ['9 actifs couverts', '3 types de conditions', 'Déclenchement auto', 'Historique complet'], pack: 'Free', color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
  { icon: TrendingUp, title: 'XAU/USD Premium', description: 'Prix de l\'or en temps réel via Currency-API. Supports/résistances dynamiques, analyse multi-timeframes M5 à D1.', capabilities: ['Prix temps réel', 'Zones institutionnelles', 'Analyse M5→D1', 'Détection Order Blocks'], pack: 'Pro', color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20' },
  { icon: Zap, title: 'Radar Opportunités IA', description: 'Détection automatique des meilleures opportunités sur le marché avec scoring IA 0-100 et analyse R/R.', capabilities: ['Détection auto', 'Score 0-100', 'Analyse R/R', 'Filtres avancés'], pack: 'Pro', color: 'text-cyan-400', bg: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20' },
  { icon: FlaskConical, title: 'Labo Stratégies', description: 'Backtestez 5 stratégies sur données réelles Binance. Win Rate, Profit Factor, Drawdown Max en temps réel.', capabilities: ['5 stratégies', 'Données Binance', 'Métriques complètes', 'Optimisation'], pack: 'Expert', color: 'text-indigo-400', bg: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20' },
  { icon: Shield, title: 'Smart Money Tracker', description: 'Détection automatique des concepts institutionnels : Order Blocks, FVG, Breaker Blocks, Liquidité, BOS/CHOCH.', capabilities: ['7 concepts SMC', 'Niveaux temps réel', 'Synthèse directionnelle', 'Détection auto'], pack: 'Expert', color: 'text-rose-400', bg: 'from-rose-500/10 to-rose-600/5 border-rose-500/20' },
  { icon: Bot, title: 'Assistant IA Trading', description: 'Connectez votre clé API OpenAI/Claude pour des analyses personnalisées en streaming avec les données marché.', capabilities: ['GPT-4o/Claude 3.5', 'Streaming temps réel', 'Analyse par actif', 'Mode simulation'], pack: 'Expert', color: 'text-violet-400', bg: 'from-violet-500/10 to-violet-600/5 border-violet-500/20' },
  { icon: Globe, title: 'Export MetaTrader', description: 'Exportez vos signaux vers MT4/MT5. Code MQL4/MQL5 généré automatiquement avec Entry, SL, TP.', capabilities: ['MQL4/MQL5', 'CSV/JSON', 'Code prêt', 'Expert Advisor'], pack: 'Expert', color: 'text-slate-400', bg: 'from-slate-500/10 to-slate-600/5 border-slate-500/20' },
  { icon: Cpu, title: 'Simulateur Trading', description: 'Simulateur avec 17 signaux IA, capital virtuel, calculateur de position et mode apprentissage pédagogique.', capabilities: ['17 signaux IA', 'Capital virtuel', 'Mode apprentissage', 'Gestion risque'], pack: 'Pro', color: 'text-teal-400', bg: 'from-teal-500/10 to-teal-600/5 border-teal-500/20' },
  { icon: Newspaper, title: 'Centre Intelligence', description: 'Analyse automatique du sentiment de marché, détection de patterns et signaux de reversal basés sur l\'IA.', capabilities: ['Sentiment marché', 'Détection patterns', 'Signaux reversal', 'Alertes volatilité'], pack: 'Pro', color: 'text-orange-400', bg: 'from-orange-500/10 to-orange-600/5 border-orange-500/20' },
  { icon: Crown, title: 'Journal Trading P&L', description: 'Suivez chaque trade avec P&L calculé automatiquement, win rate, profit factor et performance mensuelle.', capabilities: ['P&L auto', 'Win rate', 'Profit factor', 'Export PDF'], pack: 'Free', color: 'text-pink-400', bg: 'from-pink-500/10 to-pink-600/5 border-pink-500/20' },
  { icon: Sparkles, title: 'Simulateur 17 Signaux', description: 'Apprentissage interactif avec 17 scénarios de signaux IA. Capital virtuel, feedback pédagogique et suivi progrès.', capabilities: ['17 scénarios', 'Capital virtuel 100k', 'Feedback IA', 'Suivi progrès'], pack: 'Pro', color: 'text-lime-400', bg: 'from-lime-500/10 to-lime-600/5 border-lime-500/20' },
];

const COMPARISON = [
  ['Signaux IA illimités', true, true, true],
  ['XAU/USD Premium', false, true, true],
  ['Radar Opportunités', false, true, true],
  ['Smart Money Tracker', false, false, true],
  ['Labo Stratégies', false, false, true],
  ['Assistant IA', false, false, true],
  ['Export MT4/5', false, false, true],
  ['Simulateur 17 signaux', false, true, true],
  ['Alertes prix avancées', false, true, true],
  ['Journal Trading P&L', true, true, true],
  ['WebSocket <200ms', true, true, true],
  ['Support prioritaire', false, false, true],
  ['API Trading', false, false, true],
  ['Multi-comptes', false, false, true],
  ['White label', false, false, true],
  ['Account manager', false, false, true],
];

export default function FeaturesShowcase() {
  const navigate = useNavigate();
  const [activePack, setActivePack] = useState<'ALL' | 'Free' | 'Pro' | 'Expert'>('ALL');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const packs: Array<'ALL' | 'Free' | 'Pro' | 'Expert'> = ['ALL', 'Free', 'Pro', 'Expert'];

  const filtered = activePack === 'ALL' ? FEATURES : FEATURES.filter(f => f.pack === activePack);

  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-4 inline-block">
            <Sparkles className="w-4 h-4 inline mr-2" /> Toutes les fonctionnalités
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">14 Fonctionnalités, 3 Packs</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Chaque fonctionnalité est connectée aux données de marché en temps réel. Aucune simulation.</p>
        </motion.div>

        {/* Pack Filter */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {packs.map(pack => (
            <button
              key={pack}
              onClick={() => setActivePack(pack)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePack === pack
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {pack === 'ALL' ? 'Tous' : pack === 'Free' ? 'Gratuit' : pack === 'Pro' ? 'Pro' : 'Expert'}
              {pack !== 'ALL' && <span className="ml-1.5 text-xs opacity-60">({FEATURES.filter(f => f.pack === pack).length})</span>}
            </button>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <AnimatePresence mode="popLayout">
            {filtered.map((feature, i) => {
              const Icon = feature.icon;
              const isExpanded = expandedFeature === feature.title;
              return (
                <motion.div
                  key={feature.title}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-gradient-to-br ${feature.bg} border rounded-2xl p-6 hover:scale-[1.02] transition-all cursor-pointer`}
                  onClick={() => setExpandedFeature(isExpanded ? null : feature.title)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          feature.pack === 'Free' ? 'bg-emerald-500/20 text-emerald-400' :
                          feature.pack === 'Pro' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>{feature.pack}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{feature.description}</p>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 pt-2 border-t border-slate-700/50">
                              {feature.capabilities.map((cap, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  <span className="text-xs text-slate-300">{cap}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <Star className="w-3 h-3" />
                        <span>{feature.capabilities.length} capacités</span>
                        <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Tableau Comparatif</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Fonctionnalité</th>
                  <th className="px-4 py-3 text-center text-emerald-400 font-medium">Free</th>
                  <th className="px-4 py-3 text-center text-amber-400 font-medium">Pro</th>
                  <th className="px-4 py-3 text-center text-purple-400 font-medium">Expert</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feature, free, pro, expert], i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-4 py-2.5 text-slate-300">{feature as string}</td>
                    <td className="px-4 py-2.5 text-center">{free ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-700 mx-auto" />}</td>
                    <td className="px-4 py-2.5 text-center">{pro ? <Check className="w-4 h-4 text-amber-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-700 mx-auto" />}</td>
                    <td className="px-4 py-2.5 text-center">{expert ? <Check className="w-4 h-4 text-purple-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-700 mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <p className="text-slate-400 text-sm mb-4">Commencez gratuitement. Passez à Pro quand vous serez prêt.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/register?plan=pro')} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <Crown className="w-4 h-4" /> Essai Gratuit
            </button>
            <button onClick={() => navigate('/subscription')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" /> Voir les prix
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
