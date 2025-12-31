import type { FastifyPluginAsync } from "fastify";
import { handleUpdateUserProfile } from "../../controllers/userController.js";

const updateProfileBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 50 },
    bio: { type: "string", maxLength: 200 },
  },
  additionalProperties: false,
} as const;

const updateProfileResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        bio: { type: ["string", "null"] },
      },
      required: ["id", "name", "bio"],
      additionalProperties: false,
    },
  },
  required: ["status", "user"],
  additionalProperties: false,
} as const;

export const userProfileRoutes: FastifyPluginAsync = async (app) => {
  app.put(
    "/user/profile",
    {
      schema: {
        body: updateProfileBodySchema,
        response: {
          200: updateProfileResponseSchema,
        },
        tags: ["user"],
        description: "USER-02: Update current user basic profile",
      },
    },
    handleUpdateUserProfile
  );
};
