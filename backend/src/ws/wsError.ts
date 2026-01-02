import WebSocket from "ws";
import { sendJson } from "./connectionRegistry.js";

export type WsErrorCode = string;

export type WsErrorPayload = {
  type: "error";
  code: WsErrorCode;
  message: string;
  timestamp: number;
  context?: Record<string, unknown> | null;
};

const DEFAULT_MESSAGES: Record<WsErrorCode, string> = {
  BAD_REQUEST: "Invalid request payload.",
  INVALID_WS_MESSAGE: "WebSocket message is malformed.",
  FORBIDDEN: "You are not allowed to perform this action.",
  UNAUTHORIZED: "Authentication is required.",
  OTOMO_OFFLINE: "The otomo is currently offline.",
  OTOMO_BUSY: "The otomo is already in another call.",
  CALLER_BUSY: "You are already in a call.",
  CALL_NOT_FOUND: "The specified call does not exist.",
  INVALID_CALL_STATE: "This action is not allowed in the current call state.",
  CALLER_NOT_FOUND: "Caller account was not found.",
  OTOMO_NOT_FOUND: "Otomo account was not found.",
  DUPLICATE_CALL_ID: "The callId is already in use.",
  INTERNAL_ERROR: "An internal server error occurred.",
};

export function buildWsErrorPayload(
  code: WsErrorCode,
  options?: {
    message?: string;
    context?: Record<string, unknown> | null;
    timestamp?: number;
  }
): WsErrorPayload {
  const timestamp = options?.timestamp ?? Math.floor(Date.now() / 1000);
  const payload: WsErrorPayload = {
    type: "error",
    code,
    message: options?.message ?? DEFAULT_MESSAGES[code] ?? "An error occurred.",
    timestamp,
  };

  if (options && "context" in options) {
    payload.context = options.context ?? null;
  }

  return payload;
}

export function sendWsError(
  socket: WebSocket,
  code: WsErrorCode,
  options?: {
    message?: string;
    context?: Record<string, unknown> | null;
    timestamp?: number;
  }
) {
  const payload = buildWsErrorPayload(code, options);
  sendJson(socket, payload);
}
