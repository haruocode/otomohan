import type { FastifyPluginAsync } from "fastify";
import { handleGetCurrentUser } from "../../controllers/userController.js";
const userProfileSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        role: { type: "string", const: "user" },
        name: { type: "string" },
        avatar: { type: ["string", "null"] },
        bio: { type: ["string", "null"] },
        gender: { type: ["string", "null"] },
        birthday: { type: ["string", "null"] },
        balance: { type: "number" },
        notifications: {
          type: "object",
          additionalProperties: { type: "boolean" },
        },
      },
      required: [
        "id",
        "role",
        "name",
        "avatar",
        "bio",
        "gender",
        "birthday",
        "balance",
        "notifications",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "user"],
  additionalProperties: false,
} as const;

export const userMeRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/user/me",
    {
      schema: {
        response: {
          200: userProfileSchema,
        },
        tags: ["user"],
        description: "USER-01: Fetch extended profile for the current user",
      },
    },
    handleGetCurrentUser
  );
};
