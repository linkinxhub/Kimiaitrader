/**
 * PWA Hook - Service Worker Registration
 * Gère l'installation, les mises à jour et le statut offline
 */

import { useState, useEffect, useCallback } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  canInstall: boolean;
  hasUpdate: boolean;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    canInstall: false,
    hasUpdate: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    setStatus(prev => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone,
    }));

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setStatus(prev => ({ ...prev, canInstall: true }));
    };

    // Listen for app installed
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }));
    };

    // Online/offline
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setStatus(prev => ({ ...prev, hasUpdate: true }));
                }
              });
            }
          });
        })
        .catch((err) => console.log('[PWA] SW registration failed:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }));
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.update();
        window.location.reload();
      });
    }
  }, []);

  return { ...status, install, updateApp };
}
