import Fastify from "fastify";
import sensible from "fastify-sensible";
import authPlugin from "./plugins/auth.js";
import { userMeRoutes } from "./routes/user/me.js";
import { userProfileRoutes } from "./routes/user/profile.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(sensible);
  app.register(authPlugin);
  app.register(userMeRoutes);
  app.register(userProfileRoutes);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
