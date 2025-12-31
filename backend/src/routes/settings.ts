import type { FastifyPluginAsync } from "fastify";
import { handleGetSettings } from "../controllers/settingsController.js";

const settingsResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    settings: {
      type: "object",
      properties: {
        notifications: {
          type: "object",
          properties: {
            incomingCall: { type: "boolean" },
            callSummary: { type: "boolean" },
            walletAlert: { type: "boolean" },
            marketing: { type: "boolean" },
          },
          required: ["incomingCall", "callSummary", "walletAlert", "marketing"],
          additionalProperties: false,
        },
        links: {
          type: "object",
          properties: {
            terms: { type: "string" },
            privacy: { type: "string" },
          },
          required: ["terms", "privacy"],
          additionalProperties: false,
        },
        app: {
          type: "object",
          properties: {
            version: { type: "string" },
            minSupportedVersion: { type: "string" },
          },
          required: ["version", "minSupportedVersion"],
          additionalProperties: false,
        },
      },
      required: ["notifications", "links", "app"],
      additionalProperties: false,
    },
  },
  required: ["status", "settings"],
  additionalProperties: false,
} as const;

const settingsErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/settings",
    {
      schema: {
        response: {
          200: settingsResponseSchema,
          401: settingsErrorSchema,
          403: settingsErrorSchema,
          500: settingsErrorSchema,
        },
        tags: ["settings"],
        description: "SET-01: Fetch consolidated settings for current user",
      },
    },
    handleGetSettings
  );
};
