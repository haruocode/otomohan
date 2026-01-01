import type { FastifyPluginAsync } from "fastify";
import { handleGetWalletPurchaseHistory } from "../../controllers/walletController.js";

const walletHistoryItemSchema = {
  type: "object",
  properties: {
    historyId: { type: "string" },
    planId: { type: "string" },
    planTitle: { type: "string" },
    amount: { type: "number" },
    points: { type: "number" },
    bonusPoints: { type: "number" },
    paymentId: { type: "string" },
    createdAt: { type: "string" },
  },
  required: [
    "historyId",
    "planId",
    "planTitle",
    "amount",
    "points",
    "bonusPoints",
    "paymentId",
    "createdAt",
  ],
  additionalProperties: false,
} as const;

const walletHistoryResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    items: {
      type: "array",
      items: walletHistoryItemSchema,
    },
    total: { type: "number" },
  },
  required: ["status", "items", "total"],
  additionalProperties: false,
} as const;

const walletHistoryErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

const walletHistoryQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    offset: { type: "integer", minimum: 0, default: 0 },
    sort: {
      type: "string",
      enum: ["newest", "oldest"],
      default: "newest",
    },
  },
  additionalProperties: false,
} as const;

export const walletPurchaseHistoryRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/wallet/purchase-history",
    {
      schema: {
        querystring: walletHistoryQuerySchema,
        response: {
          200: walletHistoryResponseSchema,
          400: walletHistoryErrorSchema,
          401: walletHistoryErrorSchema,
          403: walletHistoryErrorSchema,
          500: walletHistoryErrorSchema,
        },
        tags: ["wallet"],
        description: "WAL-04: Fetch wallet purchase history list",
      },
    },
    handleGetWalletPurchaseHistory
  );
};
