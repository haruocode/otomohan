import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getWalletBalance,
  listWalletPlans,
} from "../services/walletService.js";

export async function handleGetWalletBalance(
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

  if (authUser.role !== "user") {
    return reply.status(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "This endpoint is for user accounts only.",
    });
  }

  try {
    const wallet = await getWalletBalance(authUser.id);
    if (!wallet) {
      return reply.status(404).send({
        status: "error",
        error: "WALLET_NOT_FOUND",
        message: "ウォレット情報が見つかりません。",
      });
    }

    return reply.send({
      status: "success",
      wallet,
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch wallet balance");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "ポイント残高の取得に失敗しました。",
    });
  }
}

export async function handleGetWalletPlans(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const plans = await listWalletPlans();
    return reply.send({
      status: "success",
      items: plans,
    });
  } catch (error) {
    reply.log.error(error, "Failed to load wallet plans");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "チャージプラン一覧の取得に失敗しました。",
    });
  }
}
