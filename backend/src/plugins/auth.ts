import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

interface AuthOptions {
  simulateRole?: "user" | "otomo" | "admin";
}

export default fp(async function authPlugin(
  app: FastifyInstance,
  opts: AuthOptions
) {
  const simulatedUser = {
    id: "user-123",
    role: opts.simulateRole ?? "user",
  } as const;

  app.decorateRequest("user", null);

  app.addHook("preHandler", async (request) => {
    const headerUserId = request.headers["x-mock-user-id"];
    const headerRole = request.headers["x-mock-role"];

    const normalizedUserId =
      typeof headerUserId === "string" && headerUserId.trim().length > 0
        ? headerUserId.trim()
        : simulatedUser.id;

    const normalizedRole = normalizeRole(headerRole) ?? simulatedUser.role;

    request.user = {
      id: normalizedUserId,
      role: normalizedRole,
    };
  });
});

function normalizeRole(value: unknown): "user" | "otomo" | "admin" | null {
  if (typeof value !== "string") {
    return null;
  }
  const lower = value.trim().toLowerCase();
  if (lower === "user" || lower === "otomo" || lower === "admin") {
    return lower;
  }
  return null;
}
