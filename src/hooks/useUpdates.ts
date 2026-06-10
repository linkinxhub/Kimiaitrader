/**
 * Hook: useUpdates
 * Consomme les mises à jour de la plateforme en temps réel
 * Détecte automatiquement les nouvelles publications depuis l'Admin Panel
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllUpdates,
  getActiveUpdates,
  getPinnedUpdates,
  getRecentUpdates,
  hasUnreadUpdates,
  markUpdatesAsSeen,
  getUnreadCount,
  onUpdatePublished,
  addUpdate,
  editUpdate,
  deleteUpdate,
  toggleUpdateActive,
  togglePinned,
  resetUpdates,
  type PlatformUpdate,
} from '@/services/updateService';

export function useUpdates() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>(getActiveUpdates());
  const [pinned, setPinned] = useState<PlatformUpdate[]>(getPinnedUpdates());
  const [recent, setRecent] = useState<PlatformUpdate[]>(getRecentUpdates(5));
  const [hasUnread, setHasUnread] = useState(hasUnreadUpdates());
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    const active = getActiveUpdates();
    setUpdates(active);
    setPinned(getPinnedUpdates());
    setRecent(getRecentUpdates(5));
    setHasUnread(hasUnreadUpdates());
    setUnreadCount(getUnreadCount());
    setLastUpdate(new Date());
  }, []);

  // Auto-refresh on storage changes and custom events
  useEffect(() => {
    refresh();
    const unsubscribe = onUpdatePublished(() => refresh());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'xtrendai_platform_updates') refresh();
    };
    window.addEventListener('storage', handleStorage);
    // Poll every 10 seconds for new updates
    const interval = setInterval(refresh, 10000);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [refresh]);

  const markAsSeen = useCallback(() => {
    markUpdatesAsSeen();
    setHasUnread(false);
    setUnreadCount(0);
  }, []);

  return {
    updates,
    pinned,
    recent,
    hasUnread,
    unreadCount,
    lastUpdate,
    markAsSeen,
    refresh,
  };
}

export function useUpdateAdmin() {
  const [allUpdates, setAllUpdates] = useState<PlatformUpdate[]>(getAllUpdates);

  const refresh = useCallback(() => {
    setAllUpdates(getAllUpdates());
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = onUpdatePublished(() => refresh());
    return unsubscribe;
  }, [refresh]);

  const create = useCallback((data: Omit<PlatformUpdate, 'id' | 'publishedAt' | 'views'>) => {
    const u = addUpdate(data);
    refresh();
    return u;
  }, [refresh]);

  const edit = useCallback((id: string, changes: Partial<PlatformUpdate>) => {
    const u = editUpdate(id, changes);
    refresh();
    return u;
  }, [refresh]);

  const remove = useCallback((id: string) => {
    deleteUpdate(id);
    refresh();
  }, [refresh]);

  const toggleActive = useCallback((id: string) => {
    const active = toggleUpdateActive(id);
    refresh();
    return active;
  }, [refresh]);

  const togglePin = useCallback((id: string) => {
    const pinned = togglePinned(id);
    refresh();
    return pinned;
  }, [refresh]);

  const reset = useCallback(() => {
    resetUpdates();
    refresh();
  }, [refresh]);

  return {
    allUpdates,
    create,
    edit,
    remove,
    toggleActive,
    togglePin,
    reset,
    refresh,
  };
}
