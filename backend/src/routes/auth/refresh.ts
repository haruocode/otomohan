import type { FastifyPluginAsync } from "fastify";
import { handlePostAuthRefresh } from "../../controllers/authController.js";

const refreshBodySchema = {
  type: "object",
  properties: {
    refreshToken: { type: "string", minLength: 1 },
  },
  required: ["refreshToken"],
  additionalProperties: false,
} as const;

const refreshSuccessSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "number" },
  },
  required: ["status", "accessToken", "refreshToken", "expiresIn"],
  additionalProperties: false,
} as const;

const refreshErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const authRefreshRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/refresh",
    {
      schema: {
        body: refreshBodySchema,
        response: {
          200: refreshSuccessSchema,
          401: refreshErrorSchema,
          500: refreshErrorSchema,
        },
        tags: ["auth"],
        description: "AUTH-04: Refresh access token",
      },
    },
    handlePostAuthRefresh
  );
};
