import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getOtomoList,
  getOtomoDetail,
  getOtomoReviews,
  updateOtomoStatusEntry,
} from "../services/otomoService.js";

type OtomoListQuerystring = {
  isOnline?: boolean;
  genre?: string;
  minAge?: number;
  maxAge?: number;
  limit?: number;
  offset?: number;
};

type OtomoDetailParams = {
  id?: string;
};

type OtomoReviewQuerystring = {
  limit?: number;
  offset?: number;
  sort?: "newest" | "highest" | "lowest";
};

type UpdateOtomoStatusBody = {
  otomoId?: string;
  isOnline?: boolean;
  isAvailable?: boolean;
  statusMessage?: string;
};

const STATUS_MESSAGE_MAX = 140;

export async function handleGetOtomoList(
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

  const query = (request.query ?? {}) as OtomoListQuerystring;

  if (
    typeof query.minAge === "number" &&
    typeof query.maxAge === "number" &&
    query.minAge > query.maxAge
  ) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_FILTER",
      message: "minAge must be less than or equal to maxAge.",
    });
  }

  const result = await getOtomoList(query);
  return reply.send({
    status: "success",
    items: result.items,
    total: result.total,
  });
}

export async function handleGetOtomoDetail(
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

  const params = (request.params ?? {}) as OtomoDetailParams;
  const otomoId = params.id;

  if (!otomoId) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_OTOMO_ID",
      message: "Otomo ID is required.",
    });
  }

  const detail = await getOtomoDetail(otomoId);
  if (!detail) {
    return reply.status(404).send({
      status: "error",
      error: "OTOMO_NOT_FOUND",
      message: "指定されたおともはんは存在しません。",
    });
  }

  return reply.send({
    status: "success",
    otomo: detail,
  });
}

export async function handleGetOtomoReviews(
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

  const params = (request.params ?? {}) as OtomoDetailParams;
  const otomoId = params.id;
  if (!otomoId) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_OTOMO_ID",
      message: "Otomo ID is required.",
    });
  }

  const query = (request.query ?? {}) as OtomoReviewQuerystring;
  if (
    query.sort !== undefined &&
    query.sort !== "newest" &&
    query.sort !== "highest" &&
    query.sort !== "lowest"
  ) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_SORT",
      message: "sort must be newest, highest, or lowest.",
    });
  }

  const reviews = await getOtomoReviews(otomoId, query);
  if (!reviews) {
    return reply.status(404).send({
      status: "error",
      error: "OTOMO_NOT_FOUND",
      message: "指定されたおともはんは存在しません。",
    });
  }

  return reply.send({
    status: "success",
    items: reviews.items,
    total: reviews.total,
  });
}

export async function handleUpdateOtomoStatus(
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

  if (authUser.role !== "otomo" && authUser.role !== "admin") {
    return reply.status(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "ステータスを更新する権限がありません。",
    });
  }

  const body = (request.body ?? {}) as UpdateOtomoStatusBody;

  if (!body.otomoId || typeof body.otomoId !== "string") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_OTOMO_ID",
      message: "otomoId is required.",
    });
  }

  if (typeof body.isOnline !== "boolean") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_STATUS",
      message: "isOnline must be a boolean.",
    });
  }

  if (typeof body.isAvailable !== "boolean") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_STATUS",
      message: "isAvailable must be a boolean.",
    });
  }

  let statusMessage: string | null = null;
  if (body.statusMessage !== undefined) {
    if (typeof body.statusMessage !== "string") {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_STATUS_MESSAGE",
        message: "statusMessage must be a string.",
      });
    }
    const trimmed = body.statusMessage.trim();
    if (trimmed.length > STATUS_MESSAGE_MAX) {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_STATUS_MESSAGE",
        message: `statusMessage must be ${STATUS_MESSAGE_MAX} characters or less.`,
      });
    }
    statusMessage = trimmed.length > 0 ? trimmed : null;
  }

  const result = await updateOtomoStatusEntry(
    {
      otomoId: body.otomoId,
      isOnline: body.isOnline,
      isAvailable: body.isAvailable,
      statusMessage,
    },
    {
      id: authUser.id,
      role: authUser.role,
    }
  );

  if (!result.success) {
    if (result.reason === "OTOMO_NOT_FOUND") {
      return reply.status(404).send({
        status: "error",
        error: "OTOMO_NOT_FOUND",
        message: "指定されたおともはんは存在しません。",
      });
    }

    if (result.reason === "FORBIDDEN") {
      return reply.status(403).send({
        status: "error",
        error: "FORBIDDEN",
        message: "ステータスを更新する権限がありません。",
      });
    }

    return reply.status(500).send({
      status: "error",
      error: "UPDATE_FAILED",
      message: "Failed to update status.",
    });
  }

  return reply.send({
    status: "success",
    otomo: result.otomo,
  });
}
