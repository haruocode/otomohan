import type { FastifyPluginAsync } from "fastify";
import {
  handleGetSettings,
  handleUpdateNotificationSettings,
} from "../controllers/settingsController.js";

const notificationSettingsSchema = {
  type: "object",
  properties: {
    incomingCall: { type: "boolean" },
    callSummary: { type: "boolean" },
    walletAlert: { type: "boolean" },
    marketing: { type: "boolean" },
  },
  required: ["incomingCall", "callSummary", "walletAlert", "marketing"],
  additionalProperties: false,
} as const;

const notificationUpdateBodySchema = {
  type: "object",
  properties: {
    incomingCall: { type: "boolean" },
    callSummary: { type: "boolean" },
    walletAlert: { type: "boolean" },
    marketing: { type: "boolean" },
  },
  additionalProperties: false,
  minProperties: 1,
} as const;

const settingsResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    settings: {
      type: "object",
      properties: {
        notifications: notificationSettingsSchema,
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

const notificationUpdateResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    settings: notificationSettingsSchema,
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

  app.put(
    "/settings/notifications",
    {
      schema: {
        body: notificationUpdateBodySchema,
        response: {
          200: notificationUpdateResponseSchema,
          400: settingsErrorSchema,
          401: settingsErrorSchema,
          403: settingsErrorSchema,
          500: settingsErrorSchema,
        },
        tags: ["settings"],
        description: "SET-02: Update notification preferences for current user",
      },
    },
    handleUpdateNotificationSettings
  );
};
