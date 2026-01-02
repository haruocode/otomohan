import type { FastifyPluginAsync } from "fastify";
import type { SocketStream } from "@fastify/websocket";
import type { RawData } from "ws";
import {
  initiateCallRequest,
  acceptCallRequest,
  rejectCallRequest,
} from "../services/callRequestService.js";
import {
  registerConnection,
  unregisterConnection,
  sendJson,
  broadcastToUser,
} from "./connectionRegistry.js";
import { sendWsError } from "./wsError.js";

type CallRequestMessage = {
  type: "call_request";
  toUserId: string;
  callId: string;
};

type CallAcceptMessage = {
  type: "call_accept";
  callId: string;
};

type CallRejectMessage = {
  type: "call_reject";
  callId: string;
  reason?: string;
};

type GatewayMessage =
  | CallRequestMessage
  | CallAcceptMessage
  | CallRejectMessage;

function parseMessage(raw: RawData): GatewayMessage | null {
  try {
    const parsed = JSON.parse(raw.toString());
    if (!parsed || typeof parsed.type !== "string") {
      return null;
    }

    if (
      parsed.type === "call_request" &&
      typeof parsed.toUserId === "string" &&
      typeof parsed.callId === "string"
    ) {
      const toUserId = parsed.toUserId.trim();
      const callId = parsed.callId.trim();
      if (!toUserId || !callId) {
        return null;
      }
      return {
        type: "call_request",
        toUserId,
        callId,
      };
    }

    if (parsed.type === "call_accept" && typeof parsed.callId === "string") {
      const callId = parsed.callId.trim();
      if (!callId) {
        return null;
      }
      return {
        type: "call_accept",
        callId,
      };
    }

    if (parsed.type === "call_reject" && typeof parsed.callId === "string") {
      const callId = parsed.callId.trim();
      if (!callId) {
        return null;
      }
      const reason =
        typeof parsed.reason === "string" ? parsed.reason.trim() : undefined;
      return {
        type: "call_reject",
        callId,
        reason,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export const callGatewayRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/ws/call",
    { websocket: true },
    (connection: SocketStream, request) => {
      const authUser = request.user;
      if (!authUser) {
        connection.socket.close(4401, "UNAUTHORIZED");
        return;
      }

      registerConnection(authUser.id, connection.socket);

      connection.socket.on("message", async (raw) => {
        const message = parseMessage(raw);
        if (!message) {
          sendWsError(connection.socket, "INVALID_WS_MESSAGE", {
            message: "Invalid WebSocket message payload.",
          });
          return;
        }

        if (message.type === "call_request") {
          try {
            const result = await initiateCallRequest({
              callId: message.callId,
              callerId: authUser.id,
              targetUserId: message.toUserId,
            });

            if (!result.success) {
              const context = {
                callId: message.callId,
                targetUserId: message.toUserId,
              } as const;

              sendWsError(connection.socket, result.reason, {
                context,
              });
              return;
            }

            sendJson(connection.socket, {
              type: "call_request_ack",
              callId: result.callId,
              status: "requesting",
            });

            broadcastToUser(result.target.ownerUserId, {
              type: "incoming_call",
              callId: result.callId,
              fromUserId: result.caller.id,
              fromUserName: result.caller.name,
              fromUserAvatar: result.caller.avatar,
              otomoId: result.target.otomoId,
              otomoDisplayName: result.target.displayName,
            });
          } catch (error) {
            request.log.error(error, "Failed to process call_request message");
            sendWsError(connection.socket, "INTERNAL_ERROR", {
              context: { callId: message.callId },
            });
          }
          return;
        }

        if (message.type === "call_accept") {
          if (authUser.role !== "otomo" && authUser.role !== "admin") {
            sendWsError(connection.socket, "FORBIDDEN", {
              message: "Only otomo accounts can accept calls.",
            });
            return;
          }

          try {
            const result = await acceptCallRequest({
              callId: message.callId,
              responderUserId: authUser.id,
            });

            if (!result.success) {
              const errorCode =
                result.reason === "CALL_NOT_FOUND"
                  ? "CALL_NOT_FOUND"
                  : result.reason === "FORBIDDEN"
                  ? "FORBIDDEN"
                  : "INVALID_CALL_STATE";

              sendWsError(connection.socket, errorCode, {
                context: { callId: message.callId },
              });
              return;
            }

            sendJson(connection.socket, {
              type: "call_accept_ack",
              callId: result.callId,
              status: "connecting",
            });

            broadcastToUser(result.callerUserId, {
              type: "call_accepted",
              callId: result.callId,
              timestamp: result.timestamp,
            });
          } catch (error) {
            request.log.error(error, "Failed to process call_accept message");
            sendWsError(connection.socket, "INTERNAL_ERROR", {
              context: { callId: message.callId },
            });
          }
          return;
        }

        if (message.type === "call_reject") {
          if (authUser.role !== "otomo" && authUser.role !== "admin") {
            sendWsError(connection.socket, "FORBIDDEN", {
              message: "Only otomo accounts can reject calls.",
            });
            return;
          }

          try {
            const result = await rejectCallRequest({
              callId: message.callId,
              responderUserId: authUser.id,
              reason: message.reason,
            });

            if (!result.success) {
              const errorCode =
                result.reason === "CALL_NOT_FOUND"
                  ? "CALL_NOT_FOUND"
                  : result.reason === "FORBIDDEN"
                  ? "FORBIDDEN"
                  : "INVALID_CALL_STATE";
              sendWsError(connection.socket, errorCode, {
                context: { callId: message.callId },
              });
              return;
            }

            sendJson(connection.socket, {
              type: "call_reject_ack",
              callId: result.callId,
              status: "idle",
            });

            broadcastToUser(result.callerUserId, {
              type: "call_rejected",
              payload: {
                callId: result.callId,
                otomoId: result.otomoId,
                reason: result.reason,
                timestamp: result.timestamp,
              },
            });
          } catch (error) {
            request.log.error(error, "Failed to process call_reject message");
            sendWsError(connection.socket, "INTERNAL_ERROR", {
              context: { callId: message.callId },
            });
          }
          return;
        }
      });

      connection.socket.on("close", () => {
        unregisterConnection(authUser.id, connection.socket);
      });
    }
  );
};
