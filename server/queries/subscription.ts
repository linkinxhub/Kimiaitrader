import { eq, and } from "drizzle-orm";
import { getDb } from "./connection.js";
import { users, subscriptions } from "../../db/schema.js";

export async function findUserSubscription(userId: number) {
  const db = getDb();
  const results = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
      )
    )
    .orderBy(subscriptions.createdAt)
    .limit(1);
  return results[0] ?? null;
}

export async function findAllUserSubscriptions(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt);
}

export async function createSubscription(data: {
  userId: number;
  packId: number;
  billingCycle: "monthly" | "yearly";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
}) {
  const db = getDb();
  const [sub] = await db.insert(subscriptions).values({
    userId: data.userId,
    packId: data.packId,
    billingCycle: data.billingCycle,
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
    currentPeriodEnd: data.currentPeriodEnd,
    status: "active",
  }).$returningId();

  // Update user pack
  const packSlugs = ["", "free", "pro", "expert", "institutional"];
  const packSlug = packSlugs[data.packId] || "free";
  await db.update(users)
    .set({
      pack: packSlug as any,
      packStatus: "active",
      packExpiresAt: data.currentPeriodEnd,
      paymentPending: "no",
    })
    .where(eq(users.id, data.userId));

  return sub;
}

export async function cancelSubscription(subscriptionId: number) {
  const db = getDb();
  await db.update(subscriptions)
    .set({ status: "cancelled", cancelAtPeriodEnd: "yes" })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function expireSubscription(subscriptionId: number) {
  const db = getDb();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) return;

  await db.update(subscriptions)
    .set({ status: "expired" })
    .where(eq(subscriptions.id, subscriptionId));

  // Downgrade user to free
  await db.update(users)
    .set({ pack: "free", packStatus: "expired" })
    .where(eq(users.id, sub.userId));
}
