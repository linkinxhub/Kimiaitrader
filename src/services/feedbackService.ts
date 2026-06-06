import type { FeedbackEntry, Pack } from "@/types";
import { average, readStorage, writeStorage } from "@/lib/utils";

const FEEDBACK_KEY = "xtrendai_feedback";

const DEFAULT_FEEDBACK: FeedbackEntry[] = [
  {
    id: "fb_1",
    userName: "Nicolas V.",
    pack: "pro",
    rating: 5,
    comment: "Le radar Pro m'aide à filtrer le bruit et à gagner du temps chaque matin.",
    verified: true,
    results: { winRate: 67.8, pnl: 2480, period: "90 jours" },
  },
  {
    id: "fb_2",
    userName: "Sofia M.",
    pack: "expert",
    rating: 5,
    comment: "Le labo de stratégies et l'assistant IA m'ont permis de standardiser mes setups.",
    verified: true,
    results: { winRate: 72.4, pnl: 6310, period: "120 jours" },
  },
  {
    id: "fb_3",
    userName: "Karim D.",
    pack: "institutional",
    rating: 5,
    comment: "Le suivi multi-comptes et les exports améliorent notre exécution d'équipe.",
    verified: true,
    results: { winRate: 77.1, pnl: 18420, period: "180 jours" },
  },
  {
    id: "fb_4",
    userName: "Laura P.",
    pack: "free",
    rating: 4,
    comment: "Même la version Free donne une très bonne vision du produit.",
    verified: true,
    results: { winRate: 54.2, pnl: 0, period: "30 jours" },
  },
  {
    id: "fb_5",
    userName: "Mehdi S.",
    pack: "pro",
    rating: 5,
    comment: "Le module XAU/USD vaut clairement le prix du pack.",
    verified: true,
    results: { winRate: 64.9, pnl: 2190, period: "75 jours" },
  },
  {
    id: "fb_6",
    userName: "Camille R.",
    pack: "expert",
    rating: 5,
    comment: "Le journal de trading et les alertes me gardent disciplinée.",
    verified: true,
    results: { winRate: 69.7, pnl: 4910, period: "110 jours" },
  },
  {
    id: "fb_7",
    userName: "Yanis B.",
    pack: "institutional",
    rating: 4,
    comment: "Bonne profondeur business et vraie visibilité sur les flux marché.",
    verified: true,
    results: { winRate: 75.6, pnl: 16280, period: "150 jours" },
  },
  {
    id: "fb_8",
    userName: "Julie A.",
    pack: "pro",
    rating: 5,
    comment: "L'interface est claire, rapide, et orientée décision.",
    verified: true,
    results: { winRate: 66.1, pnl: 2740, period: "95 jours" },
  },
];

function getFeedback() {
  return readStorage<FeedbackEntry[]>(FEEDBACK_KEY, DEFAULT_FEEDBACK);
}

export function getVerifiedFeedback() {
  return getFeedback().filter((entry) => entry.verified);
}

export function getAverageRating() {
  return average(getFeedback().map((entry) => entry.rating));
}

export function getStatsByPack(pack: Pack) {
  const entries = getFeedback().filter((entry) => entry.pack === pack);
  return {
    count: entries.length,
    averageRating: average(entries.map((entry) => entry.rating)),
    averageWinRate: average(entries.map((entry) => entry.results.winRate)),
    averagePnl: average(entries.map((entry) => entry.results.pnl)),
  };
}

export function addFeedback(entry: FeedbackEntry) {
  writeStorage(FEEDBACK_KEY, [entry, ...getFeedback()]);
}
