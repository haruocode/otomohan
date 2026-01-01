import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listCallHistoryForAccount,
  getCallDetailForAccount,
} from "../services/callService.js";

type CallsQuery = {
  page?: number;
  limit?: number;
};

type CallDetailParams = {
  callId?: string;
};

export async function handleGetCalls(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authUser = request.user;
  if (!authUser) {
    return reply.status(401).send({
      status: "error",
      error: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  if (authUser.role !== "user" && authUser.role !== "otomo") {
    return reply.status(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "This endpoint is available for user or otomo accounts only.",
    });
  }

  const query = request.query as CallsQuery | undefined;
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 20;

  if (!Number.isFinite(page) || page < 1) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PAGE",
      message: "page must be a positive number.",
    });
  }

  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_LIMIT",
      message: "limit must be between 1 and 100.",
    });
  }

  const safePage = Math.floor(page);
  const safeLimit = Math.floor(limit);
  const offset = (safePage - 1) * safeLimit;

  try {
    const result = await listCallHistoryForAccount({
      accountId: authUser.id,
      role: authUser.role,
      limit: safeLimit,
      offset,
    });

    return reply.send({
      status: "success",
      page: safePage,
      limit: safeLimit,
      calls: result.calls,
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch call history");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "通話履歴の取得に失敗しました。",
    });
  }
}

export async function handleGetCallDetail(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authUser = request.user;
  if (!authUser) {
    return reply.status(401).send({
      status: "error",
      error: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  if (authUser.role !== "user" && authUser.role !== "otomo") {
    return reply.status(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "This endpoint is available for user or otomo accounts only.",
    });
  }

  const params = request.params as CallDetailParams | undefined;
  const callId = params?.callId?.trim();
  if (!callId) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_CALL_ID",
      message: "callId is required.",
    });
  }

  try {
    const result = await getCallDetailForAccount({
      callId,
      accountId: authUser.id,
      role: authUser.role,
    });

    if (!result.success) {
      if (result.reason === "CALL_NOT_FOUND") {
        return reply.status(404).send({
          status: "error",
          error: "CALL_NOT_FOUND",
          message: "Call record not found.",
        });
      }

      return reply.status(403).send({
        status: "error",
        error: "FORBIDDEN",
        message: "You are not allowed to view this call.",
      });
    }

    return reply.send({
      status: "success",
      call: result.call,
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch call detail");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "通話詳細の取得に失敗しました。",
    });
  }
}
