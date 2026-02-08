import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  listCategories: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({ orderBy: { name: "asc" } });
  }),

  upsertCategory: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        type: z.enum(["MAIN", "ATTRIBUTE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.id) {
          return await ctx.db.category.update({
            where: { id: input.id },
            data: { name: input.name, type: input.type },
          });
        }

        return await ctx.db.category.create({
          data: { name: input.name, type: input.type },
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to save category",
        });
      }
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.category.delete({ where: { id: input.id } });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete category",
        });
      }
    }),

  listFlowers: adminProcedure.query(async ({ ctx }) => {
    const flowers = await ctx.db.flower.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });

    return flowers.map((f) => ({
      ...f,
      attributes: JSON.parse(f.attributesJson || "[]") as string[],
    }));
  }),

  upsertFlower: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        price: z.number().positive(),
        image: z.string().min(1),
        categoryId: z.string().min(1),
        attributes: z.array(z.string()).default([]),
        inStock: z.boolean().default(true),
        deliveryNextDay: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        name: input.name,
        price: input.price,
        image: input.image,
        categoryId: input.categoryId,
        attributesJson: JSON.stringify(input.attributes),
        inStock: input.inStock,
        deliveryNextDay: input.deliveryNextDay,
      };

      try {
        if (input.id) {
          const flower = await ctx.db.flower.update({
            where: { id: input.id },
            data,
          });
          return {
            ...flower,
            attributes: JSON.parse(flower.attributesJson || "[]") as string[],
          };
        }

        const flower = await ctx.db.flower.create({ data });
        return {
          ...flower,
          attributes: JSON.parse(flower.attributesJson || "[]") as string[],
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to save flower",
        });
      }
    }),

  deleteFlower: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.flower.delete({ where: { id: input.id } });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete flower",
        });
      }
    }),

  listOrders: adminProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
      include: {
        user: true,
        items: { include: { flower: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      ...order,
      deliveryMethod: order.deliveryMethod as "DELIVERY" | "PICKUP",
      status: order.status as
        | "PENDING"
        | "CONFIRMED"
        | "DELIVERED"
        | "CANCELLED",
      deliveryAddress: order.deliveryAddress || undefined,
      phoneNumber: order.phoneNumber || undefined,
      notes: order.notes || undefined,
      items: order.items.map((item) => ({
        ...item,
        flower: item.flower
          ? {
              ...item.flower,
              attributes: JSON.parse(item.flower.attributesJson || "[]"),
            }
          : undefined,
      })),
    }));
  }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const order = await ctx.db.order.findUnique({
          where: { id: input.id },
        });
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }
        return await ctx.db.order.update({
          where: { id: input.id },
          data: { status: input.status },
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to update order status",
        });
      }
    }),
});
