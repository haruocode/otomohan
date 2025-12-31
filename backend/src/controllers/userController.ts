import type { FastifyReply, FastifyRequest } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
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

type UpdateProfileBody = {
  name?: string;
  bio?: string;
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
