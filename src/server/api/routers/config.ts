import { z } from "zod";
import { createTRPCRouter, adminProcedure, publicProcedure } from "~/server/api/trpc";

export const configRouter = createTRPCRouter({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.appConfig.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    });

    return {
      deliveryFee: config.deliveryFee,
    };
  }),

  setDeliveryFee: adminProcedure
    .input(
      z.object({
        deliveryFee: z.number().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const config = await ctx.db.appConfig.upsert({
        where: { id: "default" },
        create: { id: "default", deliveryFee: input.deliveryFee },
        update: { deliveryFee: input.deliveryFee },
      });

      return {
        deliveryFee: config.deliveryFee,
      };
    }),
});
