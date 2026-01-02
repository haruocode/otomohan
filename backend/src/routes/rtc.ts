import type { FastifyPluginAsync } from "fastify";
import { getRouterRtpCapabilities } from "../lib/rtc/routerCapabilities.js";
import type { DtlsParameters } from "../lib/rtc/transportStore.js";
import {
  createTransportForParticipant,
  connectTransportForParticipant,
} from "../services/rtcTransportService.js";
import { createProducerForParticipant } from "../services/rtcProducerService.js";
import {
  createConsumerForParticipant,
  resumeConsumerForParticipant,
} from "../services/rtcConsumerService.js";
import { cleanupRtcResourcesForCall } from "../services/rtcCleanupService.js";

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

const dtlsFingerprintSchema = {
  type: "object",
  properties: {
    algorithm: { type: "string" },
    value: { type: "string" },
  },
  required: ["algorithm", "value"],
  additionalProperties: false,
} as const;

const dtlsParametersSchema = {
  type: "object",
  properties: {
    role: { type: "string", enum: ["auto", "client", "server"] },
    fingerprints: {
      type: "array",
      minItems: 1,
      items: dtlsFingerprintSchema,
    },
  },
  required: ["role", "fingerprints"],
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
    dtlsParameters: dtlsParametersSchema,
  },
  required: ["transportId", "iceParameters", "iceCandidates", "dtlsParameters"],
  additionalProperties: false,
} as const;

const rtcTransportConnectResponseSchema = {
  type: "object",
  properties: {
    connected: { type: "boolean" },
  },
  required: ["connected"],
  additionalProperties: false,
} as const;

const transportIdParamsSchema = {
  type: "object",
  properties: {
    transportId: { type: "string", minLength: 1 },
  },
  required: ["transportId"],
  additionalProperties: false,
} as const;

const rtcTransportConnectBodySchema = {
  type: "object",
  properties: {
    dtlsParameters: dtlsParametersSchema,
  },
  required: ["dtlsParameters"],
  additionalProperties: false,
} as const;

const rtcProducerRequestSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
    transportId: { type: "string", minLength: 1 },
    kind: { type: "string", enum: ["audio"] },
    rtpParameters: { type: "object" },
  },
  required: ["callId", "transportId", "kind", "rtpParameters"],
  additionalProperties: false,
} as const;

const rtcProducerResponseSchema = {
  type: "object",
  properties: {
    producerId: { type: "string" },
  },
  required: ["producerId"],
  additionalProperties: false,
} as const;

const rtcConsumerRequestSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
    transportId: { type: "string", minLength: 1 },
    producerId: { type: "string", minLength: 1 },
  },
  required: ["callId", "transportId", "producerId"],
  additionalProperties: false,
} as const;

const rtcConsumerResponseSchema = {
  type: "object",
  properties: {
    consumerId: { type: "string" },
    kind: { type: "string", enum: ["audio"] },
    rtpParameters: { type: "object" },
    producerPaused: { type: "boolean" },
  },
  required: ["consumerId", "kind", "rtpParameters", "producerPaused"],
  additionalProperties: false,
} as const;

const consumerIdParamsSchema = {
  type: "object",
  properties: {
    consumerId: { type: "string", minLength: 1 },
  },
  required: ["consumerId"],
  additionalProperties: false,
} as const;

const rtcConsumerResumeResponseSchema = {
  type: "object",
  properties: {
    resumed: { type: "boolean" },
  },
  required: ["resumed"],
  additionalProperties: false,
} as const;

const rtcRoomCleanupParamsSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
  },
  required: ["callId"],
  additionalProperties: false,
} as const;

