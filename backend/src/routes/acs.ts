import type { FastifyPluginAsync } from "fastify";
import { getCallToken } from "../services/acsTokenService.js";

/**
 * ACS トークン発行エンドポイント
 * クライアントはこのトークンを使ってAzure Communication Services Calling SDKで通話に参加
 */

const acsTokenRequestSchema = {
  type: "object",
  properties: {
    callId: { type: "string", minLength: 1 },
    existingAcsUserId: { type: "string" },
  },
  required: ["callId"],
  additionalProperties: false,
} as const;

const acsTokenResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "success" },
    acsUserId: { type: "string" },
    token: { type: "string" },
    expiresOn: { type: "string" },
  },
  required: ["status", "acsUserId", "token", "expiresOn"],
  additionalProperties: false,
} as const;

const errorResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "error" },
    error: { type: "string" },
    message: { type: "string" },
  },
  required: ["status", "error", "message"],
  additionalProperties: false,
} as const;

interface AcsTokenRequest {
  callId: string;
  existingAcsUserId?: string;
}

export const acsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /acs/token
   * ACSアクセストークンを取得
   *
   * クライアントは通話開始時にこのエンドポイントを呼び出し、
   * 取得したトークンでACS Calling SDKを初期化する
   */
  app.post<{ Body: AcsTokenRequest }>(
    "/acs/token",
    {
      schema: {
        body: acsTokenRequestSchema,
        response: {
          200: acsTokenResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        // callIdは将来の検証用に保持（現在は未使用）
        const { existingAcsUserId } = request.body;

        // TODO: callIdの検証（通話が存在するか、ユーザーが参加者か）
        // const call = await getCallById(callId);
        // if (!call) {
        //   return reply.code(404).send({
        //     status: "error",
        //     error: "CALL_NOT_FOUND",
        //     message: `Call ${callId} not found`,
        //   });
        // }

        const tokenResponse = await getCallToken(existingAcsUserId);

        return {
          status: "success",
          acsUserId: tokenResponse.acsUserId,
          token: tokenResponse.token,
          expiresOn: tokenResponse.expiresOn,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        // ACS接続文字列が設定されていない場合
        if (message.includes("ACS_CONNECTION_STRING")) {
          reply.code(500);
          return {
            status: "error",
            error: "ACS_NOT_CONFIGURED",
            message: "Azure Communication Services is not configured",
          };
        }

        reply.code(500);
        return {
          status: "error",
          error: "TOKEN_GENERATION_FAILED",
          message,
        };
      }
    }
  );
};
