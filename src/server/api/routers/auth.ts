import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import crypto from "crypto";

// Telegram WebApp data validation schema
const telegramInitDataSchema = z.object({
  query_id: z.string().optional(),
  user: z.string().optional(),
  auth_date: z.string(),
  hash: z.string(),
});

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  language_code: z.string().optional(),
});

function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return computedHash === hash;
}

export const authRouter = createTRPCRouter({
  authenticate: publicProcedure
    .input(
      z.object({
        initData: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        throw new Error("TELEGRAM_BOT_TOKEN not configured");
      }

      // Verify Telegram WebApp data
      if (!verifyTelegramInitData(input.initData, botToken)) {
        throw new Error("Invalid Telegram authentication data");
      }

      // Parse user data
      const params = new URLSearchParams(input.initData);
      const userStr = params.get("user");
      if (!userStr) {
        throw new Error("User data not found in Telegram init data");
      }

      let userData;
      try {
        userData = telegramUserSchema.parse(JSON.parse(userStr));
      } catch (error) {
        throw new Error("Invalid user data format");
      }

      const authDate = parseInt(params.get("auth_date") || "0");
      const hash = params.get("hash") || "";

      // Find or create user
      let user = await db.user.findUnique({
        where: { telegramId: userData.id.toString() },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            telegramId: userData.id.toString(),
            username: userData.username,
            firstName: userData.first_name,
            lastName: userData.last_name,
            photoUrl: userData.photo_url,
            authDate,
            hash,
          },
        });
      } else {
        // Update user data if changed
        user = await db.user.update({
          where: { id: user.id },
          data: {
            username: userData.username,
            firstName: userData.first_name,
            lastName: userData.last_name,
            photoUrl: userData.photo_url,
            authDate,
            hash,
          },
        });
      }

      return {
        success: true,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          isAdmin: ((user as any).isAdmin as boolean | undefined) ?? false,
        },
      };
    }),

  getProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.userId },
        include: {
          cartItems: {
            include: {
              flower: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        isAdmin: ((user as any).isAdmin as boolean | undefined) ?? false,
        cartItems: user.cartItems,
      };
    }),
});
