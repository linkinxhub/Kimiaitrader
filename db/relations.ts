import { relations } from "drizzle-orm";
import { users, packs, subscriptions, payments } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const packsRelations = relations(packs, ({ many }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  pack: one(packs, { fields: [subscriptions.packId], references: [packs.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  pack: one(packs, { fields: [payments.packId], references: [packs.id] }),
}));
