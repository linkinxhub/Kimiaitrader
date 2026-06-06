import { loadStripe } from "@stripe/stripe-js";
import type { Pack } from "@/types";
import { getSessionUser, updateUserPack } from "@/services/authService";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";

const PAYMENT_LINKS: Record<Exclude<Pack, "free">, string | undefined> = {
  pro: import.meta.env.VITE_STRIPE_LINK_PRO,
  expert: import.meta.env.VITE_STRIPE_LINK_EXPERT,
  institutional: import.meta.env.VITE_STRIPE_LINK_INSTITUTIONAL,
};

export function isStripeConfigured() {
  return Boolean(STRIPE_PUBLIC_KEY);
}

export function activatePackLocally(pack: Pack) {
  const user = getSessionUser();
  if (!user) {
    return { ok: false as const, message: "Aucune session active." };
  }

  updateUserPack(user.id, pack, "active");
  return { ok: true as const, message: `Pack ${pack} activé localement.` };
}

export async function redirectToCheckout(pack: Pack) {
  if (pack === "free") {
    return activatePackLocally("free");
  }

  if (!isStripeConfigured()) {
    return activatePackLocally(pack);
  }

  const paymentLink = PAYMENT_LINKS[pack as Exclude<Pack, "free">];
  if (!paymentLink) {
    return activatePackLocally(pack);
  }

  await loadStripe(STRIPE_PUBLIC_KEY);
  window.location.href = paymentLink;
  return { ok: true as const, message: "Redirection vers Stripe." };
}
