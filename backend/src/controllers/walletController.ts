import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getWalletBalance,
  chargeWallet,
  listWalletPlans,
  listWalletPurchaseHistory,
  listWalletUsage,
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

type WalletHistoryQueryParams = {
  limit?: number;
  offset?: number;
  sort?: "newest" | "oldest";
};

type WalletUsageQueryParams = WalletHistoryQueryParams & {
  otomoId?: string;
};

export async function handleGetWalletPurchaseHistory(
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

  const query = request.query as WalletHistoryQueryParams | undefined;
  const limit = query?.limit;
  const offset = query?.offset;
  const sort = query?.sort;

  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_LIMIT",
      message: "limit must be a positive number.",
    });
  }

  if (offset !== undefined && (!Number.isFinite(offset) || offset < 0)) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_OFFSET",
      message: "offset must be zero or greater.",
    });
  }

  if (sort !== undefined && sort !== "newest" && sort !== "oldest") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_SORT",
      message: "sort must be either 'newest' or 'oldest'.",
    });
  }

  try {
    const history = await listWalletPurchaseHistory(authUser.id, {
      limit,
      offset,
      sort,
    });

    return reply.send({
      status: "success",
      items: history.items,
      total: history.total,
    });
  } catch (error) {
    request.log.error(error, "Failed to load wallet purchase history");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "購入履歴の取得に失敗しました。",
    });
  }
}

export async function handleGetWalletUsage(
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

  const query = request.query as WalletUsageQueryParams | undefined;
  const limit = query?.limit;
  const offset = query?.offset;
  const sort = query?.sort;
  const otomoId = query?.otomoId;

  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_LIMIT",
      message: "limit must be a positive number.",
    });
  }

  if (offset !== undefined && (!Number.isFinite(offset) || offset < 0)) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_OFFSET",
      message: "offset must be zero or greater.",
    });
  }

  if (sort !== undefined && sort !== "newest" && sort !== "oldest") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_SORT",
      message: "sort must be either 'newest' or 'oldest'.",
    });
  }

  if (
    otomoId !== undefined &&
    (typeof otomoId !== "string" || !otomoId.trim().length)
  ) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_OTOMO_ID",
      message: "otomoId must be a non-empty string when provided.",
    });
  }

  try {
    const usage = await listWalletUsage(authUser.id, {
      limit,
      offset,
      sort,
      otomoId,
    });

    return reply.send({
      status: "success",
      items: usage.items,
      total: usage.total,
    });
  } catch (error) {
    request.log.error(error, "Failed to load wallet usage history");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "ポイント使用履歴の取得に失敗しました。",
    });
  }
}

type WalletChargeBody = {
  planId?: string;
  paymentId?: string;
  amount?: number;
};

export async function handlePostWalletCharge(
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

  const body = request.body as WalletChargeBody | undefined;
  if (!body || typeof body !== "object") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PAYLOAD",
      message: "Request body is required.",
    });
  }

  const { planId, paymentId, amount } = body;

  if (!planId || typeof planId !== "string" || !planId.trim().length) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PLAN_ID",
      message: "planId must be a non-empty string.",
    });
  }

  if (!paymentId || typeof paymentId !== "string" || !paymentId.trim().length) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PAYMENT_ID",
      message: "paymentId must be a non-empty string.",
    });
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_AMOUNT",
      message: "amount must be a positive number.",
    });
  }

  try {
    const result = await chargeWallet(authUser.id, {
      planId: planId.trim(),
      paymentId: paymentId.trim(),
      amount,
    });

    if (!result.success) {
      if (result.reason === "PLAN_NOT_FOUND") {
        return reply.status(404).send({
          status: "error",
          error: "PLAN_NOT_FOUND",
          message: "指定されたチャージプランが存在しません。",
        });
      }

      if (result.reason === "INVALID_AMOUNT") {
        return reply.status(400).send({
          status: "error",
          error: "INVALID_AMOUNT",
          message: "決済金額がプラン料金と一致しません。",
        });
      }

      if (result.reason === "PAYMENT_ALREADY_PROCESSED") {
        return reply.status(409).send({
          status: "error",
          error: "PAYMENT_ALREADY_PROCESSED",
          message: "この決済IDはすでに処理済みです。",
        });
      }

      return reply.status(500).send({
        status: "error",
        error: "INTERNAL_ERROR",
        message: "予期しないエラーが発生しました。",
      });
    }

    return reply.send({
      status: "success",
      userId: authUser.id,
      chargedPoints: result.chargedPoints,
      balance: result.wallet.balance,
      planId: result.planId,
      paymentId: result.paymentId,
    });
  } catch (error) {
    request.log.error(error, "Failed to process wallet charge");
    return reply.status(500).send({
      status: "error",
      error: "INTERNAL_ERROR",
      message: "ポイント付与に失敗しました。",
    });
  }
}
