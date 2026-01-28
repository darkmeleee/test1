/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import crypto from "crypto";

import { db } from "~/server/db";
import type { User } from "~/types";

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

// Create context type
interface CreateContextOptions {
  headers: Headers;
  user: User | null;
}

// This is the actual context we'll use in procedures
type Context = CreateContextOptions & {
  db: typeof db;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // In a production app, you would typically:
  // 1. Get the auth token from the request headers
  // 2. Verify the token
  // 3. Fetch the user from the database
  // 4. Return the user in the context

  // For Telegram WebApp, try to get user from initData
  let user: User | null = null;

  try {
    // Try to get user from Telegram WebApp initData
    const telegramData = opts.headers.get("x-telegram-data");

    if (telegramData) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        user = null;
      } else if (!verifyTelegramInitData(telegramData, botToken)) {
        user = null;
      } else {
        const params = new URLSearchParams(telegramData);
        const userParam = params.get("user");

        if (userParam) {
          const userData = JSON.parse(decodeURIComponent(userParam)) as {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };

          const telegramId = userData.id.toString();
          const authDate = parseInt(params.get("auth_date") || "0");
          const hash = params.get("hash") || "";

          const dbUser = await db.user.upsert({
            where: { telegramId },
            create: {
              telegramId,
              username: userData.username,
              firstName: userData.first_name,
              lastName: userData.last_name,
              photoUrl: userData.photo_url,
              authDate,
              hash,
            },
            update: {
              username: userData.username,
              firstName: userData.first_name,
              lastName: userData.last_name,
              photoUrl: userData.photo_url,
              authDate,
              hash,
            },
          });

          user = {
            id: dbUser.id,
            telegramId: dbUser.telegramId,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            username: dbUser.username,
            photoUrl: dbUser.photoUrl,
            isAdmin: ((dbUser as any).isAdmin as boolean | undefined) ?? false,
          };
        }
      }
    }
  } catch (error) {
    console.error("Error parsing Telegram user data in context:", error);
  }

  return {
    db,
    user,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev - temporarily disabled for debugging
    // const waitMs = Math.floor(Math.random() * 400) + 100;
    // await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }

    return next({
      ctx: {
        ...ctx,
        // This ensures the user is non-null in the next middleware
        user: ctx.user as User,
      },
    });
  }),
);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user?.isAdmin) {
      throw new Error("Not authorized");
    }

    return next({ ctx });
  }),
);
