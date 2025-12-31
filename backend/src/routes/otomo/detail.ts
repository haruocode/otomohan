import type { FastifyPluginAsync } from "fastify";
import { handleGetOtomoDetail } from "../../controllers/otomoController.js";

const otomoDetailResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    otomo: {
      type: "object",
      properties: {
        otomoId: { type: "string" },
        displayName: { type: "string" },
        profileImageUrl: { type: "string" },
        age: { type: "number" },
        gender: { type: "string", enum: ["female", "male", "other"] },
        genres: { type: "array", items: { type: "string" } },
        introduction: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        isOnline: { type: "boolean" },
        isAvailable: { type: "boolean" },
        pricePerMinute: { type: "number" },
        rating: { type: "number" },
        reviewCount: { type: "number" },
        statusMessage: { type: ["string", "null"] },
        statusUpdatedAt: { type: "string" },
        reviews: {
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
        schedule: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dayOfWeek: {
                type: "string",
                enum: [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ],
              },
              start: { type: "string" },
              end: { type: "string" },
            },
            required: ["dayOfWeek", "start", "end"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "otomoId",
        "displayName",
        "profileImageUrl",
        "age",
        "gender",
        "genres",
        "introduction",
        "tags",
        "isOnline",
        "isAvailable",
        "pricePerMinute",
        "rating",
        "reviewCount",
        "statusMessage",
        "statusUpdatedAt",
        "reviews",
        "schedule",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "otomo"],
  additionalProperties: false,
} as const;

const otomoNotFoundSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string", const: "OTOMO_NOT_FOUND" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const otomoDetailRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/otomo/:id",
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
        response: {
          200: otomoDetailResponseSchema,
          404: otomoNotFoundSchema,
        },
        tags: ["otomo"],
        description: "OTOMO-02: Fetch otomo detail",
      },
    },
    handleGetOtomoDetail
  );
};
