import type { FastifyReply, FastifyRequest } from "fastify";
import { getSettingsForUser } from "../services/settingsService.js";

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
