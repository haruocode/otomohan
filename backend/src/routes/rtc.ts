import type { FastifyPluginAsync } from "fastify";
import { getRouterRtpCapabilities } from "../lib/rtc/routerCapabilities.js";
import { createTransportForParticipant } from "../services/rtcTransportService.js";

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

const rtcTransportRequestSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
    direction: { type: "string", enum: ["send", "recv"] },
  },
  required: ["callId", "direction"],
  additionalProperties: false,
} as const;

const rtcTransportSuccessSchema = {
  type: "object",
  properties: {
    transportId: { type: "string" },
    iceParameters: {
      type: "object",
      properties: {
        usernameFragment: { type: "string" },
        password: { type: "string" },
        iceLite: { type: "boolean" },
      },
      required: ["usernameFragment", "password", "iceLite"],
      additionalProperties: false,
    },
    iceCandidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          foundation: { type: "string" },
          priority: { type: "number" },
          ip: { type: "string" },
          protocol: { type: "string", enum: ["udp", "tcp"] },
          port: { type: "number" },
          type: {
            type: "string",
            enum: ["host", "srflx", "prflx", "relay"],
          },
        },
        required: ["foundation", "priority", "ip", "protocol", "port", "type"],
        additionalProperties: false,
      },
    },
    dtlsParameters: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["auto", "client", "server"] },
        fingerprints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              algorithm: { type: "string" },
              value: { type: "string" },
            },
            required: ["algorithm", "value"],
            additionalProperties: false,
          },
        },
      },
      required: ["role", "fingerprints"],
      additionalProperties: false,
    },
  },
  required: ["transportId", "iceParameters", "iceCandidates", "dtlsParameters"],
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

  app.post(
    "/rtc/transports",
    {
      schema: {
        body: rtcTransportRequestSchema,
        response: {
          201: rtcTransportSuccessSchema,
          400: rtcCapabilitiesErrorSchema,
          401: rtcCapabilitiesErrorSchema,
          403: rtcCapabilitiesErrorSchema,
          404: rtcCapabilitiesErrorSchema,
          409: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description: "RTC-02: Create mediasoup WebRTC transport",
      },
    },
    async (request, reply) => {
      if (!request.user) {
        await reply.status(401).send({
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication is required to manage RTC transports.",
        });
        return;
      }

      const body = request.body as {
        callId: string;
        direction: "send" | "recv";
      };

      try {
        const result = await createTransportForParticipant({
          callId: body.callId,
          requesterUserId: request.user.id,
          direction: body.direction,
        });

        if (!result.success) {
          const statusCode =
            result.reason === "CALL_NOT_FOUND"
              ? 404
              : result.reason === "FORBIDDEN"
              ? 403
              : 409;

          await reply.status(statusCode).send({
            status: "error",
            error: result.reason,
            message: buildTransportErrorMessage(result.reason),
          });
          return;
        }

        await reply.status(201).send({
          transportId: result.transport.transportId,
          iceParameters: result.transport.iceParameters,
          iceCandidates: result.transport.iceCandidates,
          dtlsParameters: result.transport.dtlsParameters,
        });
      } catch (error) {
        request.log.error(error, "Failed to create RTC transport");
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Failed to create RTC transport.",
        });
      }
    }
  );
};

function buildTransportErrorMessage(
  reason: "CALL_NOT_FOUND" | "FORBIDDEN" | "INVALID_STATE"
): string {
  switch (reason) {
    case "CALL_NOT_FOUND":
      return "Specified call could not be found.";
    case "FORBIDDEN":
      return "You are not allowed to create transports for this call.";
    case "INVALID_STATE":
    default:
      return "Call is not in a state that allows transport creation.";
  }
}
