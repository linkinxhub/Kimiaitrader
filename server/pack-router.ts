import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { findAllPacks, findPackBySlug, findPackById } from "./queries/pack";

export const packRouter = createRouter({
  list: publicQuery.query(async () => {
    return findAllPacks();
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return findPackBySlug(input.slug);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findPackById(input.id);
    }),
});
