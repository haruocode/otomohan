import Fastify from "fastify";
import sensible from "fastify-sensible";
import authPlugin from "./plugins/auth.js";
import { userMeRoutes } from "./routes/user/me.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(sensible);
  app.register(authPlugin);
  app.register(userMeRoutes);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
