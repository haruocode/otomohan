import type { FastifyReply, FastifyRequest } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  changeUserPassword,
  deleteUserAccount,
} from "../services/userService.js";
import { randomUUID } from "node:crypto";

const NAME_MIN = 1;
const NAME_MAX = 50;
const BIO_MAX = 200;
const SCRIPT_TAG_PATTERN = /<script.*?>.*?<\/script>/gis;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const ASCII_ONLY_REGEX = /^[\x20-\x7E]+$/;

type UpdateProfileBody = {
  name?: string;
  bio?: string;
};

type UpdatePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

function sanitizeBioInput(value: string) {
  return value.replace(SCRIPT_TAG_PATTERN, "");
}

function buildAvatarAssetKey(mimetype: string, userId: string) {
  const extension = MIME_EXTENSION_MAP[mimetype] ?? "dat";
  return `${userId}/${randomUUID()}.${extension}`;
}

export async function handleGetCurrentUser(
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
      message: "This endpoint is for user role only.",
    });
  }

  const profile = await getUserProfile(authUser.id);
  if (!profile) {
    return reply.status(404).send({
      status: "error",
      error: "USER_NOT_FOUND",
    });
  }

  return reply.send({
    status: "success",
    user: profile,
  });
}

export async function handleUpdateUserProfile(
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
      message: "This endpoint is for user role only.",
    });
  }

  const body = (request.body ?? {}) as UpdateProfileBody;
  const updates: { name?: string; bio?: string | null } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_NAME",
        message: "Name must be a string.",
      });
    }
    const trimmed = body.name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_NAME",
        message: "Name must be 1-50 characters.",
      });
    }
    updates.name = trimmed;
  }

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_BIO",
        message: "Bio must be a string.",
      });
    }
    const sanitized = sanitizeBioInput(body.bio);
    if (sanitized.length > BIO_MAX) {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_BIO",
        message: "Bio must be 200 characters or less.",
      });
    }
    updates.bio = sanitized;
  }

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({
      status: "error",
      error: "NO_FIELDS",
      message: "Provide at least one field to update.",
    });
  }

  const updated = await updateUserProfile(authUser.id, updates);
  if (!updated) {
    return reply.status(404).send({
      status: "error",
      error: "USER_NOT_FOUND",
    });
  }

  return reply.send({
    status: "success",
    user: updated,
  });
}

export async function handleUpdateUserAvatar(
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
      message: "This endpoint is for user role only.",
    });
  }

  const file: MultipartFile | undefined = await request.file();
  if (!file) {
    return reply.status(400).send({
      status: "error",
      error: "NO_FILE",
      message: "Avatar file is required.",
    });
  }

  if (!ACCEPTED_AVATAR_MIMES.has(file.mimetype)) {
    await file.file?.resume();
    return reply.status(400).send({
      status: "error",
      error: "INVALID_FILE_TYPE",
      message: "Only image/jpeg, image/png, image/webp are allowed.",
    });
  }

  const buffer = await file.toBuffer();
  if (!buffer.length) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_FILE",
      message: "Uploaded file is empty.",
    });
  }

  if (buffer.length > MAX_AVATAR_BYTES) {
    return reply.status(400).send({
      status: "error",
      error: "FILE_TOO_LARGE",
      message: "Image must be under 5MB.",
    });
  }

  const assetKey = buildAvatarAssetKey(file.mimetype, authUser.id);
  const result = await updateUserAvatar(authUser.id, {
    mimetype: file.mimetype,
    buffer,
    assetKey,
  });

  if (!result) {
    return reply.status(500).send({
      status: "error",
      error: "UPLOAD_FAILED",
      message: "Failed to update avatar.",
    });
  }

  return reply.send({
    status: "success",
    avatar: result.avatar,
  });
}

export async function handleUpdateUserPassword(
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
      message: "This endpoint is for user role only.",
    });
  }

  const body = (request.body ?? {}) as UpdatePasswordBody;
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  if (typeof currentPassword !== "string" || !currentPassword.length) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_CURRENT_PASSWORD",
      message: "Current password is required.",
    });
  }

  if (typeof newPassword !== "string" || !newPassword.length) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PASSWORD_FORMAT",
      message: "New password is required.",
    });
  }

  if (
    newPassword.length < PASSWORD_MIN_LENGTH ||
    newPassword.length > PASSWORD_MAX_LENGTH
  ) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PASSWORD_FORMAT",
      message: "Password must be between 8 and 72 characters.",
    });
  }

  if (!ASCII_ONLY_REGEX.test(newPassword)) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PASSWORD_FORMAT",
      message: "Password must use ASCII characters only.",
    });
  }

  if (newPassword === currentPassword) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_PASSWORD_FORMAT",
      message: "New password must be different from current password.",
    });
  }

  const result = await changeUserPassword(
    authUser.id,
    currentPassword,
    newPassword
  );

  if (!result.success) {
    if (result.reason === "INVALID_CURRENT_PASSWORD") {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_CURRENT_PASSWORD",
        message: "Current password is incorrect.",
      });
    }

    if (result.reason === "USER_NOT_FOUND") {
      return reply.status(404).send({
        status: "error",
        error: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    return reply.status(500).send({
      status: "error",
      error: "DB_ERROR",
      message: "Failed to update password.",
    });
  }

  return reply.send({
    status: "success",
  });
}

export async function handleDeleteUserAccount(
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
      message: "This endpoint is for user role only.",
    });
  }

  const result = await deleteUserAccount(authUser.id);

  if (!result.success) {
    if (result.reason === "USER_NOT_FOUND") {
      return reply.status(404).send({
        status: "error",
        error: "USER_NOT_FOUND",
      });
    }

    return reply.status(500).send({
      status: "error",
      error: "DB_ERROR",
      message: "Failed to delete account.",
    });
  }

  return reply.send({
    status: "success",
  });
}
