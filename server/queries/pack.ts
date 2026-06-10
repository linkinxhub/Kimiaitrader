import { eq } from "drizzle-orm";
import { getDb } from "./connection.js";
import { packs } from "../../db/schema.js";

export async function findAllPacks() {
  const db = getDb();
  return db.select().from(packs).where(eq(packs.active, "yes")).orderBy(packs.order);
}

export async function findPackBySlug(slug: string) {
  const db = getDb();
  const results = await db.select().from(packs).where(eq(packs.slug, slug)).limit(1);
  return results[0] ?? null;
}

export async function findPackById(id: number) {
  const db = getDb();
  const results = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  return results[0] ?? null;
}
