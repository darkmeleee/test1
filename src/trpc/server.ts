import "server-only";

import { headers } from "next/headers";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
export const createTRPCCaller = async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  const context = await createTRPCContext({
    headers: heads,
  });

  return createCaller(context);
};
