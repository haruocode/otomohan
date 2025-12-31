import type { FastifyPluginAsync } from "fastify";
import { handleGetWalletBalance } from "../../controllers/walletController.js";

const walletObjectSchema = {
  type: "object",
  properties: {
    userId: { type: "string" },
    balance: { type: "number" },
    updatedAt: { type: "string" },
  },
  required: ["userId", "balance", "updatedAt"],
  additionalProperties: false,
} as const;

const walletBalanceResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    wallet: walletObjectSchema,
  },
  required: ["status", "wallet"],
  additionalProperties: false,
} as const;

const walletErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const walletBalanceRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/wallet/balance",
    {
      schema: {
        response: {
          200: walletBalanceResponseSchema,
          401: walletErrorSchema,
          403: walletErrorSchema,
          404: walletErrorSchema,
          500: walletErrorSchema,
        },
        tags: ["wallet"],
        description: "WAL-01: Fetch current wallet balance for the authed user",
      },
    },
    handleGetWalletBalance
  );
};
