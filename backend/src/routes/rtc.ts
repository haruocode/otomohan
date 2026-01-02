import type { FastifyPluginAsync } from "fastify";
import { getRouterRtpCapabilities } from "../lib/rtc/routerCapabilities.js";

const rtcpFeedbackSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    parameter: { type: "string" },
  },
  required: ["type"],
  additionalProperties: false,
} as const;

const rtpCodecCapabilitySchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["audio", "video"] },
    mimeType: { type: "string" },
    clockRate: { type: "number" },
    channels: { type: "number" },
    parameters: {
      type: "object",
      additionalProperties: {
        anyOf: [{ type: "number" }, { type: "string" }],
      },
    },
    rtcpFeedback: {
      type: "array",
      items: rtcpFeedbackSchema,
    },
  },
  required: ["kind", "mimeType", "clockRate"],
  additionalProperties: false,
} as const;

const rtpHeaderExtensionSchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["audio", "video"] },
    uri: { type: "string" },
    preferredId: { type: "number" },
    preferredEncrypt: { type: "boolean" },
    direction: {
      type: "string",
      enum: ["sendrecv", "sendonly", "recvonly", "inactive"],
    },
  },
  required: ["kind", "uri", "preferredId", "preferredEncrypt", "direction"],
  additionalProperties: false,
} as const;

const rtcCapabilitiesSuccessSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    rtpCapabilities: {
      type: "object",
      properties: {
        codecs: {
          type: "array",
          items: rtpCodecCapabilitySchema,
        },
        headerExtensions: {
          type: "array",
          items: rtpHeaderExtensionSchema,
        },
      },
      required: ["codecs", "headerExtensions"],
      additionalProperties: false,
    },
  },
  required: ["status", "rtpCapabilities"],
  additionalProperties: false,
} as const;

const rtcCapabilitiesErrorSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

export const rtcRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/rtc/capabilities",
    {
      schema: {
        response: {
          200: rtcCapabilitiesSuccessSchema,
          401: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description: "RTC-01: Fetch mediasoup router RTP capabilities",
      },
    },
    async (request, reply) => {
      if (!request.user) {
        await reply.status(401).send({
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication is required to access RTC capabilities.",
        });
        return;
      }

      const rtpCapabilities = getRouterRtpCapabilities();

      if (!rtpCapabilities) {
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Router RTP capabilities are not initialized.",
        });
        return;
      }

      return reply.send({
        status: "success",
        rtpCapabilities,
      });
    }
  );
};
