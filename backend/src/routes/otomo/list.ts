import type { FastifyPluginAsync } from "fastify";
import { handleGetOtomoList } from "../../controllers/otomoController.js";

const otomoListResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          otomoId: { type: "string" },
          displayName: { type: "string" },
          profileImageUrl: { type: "string" },
          age: { type: "number" },
          gender: { type: "string", enum: ["female", "male", "other"] },
          genres: {
            type: "array",
            items: { type: "string" },
          },
          isOnline: { type: "boolean" },
          isAvailable: { type: "boolean" },
          pricePerMinute: { type: "number" },
          rating: { type: "number" },
          reviewCount: { type: "number" },
        },
        required: [
          "otomoId",
          "displayName",
          "profileImageUrl",
          "age",
          "gender",
          "genres",
          "isOnline",
          "isAvailable",
          "pricePerMinute",
          "rating",
          "reviewCount",
        ],
        additionalProperties: false,
      },
    },
    total: { type: "number" },
  },
  required: ["status", "items", "total"],
  additionalProperties: false,
} as const;

const otomoListQuerySchema = {
  type: "object",
  properties: {
    isOnline: { type: "boolean" },
    genre: { type: "string" },
    minAge: { type: "number", minimum: 0 },
    maxAge: { type: "number", minimum: 0 },
    limit: { type: "number", minimum: 1, maximum: 50 },
    offset: { type: "number", minimum: 0 },
  },
  additionalProperties: false,
} as const;

export const otomoListRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/otomo/list",
    {
      schema: {
        querystring: otomoListQuerySchema,
        response: {
          200: otomoListResponseSchema,
        },
        tags: ["otomo"],
        description: "OTOMO-01: Fetch available Otomo profiles",
      },
    },
    handleGetOtomoList
  );
};
