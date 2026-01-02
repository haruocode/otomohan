import type { FastifyReply, FastifyRequest } from "fastify";
import { markCallConnectedBySfu } from "../services/callRequestService.js";
import {
  registerRtpHeartbeat,
  startCallBillingTimer,
  stopCallBillingTimer,
} from "../services/callBillingTimer.js";
import { broadcastToUsers } from "../ws/connectionRegistry.js";
import {
  finalizeCallSessionAndBroadcast,
  type CallEndReason,
} from "../services/callLifecycleService.js";
import { normalizeCallEndReason } from "../lib/call-end-reason.js";

type CallParams = {
  callId: string;
};

type CallConnectedBody = {
  timestamp?: string;
};

type HeartbeatBody = {
  timestamp?: string;
};

type CallEndBody = {
  reason?: string;
  timestamp?: string;
  durationSeconds?: number;
  totalChargedPoints?: number;
};

function ensureAdmin(request: FastifyRequest, reply: FastifyReply): boolean {
  const authUser = request.user;
  if (!authUser || authUser.role !== "admin") {
    void reply.status(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "SFU endpoints require admin role",
    });
    return false;
  }
  return true;
}

export async function handlePostSfuCallConnected(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!ensureAdmin(request, reply)) {
    return;
  }

  const params = request.params as CallParams;
  const body = request.body as CallConnectedBody | undefined;
  const trimmedCallId = params.callId?.trim();
  if (!trimmedCallId) {
    await reply.status(400).send({
      status: "error",
      error: "INVALID_CALL_ID",
      message: "callId is required",
    });
    return;
  }

  const result = await markCallConnectedBySfu({
    callId: trimmedCallId,
    method: "sfu_rtp_detected",
  });

  if (!result.success) {
    const statusCode =
      result.reason === "CALL_NOT_FOUND"
        ? 404
        : result.reason === "INVALID_STATE"
        ? 409
        : 400;
    await reply.status(statusCode).send({
      status: "error",
      error: result.reason,
      message: "Unable to mark call connected",
    });
    return;
  }

  const timestamp =
    typeof body?.timestamp === "string" && body.timestamp.trim().length > 0
      ? body.timestamp.trim()
      : result.connectedAt;

  if (!result.alreadyConnected) {
    broadcastToUsers([result.userId, result.otomoOwnerUserId], {
      type: "call_connected",
      payload: {
        callId: result.callId,
        userId: result.userId,
        otomoId: result.otomoId,
        connectedAt: timestamp,
        method: result.method,
      },
    });
  }

  startCallBillingTimer({
    callId: result.callId,
    userId: result.userId,
    otomoId: result.otomoId,
    otomoOwnerUserId: result.otomoOwnerUserId,
    pricePerMinute: result.pricePerMinute,
    connectedAt: timestamp,
  });

  registerRtpHeartbeat(result.callId, timestamp);

  await reply.send({
    status: "success",
    callId: result.callId,
    connectedAt: timestamp,
    broadcastsSent: result.alreadyConnected ? 0 : 2,
  });
}

export async function handlePostSfuHeartbeat(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!ensureAdmin(request, reply)) {
    return;
  }

  const params = request.params as CallParams;
  const body = request.body as HeartbeatBody | undefined;
  const trimmedCallId = params.callId?.trim();
  if (!trimmedCallId) {
    await reply.status(400).send({
      status: "error",
      error: "INVALID_CALL_ID",
      message: "callId is required",
    });
    return;
  }

  const registered = registerRtpHeartbeat(
    trimmedCallId,
    body?.timestamp?.trim()
  );

  if (!registered) {
    await reply.status(404).send({
      status: "error",
      error: "CALL_NOT_FOUND",
      message: "No active billing timer for call",
    });
    return;
  }

  await reply.send({
    status: "success",
    callId: trimmedCallId,
    heartbeatRegistered: true,
  });
}

export async function handlePostSfuCallEnd(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!ensureAdmin(request, reply)) {
    return;
  }

  const params = request.params as CallParams;
  const body = request.body as CallEndBody | undefined;
  const trimmedCallId = params.callId?.trim();
  if (!trimmedCallId) {
    await reply.status(400).send({
      status: "error",
      error: "INVALID_CALL_ID",
      message: "callId is required",
    });
    return;
  }

  const reason: CallEndReason = normalizeCallEndReason(body?.reason);
  const timestamp = body?.timestamp?.trim();

  stopCallBillingTimer(trimmedCallId, reason);

  const result = await finalizeCallSessionAndBroadcast({
    callId: trimmedCallId,
    reason,
    endedAt: timestamp && timestamp.length ? timestamp : undefined,
    durationSeconds:
      typeof body?.durationSeconds === "number"
        ? body.durationSeconds
        : undefined,
    totalChargedPoints:
      typeof body?.totalChargedPoints === "number"
        ? body.totalChargedPoints
        : undefined,
  });

  if (!result.success) {
    const statusCode = result.reason === "CALL_NOT_FOUND" ? 404 : 404;
    await reply.status(statusCode).send({
      status: "error",
      error: result.reason,
      message: "Unable to finalize call",
    });
    return;
  }

  await reply.send({
    status: "success",
    callId: trimmedCallId,
    alreadyEnded: result.alreadyEnded,
    reason,
  });
}
