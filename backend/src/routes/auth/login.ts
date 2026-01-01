import type { FastifyPluginAsync } from "fastify";
import { handlePostAuthLogin } from "../../controllers/authController.js";

const loginBodySchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8, maxLength: 64 },
  },
  required: ["email", "password"],
  additionalProperties: false,
} as const;

const loginUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    avatarUrl: { type: ["string", "null"] },
    intro: { type: ["string", "null"] },
    balance: { type: "number" },
  },
  required: ["id", "name", "email", "avatarUrl", "intro", "balance"],
  additionalProperties: false,
} as const;

const loginSuccessResponse = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    user: loginUserSchema,
    token: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "number" },
  },
  required: ["status", "user", "token", "refreshToken", "expiresIn"],
  additionalProperties: false,
} as const;

const loginErrorResponse = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const authLoginRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/login",
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginSuccessResponse,
          400: loginErrorResponse,
          401: loginErrorResponse,
          500: loginErrorResponse,
        },
        tags: ["auth"],
        description: "AUTH-02: User login",
      },
    },
    handlePostAuthLogin
  );
};
