import type { FastifyReply, FastifyRequest } from "fastify";
import { getUserProfile, updateUserProfile } from "../services/userService.js";

const NAME_MIN = 1;
const NAME_MAX = 50;
const BIO_MAX = 200;
const SCRIPT_TAG_PATTERN = /<script.*?>.*?<\/script>/gis;

type UpdateProfileBody = {
  name?: string;
  bio?: string;
};

function sanitizeBioInput(value: string) {
  return value.replace(SCRIPT_TAG_PATTERN, "");
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
