import type { FastifyPluginAsync } from "fastify";
import { handleGetOtomoReviews } from "../../controllers/otomoController.js";

const otomoReviewsQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "number", minimum: 1, maximum: 50 },
    offset: { type: "number", minimum: 0 },
    sort: {
      type: "string",
      enum: ["newest", "highest", "lowest"],
      default: "newest",
    },
  },
  additionalProperties: false,
} as const;

const otomoReviewsResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          reviewId: { type: "string" },
          userDisplayName: { type: "string" },
          score: { type: "number" },
          comment: { type: "string" },
          createdAt: { type: "string" },
        },
        required: [
          "reviewId",
          "userDisplayName",
          "score",
          "comment",
          "createdAt",
        ],
        additionalProperties: false,
      },
    },
    total: { type: "number" },
  },
  required: ["status", "items", "total"],
  additionalProperties: false,
} as const;

const otomoReviewsNotFoundSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string", const: "OTOMO_NOT_FOUND" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const otomoReviewsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/otomo/:id/reviews",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 1 },
          },
          required: ["id"],
          additionalProperties: false,
        },
        querystring: otomoReviewsQuerySchema,
        response: {
          200: otomoReviewsResponseSchema,
          404: otomoReviewsNotFoundSchema,
        },
        tags: ["otomo"],
        description: "OTOMO-03: Fetch paginated reviews for an otomo",
      },
    },
    handleGetOtomoReviews
  );
};
