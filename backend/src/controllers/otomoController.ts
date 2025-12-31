import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getOtomoList,
  getOtomoDetail,
  getOtomoReviews,
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
