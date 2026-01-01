import type { FastifyPluginAsync } from "fastify";
import { handlePostAuthLogout } from "../../controllers/authController.js";

const logoutResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
  },
  required: ["status"],
  additionalProperties: false,
} as const;

const logoutErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const authLogoutRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/logout",
    {
      schema: {
        response: {
          200: logoutResponseSchema,
          401: logoutErrorSchema,
          500: logoutErrorSchema,
        },
        tags: ["auth"],
        description: "AUTH-03: User logout",
      },
    },
    handlePostAuthLogout
  );
};
