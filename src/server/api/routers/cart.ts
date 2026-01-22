import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const cartRouter = createTRPCRouter({
  // Get user's cart
  getUserCart: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cart = await ctx.db.cart.findMany({
        where: { userId: ctx.user.id },
        include: {
          flower: true,
        },
      });

      return { items: cart };
    } catch (error) {
      console.error("Error getting user cart:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get cart",
      });
    }
  }),

  // Add item to cart
  addToCart: protectedProcedure
    .input(
      z.object({
        flowerId: z.string(),
        quantity: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if item already in cart
        const existingItem = await ctx.db.cart.findFirst({
          where: {
            userId: ctx.user.id,
            flowerId: input.flowerId,
          },
        });

        if (existingItem) {
          // Update quantity if item exists
          return await ctx.db.cart.update({
            where: { id: existingItem.id },
            data: {
              quantity: {
                increment: input.quantity,
              },
            },
            include: { flower: true },
          });
        }

        // Add new item to cart
        return await ctx.db.cart.create({
          data: {
            userId: ctx.user.id,
            flowerId: input.flowerId,
            quantity: input.quantity,
          },
          include: { flower: true },
        });
      } catch (error) {
        console.error("Error adding to cart:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add item to cart",
        });
      }
    }),

  // Remove item from cart
  removeFromCart: protectedProcedure
    .input(
      z.object({
        flowerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.cart.deleteMany({
          where: {
            userId: ctx.user.id,
            flowerId: input.flowerId,
          },
        });
      } catch (error) {
        console.error("Error removing from cart:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove item from cart",
        });
      }
    }),

  // Update item quantity
  updateQuantity: protectedProcedure
    .input(
      z.object({
        flowerId: z.string(),
        quantity: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.quantity <= 0) {
          // If quantity is 0 or less, remove the item
          return await ctx.db.cart.deleteMany({
            where: {
              userId: ctx.user.id,
              flowerId: input.flowerId,
            },
          });
        }

        return await ctx.db.cart.updateMany({
          where: {
            userId: ctx.user.id,
            flowerId: input.flowerId,
          },
          data: {
            quantity: input.quantity,
          },
        });
      } catch (error) {
        console.error("Error updating cart quantity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update cart quantity",
        });
      }
    }),

  // Clear cart
  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await ctx.db.cart.deleteMany({
        where: { userId: ctx.user.id },
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to clear cart",
      });
    }
  }),
});
