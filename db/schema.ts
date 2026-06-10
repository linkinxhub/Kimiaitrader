import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (managed by auth system) ─────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Pack & subscription fields
  pack: mysqlEnum("pack", ["free", "pro", "expert", "institutional"]).default("free").notNull(),
  packStatus: mysqlEnum("pack_status", ["active", "trial", "expired", "cancelled", "pending_payment"]).default("active").notNull(),
  packExpiresAt: timestamp("pack_expires_at"),
  paymentPending: mysqlEnum("payment_pending", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Packs ──────────────────────────────────────────────
export const packs = mysqlTable("packs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull(),
  features: json("features").$type<string[]>(),
  limitations: json("limitations").$type<string[]>(),
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  order: int("order").default(0).notNull(),
  recommended: mysqlEnum("recommended", ["yes", "no"]).default("no").notNull(),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Pack = typeof packs.$inferSelect;
export type InsertPack = typeof packs.$inferInsert;

// ─── Subscriptions ──────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  packId: bigint("pack_id", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "cancelled", "expired"]).default("active").notNull(),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]).default("monthly").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: mysqlEnum("cancel_at_period_end", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Payments ───────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  packId: bigint("pack_id", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  billingCycle: mysqlEnum("billing_cycle", ["monthly", "yearly"]).default("monthly").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
