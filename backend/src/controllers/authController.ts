import type { FastifyReply, FastifyRequest } from "fastify";
import {
  signUpUser,
  loginUser,
  refreshAccessToken,
  getAuthenticatedUserProfile,
} from "../services/authService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignUpBody = {
  name?: string;
  email?: string;
  password?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

type RefreshBody = {
  refreshToken?: string;
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
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
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

export async function handlePostAuthLogin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as LoginBody | undefined;
  if (!body || typeof body !== "object") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PAYLOAD",
      message: "Request body is required.",
    });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

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
    const result = await loginUser({ email, password });
    if (!result.success) {
      if (result.reason === "INVALID_CREDENTIALS") {
        return reply.status(401).send({
          status: "error",
          error: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません。",
        });
      }

      return reply.status(500).send({
        status: "error",
        error: "DB_ERROR",
        message: "サーバー内部でエラーが発生しました。",
      });
    }

    return reply.send({
      status: "success",
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    request.log.error(error, "Failed to process login request");
    return reply.status(500).send({
      status: "error",
      error: "TOKEN_ERROR",
      message: "トークン生成に失敗しました。",
    });
  }
}

export async function handlePostAuthLogout(
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

  // Otomo specific offline handling would go here once otomo auth is wired.
  return reply.send({
    status: "success",
  });
}

export async function handlePostAuthRefresh(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as RefreshBody | undefined;
  const refreshToken = body?.refreshToken?.trim();

  if (!refreshToken) {
    return reply.status(401).send({
      status: "error",
      error: "INVALID_REFRESH_TOKEN",
      message: "refreshToken is required.",
    });
  }

  try {
    const result = await refreshAccessToken(refreshToken);
    if (!result.success) {
      if (result.reason === "INVALID_REFRESH_TOKEN") {
        return reply.status(401).send({
          status: "error",
          error: "INVALID_REFRESH_TOKEN",
          message: "refreshToken is invalid or expired.",
        });
      }

      return reply.status(500).send({
        status: "error",
        error: "DB_ERROR",
        message: "サーバー内部でエラーが発生しました。",
      });
    }

    return reply.send({
      status: "success",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    request.log.error(error, "Failed to refresh tokens");
    return reply.status(500).send({
      status: "error",
      error: "DB_ERROR",
      message: "サーバー内部でエラーが発生しました。",
    });
  }
}

export async function handleGetAuthMe(
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

  const result = await getAuthenticatedUserProfile({
    userId: authUser.id,
    role: authUser.role,
  });

  if (!result.success) {
    if (result.reason === "NOT_FOUND") {
      return reply.status(404).send({
        status: "error",
        error: "USER_NOT_FOUND",
        message: "User record not found.",
      });
    }

    if (result.reason === "UNSUPPORTED_ROLE") {
      return reply.status(403).send({
        status: "error",
        error: "ROLE_NOT_SUPPORTED",
        message: "The current role cannot use this endpoint.",
      });
    }

    return reply.status(500).send({
      status: "error",
      error: "UNKNOWN_ERROR",
      message: "サーバー内部でエラーが発生しました。",
    });
  }

  return reply.send({
    status: "success",
    user: result.user,
  });
}
