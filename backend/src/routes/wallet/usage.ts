import type { FastifyPluginAsync } from "fastify";
import { handleGetWalletUsage } from "../../controllers/walletController.js";

const walletUsageItemSchema = {
  type: "object",
  properties: {
    usageId: { type: "string" },
    callId: { type: "string" },
    otomoId: { type: "string" },
    otomoName: { type: "string" },
    usedPoints: { type: "number" },
    durationMinutes: { type: "number" },
    createdAt: { type: "string" },
  },
  required: [
    "usageId",
    "callId",
    "otomoId",
    "otomoName",
    "usedPoints",
    "durationMinutes",
    "createdAt",
  ],
  additionalProperties: false,
} as const;

const walletUsageResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    items: {
      type: "array",
      items: walletUsageItemSchema,
    },
    total: { type: "number" },
  },
  required: ["status", "items", "total"],
  additionalProperties: false,
} as const;

const walletUsageErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

const walletUsageQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    offset: { type: "integer", minimum: 0, default: 0 },
    sort: {
      type: "string",
      enum: ["newest", "oldest"],
      default: "newest",
    },
    otomoId: { type: "string" },
  },
  additionalProperties: false,
} as const;

export const walletUsageRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/wallet/usage",
    {
      schema: {
        querystring: walletUsageQuerySchema,
        response: {
          200: walletUsageResponseSchema,
          400: walletUsageErrorSchema,
          401: walletUsageErrorSchema,
          403: walletUsageErrorSchema,
          500: walletUsageErrorSchema,
        },
        tags: ["wallet"],
        description: "WAL-05: Fetch wallet usage history",
      },
    },
    handleGetWalletUsage
  );
};
