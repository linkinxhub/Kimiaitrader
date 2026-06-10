/**
 * MegaFooter — Footer complet avec toutes les fonctionnalités détaillées
 * 6 colonnes : Brand, Core, Pro, Expert, Ressources, Légal
 * Chaque feature a sa description et son icône.
 */

import { motion } from 'framer-motion';
import {
  Zap, Check, Shield, AlertTriangle, Mail, MapPin, Phone,
  ExternalLink, BookOpen, HelpCircle, FileText, Lock, UserCheck,
  TrendingUp, Sparkles, ArrowRight, Crown, Star, Award, Gem,
} from 'lucide-react';

interface FooterProps {
  prices: { pro: number; expert: number; institutional: number };
  formatCurrency: (n: number) => string;
}

const CORE_FEATURES = [
  { icon: '⚡', label: 'Dashboard temps réel', desc: '90+ actifs, prix live' },
  { icon: '🎯', label: 'Signaux IA', desc: 'Entry/SL/TP3, ratio R/R' },
  { icon: '📊', label: 'Analyse technique', desc: 'RSI, MACD, EMA, Bollinger' },
  { icon: '📰', label: 'News Center IA', desc: '26 sources, scoring impact' },
  { icon: '🔔', label: 'Alertes prix', desc: 'Personnalisées, temps réel' },
  { icon: '🛡️', label: 'Gestion risques', desc: 'Règle 2%, drawdown' },
  { icon: '💹', label: 'Sentiment marché', desc: 'Fear & Greed Index' },
  { icon: '📅', label: 'Calendrier éco', desc: 'News, earnings, FOMC' },
];

const PRO_FEATURES = [
  { icon: '🎯', label: 'Radar Opportunités', desc: 'Détection auto, score IA' },
  { icon: '🔍', label: 'Scanner Marché', desc: 'MACD/RSI/EMA50, alertes' },
  { icon: '⚖️', label: 'Comparatif Multi-Actifs', desc: '12 actifs côte à côte' },
  { icon: '🏛️', label: 'Centre Institutionnel', desc: 'Multi-timeframes M15-D1' },
  { icon: '💰', label: 'Centre Rentabilité', desc: 'Grading A+/B/C/D' },
  { icon: '🧪', label: 'Simulateur & Lab', desc: 'Backtesting, optimisation' },
  { icon: '📈', label: 'XAU/USD Premium', desc: 'Analyse or dédiée' },
  { icon: '💎', label: 'Données LIVE', desc: '7 sources, fallback auto' },
];

const EXPERT_FEATURES = [
  { icon: '🧠', label: 'Smart Money Tracker', desc: 'BOS, CHoCH, OB, FVG' },
  { icon: '🤖', label: 'Assistant IA Trading', desc: 'OpenAI, Claude, Gemini, Ollama' },
  { icon: '💻', label: 'Export MT4/MT5', desc: 'MQL4/5, CSV, JSON' },
  { icon: '🔧', label: 'Strategy Lab', desc: 'Création stratégies IA' },
  { icon: '📡', label: 'WebSocket temps réel', desc: '<200ms latence' },
  { icon: '🔐', label: 'API Manager', desc: '7 providers, health monitor' },
];

const RESOURCES = [
  { icon: BookOpen, label: 'Guide de démarrage', desc: 'Premiers pas en 5 min' },
  { icon: HelpCircle, label: 'FAQ', desc: 'Questions fréquentes' },
  { icon: FileText, label: 'Blog Trading', desc: 'Analyses et stratégies' },
  { icon: TrendingUp, label: 'Tutoriels', desc: 'Vidéos pas à pas' },
  { icon: Shield, label: 'Sécurité', desc: 'Protection des données' },
  { icon: Award, label: 'Mises à jour', desc: 'Nouveautés et changelog' },
];

