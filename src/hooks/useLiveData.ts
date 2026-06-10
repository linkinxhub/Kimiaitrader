/**
 * useLiveData — Hook React pour les données live
 * 
 * Retourne immédiatement les données statiques, puis se met à jour
 * quand les données live arrivent. Non-bloquant par design.
 */

import { useState, useEffect, useCallback } from 'react';
import { liveDataService, type PriceData } from '@/services/liveDataService';

export function useLiveData() {
  const [data, setData] = useState<Record<string, PriceData>>(() => liveDataService.getData());
  const [isLive, setIsLive] = useState(() => liveDataService.getIsLive());

  // Démarre le service au premier montage
  useEffect(() => {
    liveDataService.start();
  }, []);

  // S'abonne aux mises à jour
  useEffect(() => {
    const unsub = liveDataService.subscribe((newData, live) => {
      setData({ ...newData });
      setIsLive(live);
    });
    return unsub;
  }, []);

  const refresh = useCallback(() => {
    liveDataService.start();
  }, []);

  return { data, isLive, refresh };
}
