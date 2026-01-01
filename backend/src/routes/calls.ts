import type { FastifyPluginAsync } from "fastify";
import {
  handleGetCalls,
  handleGetCallDetail,
  handleGetCallBilling,
} from "../controllers/callController.js";

const callWithUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    avatar: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: ["id", "name", "avatar"],
  additionalProperties: false,
} as const;

const callHistoryItemSchema = {
  type: "object",
  properties: {
    callId: { type: "string" },
    withUser: callWithUserSchema,
    startedAt: { type: "string" },
    endedAt: { type: "string" },
    durationSeconds: { type: "number" },
    billedUnits: { type: "number" },
    billedPoints: { type: "number" },
  },
  required: [
    "callId",
    "withUser",
    "startedAt",
    "endedAt",
    "durationSeconds",
    "billedUnits",
    "billedPoints",
  ],
  additionalProperties: false,
} as const;

const callsSuccessSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    page: { type: "number" },
    limit: { type: "number" },
    calls: {
      type: "array",
      items: callHistoryItemSchema,
    },
  },
  required: ["status", "page", "limit", "calls"],
  additionalProperties: false,
} as const;

const callBillingUnitSchema = {
  type: "object",
  properties: {
    minute: { type: "number" },
    chargedPoints: { type: "number" },
    timestamp: { type: "string" },
  },
  required: ["minute", "chargedPoints", "timestamp"],
  additionalProperties: false,
} as const;

const callDetailSuccessSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    call: {
      type: "object",
      properties: {
        callId: { type: "string" },
        withUser: callWithUserSchema,
        startedAt: { type: "string" },
        endedAt: { type: "string" },
        durationSeconds: { type: "number" },
        billedUnits: { type: "number" },
        billedPoints: { type: "number" },
        billingUnits: {
          type: "array",
          items: callBillingUnitSchema,
        },
      },
      required: [
        "callId",
        "withUser",
        "startedAt",
        "endedAt",
        "durationSeconds",
        "billedUnits",
        "billedPoints",
        "billingUnits",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "call"],
  additionalProperties: false,
} as const;

const callBillingSuccessSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    callId: { type: "string" },
    billingUnits: {
      type: "array",
      items: callBillingUnitSchema,
    },
  },
  required: ["status", "callId", "billingUnits"],
  additionalProperties: false,
} as const;

const callDetailParamsSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
  },
  required: ["callId"],
  additionalProperties: false,
} as const;

const callsErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

const callsQuerySchema = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  additionalProperties: false,
} as const;

export const callsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/calls",
    {
      schema: {
        querystring: callsQuerySchema,
        response: {
          200: callsSuccessSchema,
          400: callsErrorSchema,
          401: callsErrorSchema,
          403: callsErrorSchema,
          500: callsErrorSchema,
        },
        tags: ["calls"],
        description: "CALL-01: Fetch authenticated call history",
      },
    },
    handleGetCalls
  );

  app.get(
    "/calls/:callId",
    {
      schema: {
        params: callDetailParamsSchema,
        response: {
          200: callDetailSuccessSchema,
          400: callsErrorSchema,
          401: callsErrorSchema,
          403: callsErrorSchema,
          404: callsErrorSchema,
          500: callsErrorSchema,
        },
        tags: ["calls"],
        description: "CALL-02: Fetch detailed call history entry",
      },
    },
    handleGetCallDetail
  );

  app.get(
    "/calls/:callId/billing",
    {
      schema: {
        params: callDetailParamsSchema,
        response: {
          200: callBillingSuccessSchema,
          400: callsErrorSchema,
          401: callsErrorSchema,
          403: callsErrorSchema,
          404: callsErrorSchema,
          500: callsErrorSchema,
        },
        tags: ["calls"],
        description: "CALL-03: Fetch per-minute billing units",
      },
    },
    handleGetCallBilling
  );
};
