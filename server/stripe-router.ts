import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "./middleware.js";
import { findPackById } from "./queries/pack.js";
import { createPayment } from "./queries/payment.js";
import { createSubscription } from "./queries/subscription.js";
import Stripe from "stripe";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-05-27.dahlia",
});

// Price IDs mapping (these would be real Stripe Price IDs in production)
const STRIPE_PRICES: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly",
  },
  expert: {
    monthly: process.env.STRIPE_PRICE_EXPERT_MONTHLY || "price_expert_monthly",
    yearly: process.env.STRIPE_PRICE_EXPERT_YEARLY || "price_expert_yearly",
  },
  institutional: {
    monthly: process.env.STRIPE_PRICE_INST_MONTHLY || "price_inst_monthly",
    yearly: process.env.STRIPE_PRICE_INST_YEARLY || "price_inst_yearly",
  },
};

function getOrigin(req: Request): string {
  const header = req.headers.get("origin");
  if (header) return header;
  const host = req.headers.get("host");
  if (host) return `http://${host}`;
  return "http://localhost:3000";
}

export const stripeRouter = createRouter({
  // Create a checkout session for pack purchase
  createCheckoutSession: authedQuery
    .input(
      z.object({
        packId: z.number(),
        billingCycle: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const pack = await findPackById(input.packId);
      if (!pack) throw new TRPCError({ code: "NOT_FOUND", message: "Pack not found" });
      if (pack.slug === "free") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot checkout free pack" });

      const priceMap = STRIPE_PRICES[pack.slug];
      if (!priceMap) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid pack for checkout" });

      const amount = input.billingCycle === "yearly" ? pack.priceYearly : pack.priceMonthly;

      const origin = getOrigin(ctx.req);

      // Create payment record (pending)
      const payment = await createPayment({
        userId: user.id,
        packId: pack.id,
        amount,
        status: "pending",
        billingCycle: input.billingCycle,
      });

      try {
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          customer_email: user.email || undefined,
          line_items: [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: `XTrendAI Pro - ${pack.name} (${input.billingCycle})`,
                  description: pack.description || undefined,
                },
                unit_amount: Math.round(parseFloat(amount) * 100), // cents
                recurring: input.billingCycle === "monthly"
                  ? { interval: "month" }
                  : { interval: "year" },
              },
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${origin}/#/billing?success=true&session_id={CHECKOUT_SESSION_ID}&pack_id=${pack.id}&cycle=${input.billingCycle}`,
          cancel_url: `${origin}/#/billing?canceled=true`,
          metadata: {
            userId: String(user.id),
            packId: String(pack.id),
            packSlug: pack.slug,
            billingCycle: input.billingCycle,
            paymentId: String(payment.id),
          },
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (err) {
        console.error("Stripe checkout error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Verify a checkout session after redirect
  verifySession: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        if (session.payment_status === "paid") {
          return {
            success: true,
            status: "completed",
            packId: session.metadata?.packId,
            packSlug: session.metadata?.packSlug,
            billingCycle: session.metadata?.billingCycle,
          };
        }
        return { success: false, status: session.payment_status };
      } catch {
        return { success: false, status: "error" };
      }
    }),

  // Create customer portal session for managing subscription
  createPortalSession: authedQuery.mutation(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    // In production, you'd store the Stripe customer ID and create a portal session
    // For now, return a mock response
    return { url: null };
  }),

  // Webhook handler for Stripe events (called via HTTP, not tRPC)
  webhook: publicQuery
    .input(
      z.object({
        signature: z.string(),
        payload: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      try {
        const event = stripe.webhooks.constructEvent(
          input.payload,
          input.signature,
          webhookSecret
        );

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const { userId, packId, billingCycle } = session.metadata || {};
            if (userId && packId) {
              await createSubscription({
                userId: parseInt(userId),
                packId: parseInt(packId),
                billingCycle: billingCycle as "monthly" | "yearly",
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
              });
            }
            break;
          }
          case "invoice.payment_failed": {
            // Handle failed payment
            break;
          }
          case "customer.subscription.deleted": {
            // Handle cancellation
            break;
          }
        }

        return { received: true };
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid webhook" });
      }
    }),
});
