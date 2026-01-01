import type { FastifyReply, FastifyRequest } from "fastify";
import { signUpUser } from "../services/authService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignUpBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function handlePostAuthSignup(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as SignUpBody | undefined;
  if (!body || typeof body !== "object") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PAYLOAD",
      message: "Request body is required.",
    });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || name.length < 1 || name.length > 32) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_NAME",
      message: "名前を正しく入力してください。",
    });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_EMAIL",
      message: "正しいメールアドレスを入力してください。",
    });
  }

  if (
    !password ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 64
  ) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PASSWORD",
      message: "パスワードは 8〜64 文字で入力してください。",
    });
  }

  try {
    const result = await signUpUser({ name, email, password });
    if (!result.success) {
      if (result.reason === "EMAIL_ALREADY_USED") {
        return reply.status(409).send({
          status: "error",
          error: "EMAIL_ALREADY_USED",
          message: "このメールアドレスはすでに登録されています。",
        });
      }

      return reply.status(500).send({
        status: "error",
        error: "DB_ERROR",
        message: "サーバーエラーが発生しました。",
      });
    }

    return reply.status(201).send({
      status: "success",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    request.log.error(error, "Failed to process signup request");
    return reply.status(500).send({
      status: "error",
      error: "TOKEN_ERROR",
      message: "トークン生成に失敗しました。",
    });
  }
}
