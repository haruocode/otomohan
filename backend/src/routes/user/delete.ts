import type { FastifyPluginAsync } from "fastify";
import { handleDeleteUserAccount } from "../../controllers/userController.js";

const deleteUserResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
  },
  required: ["status"],
  additionalProperties: false,
} as const;

export const userDeleteRoutes: FastifyPluginAsync = async (app) => {
  app.delete(
    "/user/delete",
    {
      schema: {
        response: {
          200: deleteUserResponseSchema,
        },
        tags: ["user"],
        description: "USER-05: Soft delete current user account",
      },
    },
    handleDeleteUserAccount
  );
};
