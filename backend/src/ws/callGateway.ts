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
          sendJson(connection.socket, {
            type: "error",
            error: "INVALID_WS_MESSAGE",
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
              if (result.reason === "OTOMO_OFFLINE") {
                sendJson(connection.socket, {
                  type: "call_rejected",
                  reason: "offline",
                });
                return;
              }
              if (result.reason === "OTOMO_BUSY") {
                sendJson(connection.socket, {
                  type: "call_rejected",
                  reason: "busy",
                });
                return;
              }
              if (result.reason === "CALLER_BUSY") {
                sendJson(connection.socket, {
                  type: "error",
                  error: "CALLER_BUSY",
                });
                return;
              }
              sendJson(connection.socket, {
                type: "error",
                error: result.reason,
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
            sendJson(connection.socket, {
              type: "error",
              error: "SERVER_ERROR",
            });
          }
          return;
        }

        if (message.type === "call_accept") {
          if (authUser.role !== "otomo" && authUser.role !== "admin") {
            sendJson(connection.socket, {
              type: "error",
              error: "FORBIDDEN",
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

              sendJson(connection.socket, {
                type: "error",
                error: errorCode,
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
            sendJson(connection.socket, {
              type: "error",
              error: "SERVER_ERROR",
            });
          }
          return;
        }

        if (message.type === "call_reject") {
          if (authUser.role !== "otomo" && authUser.role !== "admin") {
            sendJson(connection.socket, {
              type: "error",
              error: "FORBIDDEN",
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
              sendJson(connection.socket, {
                type: "error",
                error: errorCode,
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
            sendJson(connection.socket, {
              type: "error",
              error: "SERVER_ERROR",
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
