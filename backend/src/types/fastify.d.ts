import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      port: number;
    };
  }

  interface FastifyRequest {
    user?: {
      id: string;
      role: "user" | "otomo";
    };
  }
}
