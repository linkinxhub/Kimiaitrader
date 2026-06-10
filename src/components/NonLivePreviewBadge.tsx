/**
 * NonLivePreviewBadge — Badge obligatoire pour tous les aperçus marketing
 * 
 * RÈGLE: Tout aperçu de données sur le site vitrine public DOIT porter ce badge.
 * Le site vitrine ne doit jamais présenter des données comme réelles.
 */

import { Eye } from 'lucide-react';

interface Props {
  text?: string;
  className?: string;
}

export function NonLivePreviewBadge({ 
  text = "Aperçu démo — données non réelles", 
  className = '' 
}: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-medium ${className}`}>
      <Eye className="w-3 h-3" />
      {text}
    </span>
  );
}

export function LiveDataBadge({ source }: { source?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live{source ? ` — ${source}` : ''}
    </span>
  );
}

export function DataStatusBadge({ status }: { status: 'live' | 'cached' | 'delayed' | 'unavailable' }) {
  const config = {
    live: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    cached: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    delayed: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    unavailable: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${c.bg} border ${c.border} text-[10px] ${c.text} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
