import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getSettingsForUser,
  updateNotificationSettings,
} from "../services/settingsService.js";

type NotificationUpdatePayload = Partial<{
  incomingCall: boolean;
  callSummary: boolean;
  walletAlert: boolean;
  marketing: boolean;
}>;

const NOTIFICATION_KEYS = [
  "incomingCall",
  "callSummary",
  "walletAlert",
  "marketing",
] as const;

export async function handleGetSettings(
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
    const settings = await getSettingsForUser(authUser.id);
    return reply.send({
      status: "success",
      settings,
    });
  } catch (error) {
    request.log.error(error, "Failed to load settings");
    return reply.status(500).send({
      status: "error",
      error: "DB_ERROR",
      message: "Failed to load settings.",
    });
  }
}

export async function handleUpdateNotificationSettings(
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

  const body = request.body as NotificationUpdatePayload | undefined;
  if (!body || typeof body !== "object") {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_VALUE",
      message: "Request body must be a JSON object.",
    });
  }

  const updates: NotificationUpdatePayload = {};

  for (const [key, value] of Object.entries(body)) {
    if (
      !NOTIFICATION_KEYS.includes(key as (typeof NOTIFICATION_KEYS)[number])
    ) {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_VALUE",
        message: `Unknown field: ${key}`,
      });
    }

    if (typeof value !== "boolean") {
      return reply.status(400).send({
        status: "error",
        error: "INVALID_VALUE",
        message: `${key} must be a boolean value.`,
      });
    }

    updates[key as keyof NotificationUpdatePayload] = value;
  }

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({
      status: "error",
      error: "INVALID_VALUE",
      message: "Provide at least one notification field to update.",
    });
  }

  try {
    const settings = await updateNotificationSettings(authUser.id, updates);
    return reply.send({
      status: "success",
      settings,
    });
  } catch (error) {
    request.log.error(error, "Failed to update notification settings");
    return reply.status(500).send({
      status: "error",
      error: "DB_ERROR",
      message: "Failed to update notification settings.",
    });
  }
}
