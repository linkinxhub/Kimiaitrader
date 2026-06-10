import { authRouter } from "./auth-router";
import { packRouter } from "./pack-router";
import { subscriptionRouter } from "./subscription-router";
import { stripeRouter } from "./stripe-router";
import { aiRouter } from "./ai-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  pack: packRouter,
  subscription: subscriptionRouter,
  stripe: stripeRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
