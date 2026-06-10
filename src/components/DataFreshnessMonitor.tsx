/**
 * DataFreshnessMonitor — Indicateur de fraîcheur des données
 * 
 * Affiche l'âge des données et leur source (live/demo).
 * Se met à jour automatiquement toutes les 5 secondes.
 */

import { useState, useEffect } from 'react';
import { Wifi, Clock, AlertTriangle } from 'lucide-react';
import { liveDataService } from '@/services/liveDataService';

export function DataFreshnessMonitor({ className = '' }: { className?: string }) {
  const [age, setAge] = useState(() => liveDataService.getDataAge());
  const [isLive, setIsLive] = useState(() => liveDataService.getIsLive());

  useEffect(() => {
    // S'abonne au service
    const unsub = liveDataService.subscribe((_, live) => {
      setIsLive(live);
      setAge(liveDataService.getDataAge());
    });

    // Met à jour l'âge toutes les 5s
    const interval = setInterval(() => {
      setAge(liveDataService.getDataAge());
    }, 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  if (!isLive) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-[11px] text-slate-400 font-medium ${className}`}>
        <Clock className="w-3 h-3" /> Données de référence
      </span>
    );
  }

  if (age > 120) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium ${className}`}>
        <AlertTriangle className="w-3 h-3" /> Données vieilles ({Math.round(age / 60)}min)
      </span>
    );
  }

  if (age > 60) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-medium ${className}`}>
        <Clock className="w-3 h-3" /> Données décalées ({Math.round(age)}s)
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium ${className}`}>
      <Wifi className="w-3 h-3" /> Live — il y a {Math.round(age)}s
    </span>
  );
}
