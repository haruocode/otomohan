import type { FastifyPluginAsync } from "fastify";
import { handleUpdateOtomoStatus } from "../../controllers/otomoController.js";

const updateStatusBodySchema = {
  type: "object",
  properties: {
    otomoId: { type: "string", minLength: 1 },
    isOnline: { type: "boolean" },
    isAvailable: { type: "boolean" },
    statusMessage: { type: "string", maxLength: 140 },
  },
  required: ["otomoId", "isOnline", "isAvailable"],
  additionalProperties: false,
} as const;

const updateStatusResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    otomo: {
      type: "object",
      properties: {
        otomoId: { type: "string" },
        isOnline: { type: "boolean" },
        isAvailable: { type: "boolean" },
        statusMessage: { type: ["string", "null"] },
        statusUpdatedAt: { type: "string" },
      },
      required: [
        "otomoId",
        "isOnline",
        "isAvailable",
        "statusMessage",
        "statusUpdatedAt",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "otomo"],
  additionalProperties: false,
} as const;

const otomoUpdateErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const otomoStatusRoutes: FastifyPluginAsync = async (app) => {
  app.put(
    "/otomo/status",
    {
      schema: {
        body: updateStatusBodySchema,
        response: {
          200: updateStatusResponseSchema,
          400: otomoUpdateErrorSchema,
          403: otomoUpdateErrorSchema,
          404: otomoUpdateErrorSchema,
        },
        tags: ["otomo"],
        description: "OTOMO-04: Update otomo availability status",
      },
    },
    handleUpdateOtomoStatus
  );
};
