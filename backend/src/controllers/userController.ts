import type { FastifyReply, FastifyRequest } from "fastify";
import { getUserProfile } from "../services/userService.js";

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
