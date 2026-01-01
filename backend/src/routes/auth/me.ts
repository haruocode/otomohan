import type { FastifyPluginAsync } from "fastify";
import { handleGetAuthMe } from "../../controllers/authController.js";

const authMeSuccessSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        role: { type: "string", enum: ["user", "otomo"] },
        name: { type: "string" },
        avatar: { anyOf: [{ type: "string" }, { type: "null" }] },
        balance: { type: "number" },
        status: {
          type: "string",
          enum: ["online", "busy", "offline", "break"],
        },
      },
      required: ["id", "role", "name", "avatar", "balance"],
      additionalProperties: false,
    },
  },
  required: ["status", "user"],
  additionalProperties: false,
} as const;

const authMeErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const authMeRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/auth/me",
    {
      schema: {
        response: {
          200: authMeSuccessSchema,
          401: authMeErrorSchema,
          403: authMeErrorSchema,
          404: authMeErrorSchema,
          500: authMeErrorSchema,
        },
        tags: ["auth"],
        description: "AUTH-05: Fetch authenticated user profile",
      },
    },
    handleGetAuthMe
  );
};
