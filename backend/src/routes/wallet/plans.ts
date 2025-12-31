import type { FastifyPluginAsync } from "fastify";
import { handleGetWalletPlans } from "../../controllers/walletController.js";

const walletPlanSchema = {
  type: "object",
  properties: {
    planId: { type: "string" },
    title: { type: "string" },
    price: { type: "number" },
    points: { type: "number" },
    bonusPoints: { type: "number" },
    description: { type: "string" },
  },
  required: [
    "planId",
    "title",
    "price",
    "points",
    "bonusPoints",
    "description",
  ],
  additionalProperties: false,
} as const;

const walletPlanListResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    items: {
      type: "array",
      items: walletPlanSchema,
    },
  },
  required: ["status", "items"],
  additionalProperties: false,
} as const;

const walletPlanErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const walletPlansRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/wallet/plans",
    {
      schema: {
        response: {
          200: walletPlanListResponseSchema,
          500: walletPlanErrorSchema,
        },
        tags: ["wallet"],
        description: "WAL-02: List available wallet charge plans",
      },
    },
    handleGetWalletPlans
  );
};
