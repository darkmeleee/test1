import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const ordersRouter = createTRPCRouter({
  // Create order from cart
  createOrder: protectedProcedure
    .input(
      z.object({
        deliveryAddress: z.string().optional(),
        phoneNumber: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user's cart items
        const cartItems = await ctx.db.cartItem.findMany({
          where: { userId: ctx.user.id },
          include: { flower: true },
        });

        if (cartItems.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cart is empty",
          });
        }

        // Calculate total amount
        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.flower.price * item.quantity,
          0,
        );

        // Create order
        const order = await ctx.db.order.create({
          data: {
            userId: ctx.user.id,
            totalAmount,
            status: "PENDING",
            deliveryAddress: input.deliveryAddress,
            phoneNumber: input.phoneNumber,
            notes: input.notes,
          },
        });

        // Create order items
        await ctx.db.orderItem.createMany({
          data: cartItems.map((item) => ({
            orderId: order.id,
            flowerId: item.flowerId,
            quantity: item.quantity,
            price: item.flower.price,
          })),
        });

        // Clear cart
        await ctx.db.cartItem.deleteMany({
          where: { userId: ctx.user.id },
        });

        // Return order with items
        const orderWithItems = await ctx.db.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: { flower: true },
            },
          },
        });

        // Transform the data to match frontend types
        if (orderWithItems) {
          return {
            ...orderWithItems,
            status: orderWithItems.status as
              | "PENDING"
              | "CONFIRMED"
              | "DELIVERED"
              | "CANCELLED",
            deliveryAddress: orderWithItems.deliveryAddress || undefined,
            phoneNumber: orderWithItems.phoneNumber || undefined,
            notes: orderWithItems.notes || undefined,
            items: orderWithItems.items.map((item) => ({
              ...item,
              flower: item.flower
                ? {
                    ...item.flower,
                    attributes: JSON.parse(item.flower.attributesJson || "[]"),
                  }
                : undefined,
            })),
          };
        }
        return orderWithItems;
      } catch (error) {
        console.error("Error creating order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }
    }),

  // Get user's orders
  getUserOrders: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orders = await ctx.db.order.findMany({
        where: { userId: ctx.user.id },
        include: {
          items: {
            include: { flower: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Transform the data to match frontend types
      return orders.map((order) => ({
        ...order,
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
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get orders",
      });
    }
  }),

  // Get order by ID
  getOrder: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const order = await ctx.db.order.findUnique({
          where: { id: input.id },
          include: {
            items: {
              include: { flower: true },
            },
          },
        });

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (order.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        // Transform the data to match frontend types
        return {
          ...order,
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
        };
      } catch (error) {
        console.error("Error getting order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get order",
        });
      }
    }),

  // Update order status (admin only)
  updateOrderStatus: protectedProcedure
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
        console.error("Error updating order status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
        });
      }
    }),
});
