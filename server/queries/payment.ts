import { eq, desc } from "drizzle-orm";
import { getDb } from "./connection.js";
import { payments } from "../../db/schema.js";

export async function findUserPayments(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function createPayment(data: {
  userId: number;
  packId: number;
  amount: string;
  currency?: string;
  status?: "pending" | "completed" | "failed" | "refunded";
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  billingCycle?: "monthly" | "yearly";
}) {
  const db = getDb();
  const [payment] = await db.insert(payments).values({
    userId: data.userId,
    packId: data.packId,
    amount: data.amount,
    currency: data.currency ?? "EUR",
    status: data.status ?? "pending",
    paymentMethod: data.paymentMethod,
    stripePaymentIntentId: data.stripePaymentIntentId,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId,
    billingCycle: data.billingCycle ?? "monthly",
  }).$returningId();
  return payment;
}

export async function updatePaymentStatus(
  stripeCheckoutSessionId: string,
  status: "completed" | "failed" | "refunded"
) {
  const db = getDb();
  await db.update(payments)
    .set({ status })
    .where(eq(payments.stripeCheckoutSessionId, stripeCheckoutSessionId));
}
