import type { FastifyPluginAsync } from "fastify";
import { handlePostAuthSignup } from "../../controllers/authController.js";

const signUpBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 32 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8, maxLength: 64 },
  },
  required: ["name", "email", "password"],
  additionalProperties: false,
} as const;

const signUpUserSchema = {
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

const signUpSuccessResponse = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    user: signUpUserSchema,
    token: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "number" },
  },
  required: ["status", "user", "token", "refreshToken", "expiresIn"],
  additionalProperties: false,
} as const;

const signUpErrorResponse = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const authSignupRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/signup",
    {
      schema: {
        body: signUpBodySchema,
        response: {
          201: signUpSuccessResponse,
          400: signUpErrorResponse,
          409: signUpErrorResponse,
          500: signUpErrorResponse,
        },
        tags: ["auth"],
        description: "AUTH-01: User signup",
      },
    },
    handlePostAuthSignup
  );
};
