import type { FastifyPluginAsync } from "fastify";
import { handleUpdateUserPassword } from "../../controllers/userController.js";

const updatePasswordBodySchema = {
  type: "object",
  properties: {
    currentPassword: { type: "string", minLength: 1, maxLength: 72 },
    newPassword: { type: "string", minLength: 8, maxLength: 72 },
  },
  required: ["currentPassword", "newPassword"],
  additionalProperties: false,
} as const;

const updatePasswordResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
  },
  required: ["status"],
  additionalProperties: false,
} as const;

export const userPasswordRoutes: FastifyPluginAsync = async (app) => {
  app.put(
    "/user/password",
    {
      schema: {
        body: updatePasswordBodySchema,
        response: {
          200: updatePasswordResponseSchema,
        },
        tags: ["user"],
        description: "USER-04: Change current user password",
      },
    },
    handleUpdateUserPassword
  );
};
