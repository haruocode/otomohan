import type { FastifyPluginAsync } from "fastify";
import { handleUpdateUserAvatar } from "../../controllers/userController.js";

export const userAvatarRoutes: FastifyPluginAsync = async (app) => {
  app.put(
    "/user/avatar",
    {
      schema: {
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", const: "success" },
              avatar: { type: "string" },
            },
            required: ["status", "avatar"],
            additionalProperties: false,
          },
        },
        tags: ["user"],
        description: "USER-03: Upload and update avatar image",
      },
    },
    handleUpdateUserAvatar
  );
};
