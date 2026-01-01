import type { FastifyPluginAsync } from "fastify";
import { handlePostWalletCharge } from "../../controllers/walletController.js";

const walletChargeBodySchema = {
  type: "object",
  properties: {
    planId: { type: "string" },
    paymentId: { type: "string" },
    amount: { type: "number" },
  },
  required: ["planId", "paymentId", "amount"],
  additionalProperties: false,
} as const;

const walletChargeResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    userId: { type: "string" },
    chargedPoints: { type: "number" },
    balance: { type: "number" },
    planId: { type: "string" },
    paymentId: { type: "string" },
  },
  required: [
    "status",
    "userId",
    "chargedPoints",
    "balance",
    "planId",
    "paymentId",
  ],
  additionalProperties: false,
} as const;

const walletChargeErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const walletChargeRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/wallet/charge",
    {
      schema: {
        body: walletChargeBodySchema,
        response: {
          200: walletChargeResponseSchema,
          400: walletChargeErrorSchema,
          401: walletChargeErrorSchema,
          403: walletChargeErrorSchema,
          404: walletChargeErrorSchema,
          409: walletChargeErrorSchema,
          500: walletChargeErrorSchema,
        },
        tags: ["wallet"],
        description: "WAL-03: Charge wallet by applying a purchased plan",
      },
    },
    handlePostWalletCharge
  );
};
