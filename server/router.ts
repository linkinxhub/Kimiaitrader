import { authRouter } from "./auth-router.js";
import { packRouter } from "./pack-router.js";
import { subscriptionRouter } from "./subscription-router.js";
import { stripeRouter } from "./stripe-router.js";
import { aiRouter } from "./ai-router.js";
import { createRouter, publicQuery } from "./middleware.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  pack: packRouter,
  subscription: subscriptionRouter,
  stripe: stripeRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
