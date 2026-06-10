export type PackId = 'free' | 'pro' | 'expert' | 'institutional';

export interface PackFeature {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  packRequired: PackId;
  category: 'ia' | 'trading' | 'risk' | 'education' | 'marketplace' | 'admin';
  icon: string;
  badge: string;
  visibleOnLanding: boolean;
  visibleInApp: boolean;
  order: number;
  status: 'active' | 'coming_soon' | 'inactive';
  version: string;
  dateAdded: string;
}

export interface UserPack {
  packId: PackId;
  packName: string;
  price: number;
  period: string;
  expiresAt?: Date;
  isActive: boolean;
}

export const PACK_HIERARCHY: Record<PackId, number> = {
  free: 0,
  pro: 1,
  expert: 2,
  institutional: 3,
};

export const PACK_LABELS: Record<PackId, string> = {
  free: 'Free',
  pro: 'Pro',
  expert: 'Expert',
  institutional: 'Institutionnel',
};

export const PACK_COLORS: Record<PackId, string> = {
  free: 'text-slate-400',
  pro: 'text-amber-400',
  expert: 'text-purple-400',
  institutional: 'text-rose-400',
};

export const PACK_BG_COLORS: Record<PackId, string> = {
  free: 'bg-slate-500/10 border-slate-500/20',
  pro: 'bg-amber-500/10 border-amber-500/20',
  expert: 'bg-purple-500/10 border-purple-500/20',
  institutional: 'bg-rose-500/10 border-rose-500/20',
};
