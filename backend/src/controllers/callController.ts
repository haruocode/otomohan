import type { FastifyReply, FastifyRequest } from "fastify";
import { listCallHistoryForAccount } from "../services/callService.js";

type CallsQuery = {
  page?: number;
  limit?: number;
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
