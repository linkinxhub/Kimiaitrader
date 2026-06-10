import { useMemo, useCallback } from 'react';
import type { PackId } from '@/types/packs';
import { PACK_HIERARCHY } from '@/types/packs';
import { useAuth } from './useAuth';

export function usePackAccess() {
  const { user } = useAuth();

  const userPack = useMemo((): PackId => {
    if (!user) return 'free';
    const pack = user.pack as string;
    if (pack === 'pro' || pack === 'expert' || pack === 'institutional' || pack === 'free') {
      return pack as PackId;
    }
    return 'free';
  }, [user]);

  const canAccess = useCallback((requiredPack: PackId): boolean => {
    return PACK_HIERARCHY[userPack] >= PACK_HIERARCHY[requiredPack];
  }, [userPack]);

  const isFree = userPack === 'free';
  const isPro = PACK_HIERARCHY[userPack] >= 1;
  const isExpert = PACK_HIERARCHY[userPack] >= 2;
  const isInstitutional = userPack === 'institutional';

  const minPackRequired = useCallback((requiredPack: PackId): PackId | null => {
    if (canAccess(requiredPack)) return null;
    return requiredPack;
  }, [canAccess]);

  return {
    userPack,
    canAccess,
    minPackRequired,
    isFree,
    isPro,
    isExpert,
    isInstitutional,
  };
}
