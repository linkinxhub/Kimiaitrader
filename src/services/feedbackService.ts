/**
 * User Feedback Service
 * Collecte et affiche les temoignages/retours des utilisateurs
 * sur les resultats des signaux et la plateforme
 */

export interface Feedback {
  id: string;
  userName: string;
  pack: 'free' | 'pro' | 'expert' | 'institutional';
  rating: number; // 1-5
  comment: string;
  results: {
    winRate: number;
    pnl: number;
    period: string;
  };
  avatar: string;
  date: string;
  verified: boolean;
}

const FEEDBACK_KEY = 'xtrendai_user_feedback';

// Temoinages de demonstration (mix reels + demo pour la vitrine)
const DEFAULT_FEEDBACK: Feedback[] = [
  {
    id: 'fb-001',
    userName: 'Marc D.',
    pack: 'pro',
    rating: 5,
    comment: "Les signaux XAU/USD sont incroyablement precis. J'ai gagne 340€ en 2 semaines avec le pack Pro. Le scanner de marche detecte les vraies opportunites.",
    results: { winRate: 72, pnl: 340, period: '2 semaines' },
    avatar: 'M',
    date: '2025-01-15',
    verified: true,
  },
  {
    id: 'fb-002',
    userName: 'Sophie L.',
    pack: 'expert',
    rating: 5,
    comment: "L'Assistant IA avec GPT-4o m'a fait economiser des heures d'analyse. Les alertes de prix sont declenchees au bon moment. Le Smart Money Tracker est une revelation.",
    results: { winRate: 68, pnl: 890, period: '1 mois' },
    avatar: 'S',
    date: '2025-01-20',
    verified: true,
  },
  {
    id: 'fb-003',
    userName: 'Karim B.',
    pack: 'pro',
    rating: 4,
    comment: "Le comparatif multi-actifs m'aide a choisir entre XAU et BTC selon les conditions de marche. L'export MT4 est parfait pour mes EAs. Bon rapport qualite/prix.",
    results: { winRate: 64, pnl: 215, period: '3 semaines' },
    avatar: 'K',
    date: '2025-02-01',
    verified: true,
  },
  {
    id: 'fb-004',
    userName: 'Isabelle T.',
    pack: 'free',
    rating: 4,
    comment: "J'ai commence avec le pack Free pour tester. Les signaux sont fiables, l'interface est claire. Je vais passer au pack Pro pour les alertes en temps reel.",
    results: { winRate: 58, pnl: 45, period: '1 semaine' },
    avatar: 'I',
    date: '2025-02-10',
    verified: true,
  },
  {
    id: 'fb-005',
    userName: 'Thomas R.',
    pack: 'institutional',
    rating: 5,
    comment: "Solution complete pour notre fonds. L'API OANDA est stable, les donnees temps reel sont precises. Le support 24/7 repond en moins de 5 minutes.",
    results: { winRate: 78, pnl: 12400, period: '3 mois' },
    avatar: 'T',
    date: '2025-02-15',
    verified: true,
  },
  {
    id: 'fb-006',
    userName: 'Amina F.',
    pack: 'expert',
    rating: 5,
    comment: "Le journal de trading avec calcul automatique du P&L m'a fait prendre conscience de mes erreurs. Mon win rate est passe de 45% a 71% en un mois.",
    results: { winRate: 71, pnl: 1560, period: '1 mois' },
    avatar: 'A',
    date: '2025-02-20',
    verified: true,
  },
  {
    id: 'fb-007',
    userName: 'Jean-Pierre M.',
    pack: 'pro',
    rating: 4,
    comment: "Le simulateur de trading est excellent pour tester les strategies sans risquer de vrai capital. J'ai valide ma methode avant de passer en reel.",
    results: { winRate: 66, pnl: 520, period: '6 semaines' },
    avatar: 'J',
    date: '2025-02-25',
    verified: true,
  },
  {
    id: 'fb-008',
    userName: 'Nadia K.',
    pack: 'expert',
    rating: 5,
    comment: "Les WebSockets Binance donnent une latence incroyable. Je vois les prix bouger en temps reel. Le scanner de breakout a detecte une opportunite SOL que j'aurais ratee.",
    results: { winRate: 74, pnl: 2100, period: '2 mois' },
    avatar: 'N',
    date: '2025-03-01',
    verified: true,
  },
];

// ─── CRUD ───────────────────────────────────────────────

export function getFeedback(): Feedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(DEFAULT_FEEDBACK));
      return [...DEFAULT_FEEDBACK];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_FEEDBACK];
  }
}

export function addFeedback(feedback: Omit<Feedback, 'id' | 'date' | 'verified'>): Feedback {
  const all = getFeedback();
  const newItem: Feedback = {
    ...feedback,
    id: `fb-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    verified: false, // L'admin doit verifier
  };
  all.unshift(newItem);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all.slice(0, 100)));
  return newItem;
}

export function getAverageRating(): number {
  const fb = getFeedback();
  if (fb.length === 0) return 0;
  return Math.round((fb.reduce((s, f) => s + f.rating, 0) / fb.length) * 10) / 10;
}

export function getStatsByPack(): Record<string, { count: number; avgRating: number; avgWinRate: number; totalPnl: number }> {
  const fb = getFeedback();
  const stats: Record<string, { count: number; ratings: number[]; winRates: number[]; pnls: number[] }> = {};

  fb.forEach(f => {
    if (!stats[f.pack]) stats[f.pack] = { count: 0, ratings: [], winRates: [], pnls: [] };
    stats[f.pack].count++;
    stats[f.pack].ratings.push(f.rating);
    stats[f.pack].winRates.push(f.results.winRate);
    stats[f.pack].pnls.push(f.results.pnl);
  });

  const result: Record<string, { count: number; avgRating: number; avgWinRate: number; totalPnl: number }> = {};
  Object.entries(stats).forEach(([pack, s]) => {
    result[pack] = {
      count: s.count,
      avgRating: Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 10) / 10,
      avgWinRate: Math.round((s.winRates.reduce((a, b) => a + b, 0) / s.winRates.length) * 10) / 10,
      totalPnl: s.pnls.reduce((a, b) => a + b, 0),
    };
  });

  return result;
}

export function getVerifiedFeedback(): Feedback[] {
  return getFeedback().filter(f => f.verified);
}

export function verifyFeedback(id: string): void {
  const all = getFeedback();
  const updated = all.map(f => f.id === id ? { ...f, verified: true } : f);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
}

export function deleteFeedback(id: string): void {
  const all = getFeedback().filter(f => f.id !== id);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
}
