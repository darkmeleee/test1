import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

const TELEGRAM_ADMIN_CHAT_ID = 8190597967;

async function sendTelegramMessage(text: string) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

export const ordersRouter = createTRPCRouter({
  // Create order from cart
  createOrder: protectedProcedure
    .input(
      z.object({
        deliveryMethod: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
        deliveryAddress: z.string().optional(),
        phoneNumber: z
          .string()
          .optional()
          .refine(
            (value) => {
              if (!value) return true;
              const digits = value.replace(/\D/g, "");
              return (
                digits.length === 11 && (digits[0] === "7" || digits[0] === "8")
              );
            },
            { message: "Invalid phone number" },
          ),
        notes: z.string().optional(),
        items: z
          .array(
            z.object({
              flowerId: z.string(),
              quantity: z.number().int().positive(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.items.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cart is empty",
          });
        }

        const flowerIds = Array.from(
          new Set(input.items.map((i) => i.flowerId)),
        );
        const flowers = await ctx.db.flower.findMany({
          where: { id: { in: flowerIds } },
        });

        if (flowers.length !== flowerIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid cart items",
          });
        }

        const flowersById = new Map(flowers.map((f) => [f.id, f] as const));

        // Calculate total amount
        const itemsAmount = input.items.reduce((sum, item) => {
          const flower = flowersById.get(item.flowerId);
          if (!flower) {
            return sum;
          }
          return sum + flower.price * item.quantity;
        }, 0);

        const config = await ctx.db.appConfig.upsert({
          where: { id: "default" },
          create: { id: "default" },
          update: {},
        });

        const deliveryFee =
          input.deliveryMethod === "PICKUP" ? 0 : config.deliveryFee;
        const totalAmount = itemsAmount + deliveryFee;

        // Create order
        const order = await ctx.db.order.create({
          data: {
            userId: ctx.user.id,
            totalAmount,
            deliveryFee,
            deliveryMethod: input.deliveryMethod,
            status: "PENDING",
            deliveryAddress: input.deliveryAddress,
            phoneNumber: input.phoneNumber,
            notes: input.notes,
          },
        });

        // Create order items
        await ctx.db.orderItem.createMany({
          data: input.items.map((item) => ({
            orderId: order.id,
            flowerId: item.flowerId,
            quantity: item.quantity,
            price: flowersById.get(item.flowerId)!.price,
          })),
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

        if (orderWithItems) {
          const itemsText = orderWithItems.items
            .map((item) => {
              const name = item.flower?.name ?? item.flowerId;
              return `- ${name} × ${item.quantity} = ${item.price * item.quantity} ₽`;
            })
            .join("\n");

          const deliveryMethodLabel =
            orderWithItems.deliveryMethod === "PICKUP"
              ? "Самовывоз"
              : "Доставка";

          const text = [
            "<b>Новый заказ</b>",
            `#${orderWithItems.id.slice(-8)}`,
            `Сумма: <b>${orderWithItems.totalAmount} ₽</b>`,
            `Способ получения: <b>${deliveryMethodLabel}</b>`,
            orderWithItems.deliveryAddress
              ? `Адрес: ${orderWithItems.deliveryAddress}`
              : null,
            orderWithItems.phoneNumber
              ? `Телефон: ${orderWithItems.phoneNumber}`
              : null,
            itemsText ? `\n<b>Состав заказа</b>\n${itemsText}` : null,
          ]
            .filter(Boolean)
            .join("\n");

          try {
            await sendTelegramMessage(text);
          } catch (e) {
            console.error("Failed to send Telegram notification:", e);
          }
        }

        // Transform the data to match frontend types
        if (orderWithItems) {
          return {
            ...orderWithItems,
            deliveryMethod: orderWithItems.deliveryMethod as
              | "DELIVERY"
              | "PICKUP",
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
        if (error instanceof TRPCError) {
          throw error;
        }
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
