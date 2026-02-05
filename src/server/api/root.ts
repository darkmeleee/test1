import { authRouter } from "~/server/api/routers/auth";
import { adminRouter } from "~/server/api/routers/admin";
import { configRouter } from "~/server/api/routers/config";
import { flowersRouter } from "~/server/api/routers/flowers";
import { ordersRouter } from "~/server/api/routers/orders";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  admin: adminRouter,
  config: configRouter,
  flowers: flowersRouter,
  orders: ordersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
