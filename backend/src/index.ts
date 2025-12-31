import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? "5051");

async function start() {
  const app = buildApp();
  try {
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Server listening on port ${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
