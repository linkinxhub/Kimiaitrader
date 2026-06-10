import { getDb } from "../server/queries/connection";
import { packs } from "./schema";

async function seed() {
  const db = getDb();

  const existingPacks = await db.select().from(packs);
  if (existingPacks.length > 0) {
    console.log("Packs already seeded, skipping...");
    return;
  }

  await db.insert(packs).values({
    slug: "free",
    name: "Free",
    description: "Accès limité pour découvrir la plateforme",
    priceMonthly: "0.00",
    priceYearly: "0.00",
    features: ["1 signal IA par jour", "Analyse M15", "Dashboard basique", "Support email"],
    limitations: ["Pas d'accès XAU/USD Premium", "Pas de Smart Money", "Pas de backtesting", "Pas d'Assistant IA"],
    order: 1,
    recommended: "no",
    active: "yes",
  });

  await db.insert(packs).values({
    slug: "pro",
    name: "Pro",
    description: "Pour les traders actifs cherchant des signaux précis",
    priceMonthly: "79.00",
    priceYearly: "790.00",
    features: ["Signaux IA illimités", "Module XAU/USD Premium", "Calendrier économique", "Analyse multi-timeframes", "Simulateur trading (17 signaux)", "Gestion du risque avancée", "Support prioritaire"],
    limitations: ["Pas de Smart Money Tracker", "Pas de Laboratoire de Stratégies", "Pas d'Assistant IA expert"],
    order: 2,
    recommended: "yes",
    active: "yes",
  });

  await db.insert(packs).values({
    slug: "expert",
    name: "Expert",
    description: "Outils professionnels pour traders confirmés",
    priceMonthly: "199.00",
    priceYearly: "1990.00",
    features: ["Tout le pack Pro", "Smart Money Tracker", "Laboratoire de Stratégies (backtest)", "Assistant IA Trading", "Radar d'opportunités IA", "Intelligence Center", "Centres d'intérêt économiques", "API privée"],
    limitations: [],
    order: 3,
    recommended: "no",
    active: "yes",
  });

  await db.insert(packs).values({
    slug: "institutional",
    name: "Institutionnel",
    description: "Solution complète pour les institutions",
    priceMonthly: "499.00",
    priceYearly: "4990.00",
    features: ["Tout le pack Expert", "Multi-comptes (10 traders)", "API dédiée avec rate limit élevé", "White label possible", "Support dédié 24/7", "Onboarding personnalisé", "Rapports mensuels custom", "SLA garanti"],
    limitations: [],
    order: 4,
    recommended: "no",
    active: "yes",
  });

  console.log("Seeded 4 packs successfully!");
}

seed().catch(console.error);
