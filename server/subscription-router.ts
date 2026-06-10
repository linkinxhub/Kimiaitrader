import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.js";
import {
  findUserSubscription,
  findAllUserSubscriptions,
  createSubscription,
  cancelSubscription,
} from "./queries/subscription.js";
import { getDb } from "./queries/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const subscriptionRouter = createRouter({
  mySubscription: authedQuery.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const sub = await findUserSubscription(user.id);
    return sub;
  }),

  mySubscriptions: authedQuery.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return findAllUserSubscriptions(user.id);
  }),

  myPack: authedQuery.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return {
      pack: user.pack,
      packStatus: user.packStatus,
      packExpiresAt: user.packExpiresAt,
      paymentPending: user.paymentPending,
    };
  }),

  create: authedQuery
    .input(
      z.object({
        packId: z.number(),
        billingCycle: z.enum(["monthly", "yearly"]),
        stripeCustomerId: z.string().optional(),
        stripeSubscriptionId: z.string().optional(),
        currentPeriodEnd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const sub = await createSubscription({
        userId: user.id,
        packId: input.packId,
        billingCycle: input.billingCycle,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : undefined,
      });

      return sub;
    }),

  cancel: authedQuery
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      await cancelSubscription(input.subscriptionId);

      // Update user pack status
      const db = getDb();
      await db.update(users)
        .set({ packStatus: "cancelled" })
        .where(eq(users.id, user.id));

      return { success: true };
    }),

  downgradeToFree: authedQuery.mutation(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const db = getDb();
    await db.update(users)
      .set({
        pack: "free",
        packStatus: "active",
        paymentPending: "no",
      })
      .where(eq(users.id, user.id));

    return { success: true };
  }),
});
