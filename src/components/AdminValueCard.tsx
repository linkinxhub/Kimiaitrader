/**
 * AdminValueCard — Carte "Valeur ajoutee" pour chaque rubrique admin
 * Explique le role, l'utilite, les modules connectes et les actions rapides
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Zap, AlertTriangle, CheckCircle,
  XCircle, HelpCircle, ExternalLink, Settings, Eye, BarChart3,
  type LucideIcon,
} from 'lucide-react';

export interface ValueCardProps {
  title: string;
  icon: LucideIcon;
  summary: string;
  userValue: string;
  adminValue: string;
  modulesConnected: string[];
  dataSources: string[];
  packs: ('Free' | 'Pro' | 'Expert' | 'Institutionnel')[];
  recommendedSettings: string[];
  quickActions?: { label: string; onClick: () => void; icon?: LucideIcon }[];
  impactLevel: 'faible' | 'moyen' | 'fort' | 'critique';
  configStatus: 'complet' | 'incomplet' | 'a-configurer' | 'erreur';
}

const IMPACT_COLORS = {
  faible: { badge: 'bg-slate-500/10 text-slate-400', label: 'Impact faible' },
  moyen: { badge: 'bg-blue-500/10 text-blue-400', label: 'Impact moyen' },
  fort: { badge: 'bg-amber-500/10 text-amber-400', label: 'Impact fort' },
  critique: { badge: 'bg-rose-500/10 text-rose-400', label: 'Impact critique' },
};

const STATUS_COLORS = {
  complet: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Complet' },
  incomplet: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Incomplet' },
  'a-configurer': { icon: Settings, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'A configurer' },
  erreur: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Erreur' },
};

const PACK_COLORS: Record<string, string> = {
  Free: 'bg-slate-600/20 text-slate-400',
  Pro: 'bg-amber-600/20 text-amber-400',
  Expert: 'bg-purple-600/20 text-purple-400',
  Institutionnel: 'bg-rose-600/20 text-rose-400',
};

export default function AdminValueCard({
  title, icon: Icon, summary, userValue, adminValue,
  modulesConnected, dataSources, packs, recommendedSettings,
  quickActions, impactLevel, configStatus,
}: ValueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const impact = IMPACT_COLORS[impactLevel];
  const status = STATUS_COLORS[configStatus];
  const StatusIcon = status.icon;

  return (
    <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header — toujours visible */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${impact.badge}`}>{impact.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${status.bg} ${status.color}`}>
                <StatusIcon className="w-3 h-3" /> {status.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{summary}</p>
          </div>
          <div className="shrink-0 self-center">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>

        {/* Badges packs — toujours visibles */}
        <div className="flex gap-1.5 mt-2 ml-[48px]">
          {packs.map(p => (
            <span key={p} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${PACK_COLORS[p]}`}>{p}</span>
          ))}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
              {/* Valeur utilisateur / admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                  <p className="text-[10px] text-emerald-500 uppercase font-semibold mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Valeur pour l&apos;utilisateur</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{userValue}</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                  <p className="text-[10px] text-blue-500 uppercase font-semibold mb-1 flex items-center gap-1"><Settings className="w-3 h-3" /> Valeur pour l&apos;administrateur</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{adminValue}</p>
                </div>
              </div>

              {/* Modules & Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Modules connectes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {modulesConnected.map(m => (
                      <span key={m} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-400">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Sources de donnees</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dataSources.map(d => (
                      <span key={d} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-400">{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reglages recommandes */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Reglages recommandes</p>
                <ul className="space-y-1">
                  {recommendedSettings.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 text-emerald-500/60" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions rapides */}
              {quickActions && quickActions.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Actions rapides</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((a, i) => (
                      <button key={i} onClick={a.onClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors">
                        {a.icon && <a.icon className="w-3 h-3" />} {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
