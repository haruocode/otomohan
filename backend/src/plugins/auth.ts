import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

interface AuthOptions {
  simulateRole?: "user" | "otomo";
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
    request.user = simulatedUser;
  });
});
