import Fastify from "fastify";
import sensible from "fastify-sensible";
import multipart from "@fastify/multipart";
import authPlugin from "./plugins/auth.js";
import { userMeRoutes } from "./routes/user/me.js";
import { userProfileRoutes } from "./routes/user/profile.js";
import { userPasswordRoutes } from "./routes/user/password.js";
import { userAvatarRoutes } from "./routes/user/avatar.js";
import { userDeleteRoutes } from "./routes/user/delete.js";
import { otomoListRoutes } from "./routes/otomo/list.js";
import { otomoDetailRoutes } from "./routes/otomo/detail.js";
import { otomoReviewsRoutes } from "./routes/otomo/reviews.js";
import { otomoStatusRoutes } from "./routes/otomo/status.js";
import { settingsRoutes } from "./routes/settings.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(sensible);
  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
  app.register(authPlugin);
  app.register(userMeRoutes);
  app.register(userProfileRoutes);
  app.register(userAvatarRoutes);
  app.register(userPasswordRoutes);
  app.register(userDeleteRoutes);
  app.register(otomoListRoutes);
  app.register(otomoDetailRoutes);
  app.register(otomoReviewsRoutes);
  app.register(otomoStatusRoutes);
  app.register(settingsRoutes);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