export default function MegaFooter({ prices, formatCurrency }: FooterProps) {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      {/* ─── MEGA FEATURES GRID ─────────────────────────── */}
      <div className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Toutes les <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">fonctionnalités</span> en détail
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Chaque outil est conçu pour vous donner un avantage mesurable sur les marchés. De l'analyse IA aux concepts institutionnels.
            </p>
          </motion.div>

          {/* 3 columns: Core / Pro / Expert */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Core (Free) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-emerald-900/10 to-transparent border border-emerald-500/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">GRATUIT</span>
                <span className="text-sm text-slate-500">{CORE_FEATURES.length} fonctionnalités</span>
              </div>
              <div className="space-y-3">
                {CORE_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <span className="text-lg flex-shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-blue-900/10 to-transparent border border-blue-500/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold">PRO</span>
                <span className="text-sm text-slate-500">{PRO_FEATURES.length} fonctionnalités</span>
                <span className="ml-auto text-xs text-blue-400 font-mono">{formatCurrency(prices.pro)}€/mo</span>
              </div>
              <div className="space-y-3">
                {PRO_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <span className="text-lg flex-shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-blue-500/10">
                <p className="text-xs text-blue-400 flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Inclut tout le pack Gratuit
                </p>
              </div>
            </motion.div>

            {/* Expert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-purple-900/10 to-transparent border border-purple-500/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-semibold">EXPERT</span>
                <span className="text-sm text-slate-500">{EXPERT_FEATURES.length} fonctionnalités</span>
                <span className="ml-auto text-xs text-purple-400 font-mono">{formatCurrency(prices.expert)}€/mo</span>
              </div>
              <div className="space-y-3">
                {EXPERT_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <span className="text-lg flex-shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/10">
                <p className="text-xs text-purple-400 flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Inclut tout Pro + Gratuit
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── LINKS FOOTER ───────────────────────────────── */}
      <div className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  XTrendAI Pro
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-4 max-w-xs">
                Plateforme de trading propulsée par l'IA. Données temps réel de 7 sources, 
                signaux avec Entry/SL/TP, et analyse institutionnelle.
              </p>
              <div className="space-y-2 text-xs text-slate-600">
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> contact@xtrendai.pro</p>
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Paris, France</p>
              </div>
            </div>

            {/* Fonctionnalités */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-blue-400" /> Fonctionnalités
              </p>
              <div className="space-y-2">
                {['Dashboard temps réel', 'Signaux IA', 'Analyse technique', 'Radar Opportunités', 'Scanner Marché', 'Smart Money', 'Assistant IA', 'Sentiment & Volatilité'].map((f, i) => (
                  <p key={i} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">{f}</p>
                ))}
              </div>
            </div>

            {/* Packs */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Packs
              </p>
              <div className="space-y-2">
                <p className="text-xs text-emerald-400">Free (0€/mois)</p>
                <p className="text-xs text-blue-400">Pro ({formatCurrency(prices.pro)}€/mois)</p>
                <p className="text-xs text-purple-400">Expert ({formatCurrency(prices.expert)}€/mois)</p>
                <p className="text-xs text-slate-400">Institutionnel (sur devis)</p>
              </div>
            </div>

            {/* Ressources */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-violet-400" /> Ressources
              </p>
              <div className="space-y-2">
                {RESOURCES.map((r, i) => (
                  <p key={i} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5">
                    <r.icon className="w-3 h-3" /> {r.label}
                  </p>
                ))}
              </div>
            </div>

            {/* Légal */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" /> Légal
              </p>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Mentions légales</p>
                <p className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Confidentialité (RGPD)</p>
                <p className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">CGU</p>
                <p className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">CGV</p>
                <p className="text-xs text-amber-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Avertissement risque
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              © 2026 XTrendAI Pro. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Service opérationnel
              </span>
              <span className="text-[10px] text-slate-700">
                Le trading comporte des risques. Ne tradez jamais avec des fonds que vous ne pouvez pas perdre.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
