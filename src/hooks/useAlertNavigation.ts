/**
 * useAlertNavigation — Consomme le contexte d'alerte pour navigation intelligente
 * Les pages cibles utilisent ce hook pour scroller/highlight l'asset concerné
 */

import { useEffect, useState } from 'react';
import { consumeAlertContext, type AlertRoute } from '@/services/alertService';

export function useAlertNavigation() {
  const [alertContext, setAlertContext] = useState<AlertRoute | null>(null);

  useEffect(() => {
    const ctx = consumeAlertContext();
    if (ctx) {
      setAlertContext(ctx);
      // Scroll to the target asset after a short delay to let the page render
      if (ctx.asset) {
        setTimeout(() => {
          const elements = document.querySelectorAll(`[data-asset="${ctx.asset}"]`);
          if (elements.length > 0) {
            elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            elements[0].classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-950');
            setTimeout(() => {
              elements[0].classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-950');
            }, 3000);
          }
        }, 500);
      }
    }
  }, []);

  return alertContext;
}
