import type { FastifyPluginAsync } from "fastify";
import {
  handlePostSfuCallConnected,
  handlePostSfuHeartbeat,
} from "../controllers/sfuController.js";

const callParamsSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
  },
  required: ["callId"],
  additionalProperties: false,
} as const;

const callConnectedBodySchema = {
  type: "object",
  properties: {
    timestamp: { type: "string", format: "date-time" },
  },
  additionalProperties: false,
} as const;

const heartbeatBodySchema = {
  type: "object",
  properties: {
    timestamp: { type: "string", format: "date-time" },
  },
  additionalProperties: false,
} as const;

const successResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    callId: { type: "string" },
  },
  required: ["status", "callId"],
  additionalProperties: true,
} as const;

const errorResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const sfuRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/sfu/calls/:callId/connected",
    {
      schema: {
        params: callParamsSchema,
        body: callConnectedBodySchema,
        response: {
          200: successResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
        tags: ["sfu"],
        description: "WS-S04: Mark call as connected via SFU",
      },
    },
    handlePostSfuCallConnected
  );

  app.post(
    "/sfu/calls/:callId/rtp",
    {
      schema: {
        params: callParamsSchema,
        body: heartbeatBodySchema,
        response: {
          200: successResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
        tags: ["sfu"],
        description: "WS-S05: Update RTP heartbeat for billing timer",
      },
    },
    handlePostSfuHeartbeat
  );
};