const rtcRoomCleanupResponseSchema = {
  type: "object",
  properties: {
    cleaned: { type: "boolean" },
    released: {
      type: "object",
      properties: {
        transports: { type: "number" },
        producers: { type: "number" },
        consumers: { type: "number" },
      },
      required: ["transports", "producers", "consumers"],
      additionalProperties: false,
    },
  },
  required: ["cleaned", "released"],
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

  app.post(
    "/rtc/producers",
    {
      schema: {
        body: rtcProducerRequestSchema,
        response: {
          201: rtcProducerResponseSchema,
          400: rtcCapabilitiesErrorSchema,
          401: rtcCapabilitiesErrorSchema,
          403: rtcCapabilitiesErrorSchema,
          404: rtcCapabilitiesErrorSchema,
          409: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description: "RTC-04: Create an audio producer",
      },
    },
    async (request, reply) => {
      if (!request.user) {
        await reply.status(401).send({
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication is required to manage RTC producers.",
        });
        return;
      }

      const body = request.body as {
        callId: string;
        transportId: string;
        kind: "audio";
        rtpParameters: unknown;
      };

      try {
        const result = await createProducerForParticipant({
          callId: body.callId,
          transportId: body.transportId,
          kind: body.kind,
          rtpParameters: body.rtpParameters,
          requesterUserId: request.user.id,
        });

        if (!result.success) {
          const statusCode = mapProducerStatus(result.reason);
          await reply.status(statusCode).send({
            status: "error",
            error: result.reason,
            message: buildProducerErrorMessage(result.reason),
          });
          return;
        }

        await reply.status(201).send({
          producerId: result.producer.producerId,
        });
      } catch (error) {
        request.log.error(error, "Failed to create RTC producer");
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Failed to create RTC producer.",
        });
      }
    }
  );

  app.post(
    "/rtc/consumers",
    {
      schema: {
        body: rtcConsumerRequestSchema,
        response: {
          201: rtcConsumerResponseSchema,
          400: rtcCapabilitiesErrorSchema,
          401: rtcCapabilitiesErrorSchema,
          403: rtcCapabilitiesErrorSchema,
          404: rtcCapabilitiesErrorSchema,
          409: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description: "RTC-05: Create an audio consumer",
      },
    },
    async (request, reply) => {
      if (!request.user) {
        await reply.status(401).send({
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication is required to manage RTC consumers.",
        });
        return;
      }

      const body = request.body as {
        callId: string;
        transportId: string;
        producerId: string;
      };

      try {
        const result = await createConsumerForParticipant({
          callId: body.callId,
          transportId: body.transportId,
          producerId: body.producerId,
          requesterUserId: request.user.id,
        });

        if (!result.success) {
          const statusCode = mapConsumerStatus(result.reason);
          await reply.status(statusCode).send({
            status: "error",
            error: result.reason,
            message: buildConsumerErrorMessage(result.reason),
          });
          return;
        }

        await reply.status(201).send({
          consumerId: result.consumer.consumerId,
          kind: result.consumer.kind,
          rtpParameters: result.consumer.rtpParameters,
          producerPaused: result.consumer.producerPaused,
        });
      } catch (error) {
        request.log.error(error, "Failed to create RTC consumer");
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Failed to create RTC consumer.",
        });
      }
    }
  );

  app.post(
    "/rtc/consumers/:consumerId/resume",
    {
      schema: {
        params: consumerIdParamsSchema,
        response: {
          200: rtcConsumerResumeResponseSchema,
          401: rtcCapabilitiesErrorSchema,
          403: rtcCapabilitiesErrorSchema,
          404: rtcCapabilitiesErrorSchema,
          409: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description: "RTC-06: Resume an audio consumer",
      },
    },
    async (request, reply) => {
      if (!request.user) {
        await reply.status(401).send({
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication is required to resume RTC consumers.",
        });
        return;
      }

      const params = request.params as { consumerId: string };

      try {
        const result = await resumeConsumerForParticipant({
          consumerId: params.consumerId,
          requesterUserId: request.user.id,
        });

        if (!result.success) {
          const statusCode = mapConsumerResumeStatus(result.reason);
          await reply.status(statusCode).send({
            status: "error",
            error: result.reason,
            message: buildConsumerResumeErrorMessage(result.reason),
          });
          return;
        }

        await reply.send({ resumed: true });
      } catch (error) {
        request.log.error(error, "Failed to resume RTC consumer");
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Failed to resume RTC consumer.",
        });
      }
    }
  );

  app.delete(
    "/rtc/rooms/:callId/cleanup",
    {
      schema: {
        params: rtcRoomCleanupParamsSchema,
        response: {
          200: rtcRoomCleanupResponseSchema,
          401: rtcCapabilitiesErrorSchema,
          403: rtcCapabilitiesErrorSchema,
          404: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description:
          "RTC-07: Cleanup transports, producers, and consumers for a call",
      },
    },
    async (request, reply) => {
      if (!request.user) {
        await reply.status(401).send({
          status: "error",
          error: "UNAUTHORIZED",
          message: "Authentication is required to cleanup RTC rooms.",
        });
        return;
      }

      const params = request.params as { callId: string };

      try {
        const result = await cleanupRtcResourcesForCall({
          callId: params.callId,
          requesterUserId: request.user.id,
        });

        if (!result.success) {
          const statusCode = mapRoomCleanupStatus(result.reason);
          await reply.status(statusCode).send({
            status: "error",
            error: result.reason,
            message: buildRoomCleanupErrorMessage(result.reason),
          });
          return;
        }

        await reply.send({
          cleaned: true,
          released: result.released,
        });
      } catch (error) {
        request.log.error(error, "Failed to cleanup RTC room");
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Failed to cleanup RTC room.",
        });
      }
    }
  );

  app.post(
    "/rtc/transports/:transportId/connect",
    {
      schema: {
        params: transportIdParamsSchema,
        body: rtcTransportConnectBodySchema,
        response: {
          200: rtcTransportConnectResponseSchema,
          400: rtcCapabilitiesErrorSchema,
          401: rtcCapabilitiesErrorSchema,
          403: rtcCapabilitiesErrorSchema,
          404: rtcCapabilitiesErrorSchema,
          409: rtcCapabilitiesErrorSchema,
          500: rtcCapabilitiesErrorSchema,
        },
        tags: ["rtc"],
        description: "RTC-03: Connect a WebRTC transport via DTLS parameters",
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

      const params = request.params as { transportId: string };
      const body = request.body as { dtlsParameters: DtlsParameters };

      try {
        const result = await connectTransportForParticipant({
          transportId: params.transportId,
          requesterUserId: request.user.id,
          dtlsParameters: body.dtlsParameters,
        });

        if (!result.success) {
          const statusCode = mapTransportConnectStatus(result.reason);
          await reply.status(statusCode).send({
            status: "error",
            error: result.reason,
            message: buildTransportConnectErrorMessage(result.reason),
          });
          return;
        }

        await reply.send({ connected: true });
      } catch (error) {
        request.log.error(error, "Failed to connect RTC transport");
        await reply.status(500).send({
          status: "error",
          error: "INTERNAL_ERROR",
          message: "Failed to connect RTC transport.",
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

function mapTransportConnectStatus(
  reason:
    | "TRANSPORT_NOT_FOUND"
    | "FORBIDDEN"
    | "ALREADY_CONNECTED"
    | "CALL_NOT_FOUND"
    | "INVALID_STATE"
): number {
  switch (reason) {
    case "TRANSPORT_NOT_FOUND":
    case "CALL_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "ALREADY_CONNECTED":
    case "INVALID_STATE":
    default:
      return 409;
  }
}

function buildTransportConnectErrorMessage(
  reason:
    | "TRANSPORT_NOT_FOUND"
    | "FORBIDDEN"
    | "ALREADY_CONNECTED"
    | "CALL_NOT_FOUND"
    | "INVALID_STATE"
): string {
  switch (reason) {
    case "TRANSPORT_NOT_FOUND":
      return "Specified transport could not be found.";
    case "CALL_NOT_FOUND":
      return "Associated call could not be found.";
    case "FORBIDDEN":
      return "You are not allowed to connect this transport.";
    case "ALREADY_CONNECTED":
      return "Transport is already connected.";
    case "INVALID_STATE":
    default:
      return "Call is not in a state that allows transport connections.";
  }
}

function mapProducerStatus(
  reason:
    | "CALL_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATE"
    | "TRANSPORT_NOT_FOUND"
    | "TRANSPORT_DIRECTION_MISMATCH"
    | "TRANSPORT_NOT_CONNECTED"
    | "UNSUPPORTED_KIND"
): number {
  switch (reason) {
    case "CALL_NOT_FOUND":
    case "TRANSPORT_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "UNSUPPORTED_KIND":
      return 400;
    case "INVALID_STATE":
    case "TRANSPORT_DIRECTION_MISMATCH":
    case "TRANSPORT_NOT_CONNECTED":
    default:
      return 409;
  }
}

function buildProducerErrorMessage(
  reason:
    | "CALL_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATE"
    | "TRANSPORT_NOT_FOUND"
    | "TRANSPORT_DIRECTION_MISMATCH"
    | "TRANSPORT_NOT_CONNECTED"
    | "UNSUPPORTED_KIND"
): string {
  switch (reason) {
    case "CALL_NOT_FOUND":
      return "Specified call could not be found.";
    case "TRANSPORT_NOT_FOUND":
      return "Specified transport could not be found.";
    case "FORBIDDEN":
      return "You are not allowed to create producers for this call.";
    case "TRANSPORT_NOT_CONNECTED":
      return "Transport must be connected before creating producers.";
    case "TRANSPORT_DIRECTION_MISMATCH":
      return "Transport direction does not support the requested producer kind.";
    case "UNSUPPORTED_KIND":
      return "Requested producer kind is not supported.";
    case "INVALID_STATE":
    default:
      return "Call is not in a state that allows producer creation.";
  }
}

function mapConsumerStatus(
  reason:
    | "CALL_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATE"
    | "TRANSPORT_NOT_FOUND"
    | "PRODUCER_NOT_FOUND"
    | "TRANSPORT_DIRECTION_MISMATCH"
    | "TRANSPORT_NOT_CONNECTED"
): number {
  switch (reason) {
    case "CALL_NOT_FOUND":
    case "TRANSPORT_NOT_FOUND":
    case "PRODUCER_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "INVALID_STATE":
    case "TRANSPORT_DIRECTION_MISMATCH":
    case "TRANSPORT_NOT_CONNECTED":
    default:
      return 409;
  }
}

function buildConsumerErrorMessage(
  reason:
    | "CALL_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATE"
    | "TRANSPORT_NOT_FOUND"
    | "PRODUCER_NOT_FOUND"
    | "TRANSPORT_DIRECTION_MISMATCH"
    | "TRANSPORT_NOT_CONNECTED"
): string {
  switch (reason) {
    case "CALL_NOT_FOUND":
      return "Specified call could not be found.";
    case "TRANSPORT_NOT_FOUND":
      return "Specified transport could not be found.";
    case "PRODUCER_NOT_FOUND":
      return "Specified producer could not be found.";
    case "FORBIDDEN":
      return "You are not allowed to create consumers for this call.";
    case "TRANSPORT_NOT_CONNECTED":
      return "Transport must be connected before creating consumers.";
    case "TRANSPORT_DIRECTION_MISMATCH":
      return "Transport direction does not support the requested consumer kind.";
    case "INVALID_STATE":
    default:
      return "Call is not in a state that allows consumer creation.";
  }
}

function mapConsumerResumeStatus(
  reason:
    | "CONSUMER_NOT_FOUND"
    | "CALL_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATE"
    | "ALREADY_RESUMED"
): number {
  switch (reason) {
    case "CONSUMER_NOT_FOUND":
    case "CALL_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "INVALID_STATE":
    case "ALREADY_RESUMED":
    default:
      return 409;
  }
}

function buildConsumerResumeErrorMessage(
  reason:
    | "CONSUMER_NOT_FOUND"
    | "CALL_NOT_FOUND"
    | "FORBIDDEN"
    | "INVALID_STATE"
    | "ALREADY_RESUMED"
): string {
  switch (reason) {
    case "CONSUMER_NOT_FOUND":
      return "Specified consumer could not be found.";
    case "CALL_NOT_FOUND":
      return "Associated call could not be found.";
    case "FORBIDDEN":
      return "You are not allowed to resume this consumer.";
    case "ALREADY_RESUMED":
      return "Consumer has already been resumed.";
    case "INVALID_STATE":
    default:
      return "Call is not in a state that allows consumer resuming.";
  }
}

function mapRoomCleanupStatus(reason: "CALL_NOT_FOUND" | "FORBIDDEN"): number {
  switch (reason) {
    case "CALL_NOT_FOUND":
      return 404;
    case "FORBIDDEN":
    default:
      return 403;
  }
}

function buildRoomCleanupErrorMessage(
  reason: "CALL_NOT_FOUND" | "FORBIDDEN"
): string {
  switch (reason) {
    case "CALL_NOT_FOUND":
      return "Specified room could not be found.";
    case "FORBIDDEN":
    default:
      return "You are not allowed to cleanup this room.";
  }
}
