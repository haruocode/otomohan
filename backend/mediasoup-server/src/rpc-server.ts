import WebSocket from "ws";
import * as mediasoup from "mediasoup";
import { RouterManager, TransportDescription } from "./router-manager.js";
import { RtpMonitor } from "./rtp-monitor.js";
import { v4 as uuidv4 } from "crypto";

export interface RpcRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface RpcResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export interface RpcServerOptions {
  port: number;
  routerManager: RouterManager;
  rtpMonitor: RtpMonitor;
}

export class RpcServer {
  private wss: WebSocket.Server;
  private routerManager: RouterManager;
  private rtpMonitor: RtpMonitor;
  private readonly port: number;
  private callContexts: Map<
    string,
    { userId: string; otomoId: string; transports: Set<string> }
  > = new Map();

  constructor(options: RpcServerOptions) {
    this.port = options.port;
    this.routerManager = options.routerManager;
    this.rtpMonitor = options.rtpMonitor;

    this.wss = new WebSocket.Server({ port: this.port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log(`✅ Client connected (${this.wss.clients.size} clients)`);

      ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(ws, data);
      });

      ws.on("close", () => {
        console.log(
          `❌ Client disconnected (${this.wss.clients.size} clients)`
        );
      });

      ws.on("error", (err) => {
        console.error("WebSocket error:", err);
      });
    });

    console.log(`🚀 RPC Server listening on ws://localhost:${this.port}`);
  }

  private async handleMessage(
    ws: WebSocket,
    data: WebSocket.Data
  ): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as RpcRequest;
      const response = await this.handleRpcCall(message);
      ws.send(JSON.stringify(response));
    } catch (err) {
      console.error("Error handling message:", err);
      const errorResponse: RpcResponse = {
        id: "unknown",
        error: {
          code: -32603,
          message: `Internal error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        },
      };
      ws.send(JSON.stringify(errorResponse));
    }
  }

  private async handleRpcCall(request: RpcRequest): Promise<RpcResponse> {
    const { id, method, params } = request;

    try {
      let result: unknown;

      switch (method) {
        case "createRouter":
          result = await this.createRouter(params);
          break;
        case "createTransport":
          result = await this.createTransport(params);
          break;
        case "connectTransport":
          result = await this.connectTransport(params);
          break;
        case "createProducer":
          result = await this.createProducer(params);
          break;
        case "createConsumer":
          result = await this.createConsumer(params);
          break;
        case "resumeConsumer":
          result = await this.resumeConsumer(params);
          break;
        case "closeProducer":
          result = await this.closeProducer(params);
          break;
        case "closeConsumer":
          result = await this.closeConsumer(params);
          break;
        case "closeTransport":
          result = await this.closeTransport(params);
          break;
        case "closeRouter":
          result = await this.closeRouter(params);
          break;
        case "getRouterStats":
          result = this.getRouterStats(params);
          break;
        default:
          return {
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }

      return { id, result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`RPC Error in ${method}:`, err);
      return {
        id,
        error: {
          code: -32603,
          message: errorMessage,
        },
      };
    }
  }

  private async createRouter(
    params: Record<string, unknown> | undefined
  ): Promise<{ routerId: string }> {
    const routerId = (params?.routerId as string) || uuidv4();
    await this.routerManager.createRouter(routerId);
    return { routerId };
  }

  private async createTransport(
    params: Record<string, unknown> | undefined
  ): Promise<TransportDescription> {
    const routerId = params?.routerId as string;
    const transportId = params?.transportId as string;
    const userId = params?.userId as string;
    const otomoId = params?.otomoId as string;

    if (!routerId || !transportId || !userId || !otomoId) {
      throw new Error("routerId, transportId, userId, otomoId are required");
    }

    // Call contextの初期化
    const callId = uuidv4();
    this.callContexts.set(callId, {
      userId,
      otomoId,
      transports: new Set([transportId]),
    });

    return this.routerManager.createTransport(routerId, transportId);
  }

  private async connectTransport(
    params: Record<string, unknown> | undefined
  ): Promise<{ success: boolean }> {
    const routerId = params?.routerId as string;
    const transportId = params?.transportId as string;
    const dtlsParameters = params?.dtlsParameters as mediasoup.DtlsParameters;

    if (!routerId || !transportId || !dtlsParameters) {
      throw new Error("routerId, transportId, dtlsParameters are required");
    }

    await this.routerManager.connectTransport(
      routerId,
      transportId,
      dtlsParameters
    );
    return { success: true };
  }

  private async createProducer(
    params: Record<string, unknown> | undefined
  ): Promise<{ producerId: string }> {
    const routerId = params?.routerId as string;
    const transportId = params?.transportId as string;
    const rtpParameters = params?.rtpParameters as mediasoup.RtpParameters;

    if (!routerId || !transportId || !rtpParameters) {
      throw new Error("routerId, transportId, rtpParameters are required");
    }

    const result = await this.routerManager.createProducer(
      routerId,
      transportId,
      rtpParameters
    );
    return { producerId: result.id };
  }

  private async createConsumer(
    params: Record<string, unknown> | undefined
  ): Promise<{ consumerId: string }> {
    const routerId = params?.routerId as string;
    const transportId = params?.transportId as string;
    const producerId = params?.producerId as string;

    if (!routerId || !transportId || !producerId) {
      throw new Error("routerId, transportId, producerId are required");
    }

    const result = await this.routerManager.createConsumer(
      routerId,
      transportId,
      producerId
    );
    return { consumerId: result.id };
  }

  private async resumeConsumer(
    params: Record<string, unknown> | undefined
  ): Promise<{ success: boolean }> {
    const routerId = params?.routerId as string;
    const consumerId = params?.consumerId as string;

    if (!routerId || !consumerId) {
      throw new Error("routerId, consumerId are required");
    }

    await this.routerManager.resumeConsumer(routerId, consumerId);
    return { success: true };
  }

  private async closeProducer(
    params: Record<string, unknown> | undefined
  ): Promise<{ success: boolean }> {
    const routerId = params?.routerId as string;
    const producerId = params?.producerId as string;

    if (!routerId || !producerId) {
      throw new Error("routerId, producerId are required");
    }

    await this.routerManager.closeProducer(routerId, producerId);
    return { success: true };
  }

  private async closeConsumer(
    params: Record<string, unknown> | undefined
  ): Promise<{ success: boolean }> {
    const routerId = params?.routerId as string;
    const consumerId = params?.consumerId as string;

    if (!routerId || !consumerId) {
      throw new Error("routerId, consumerId are required");
    }

    await this.routerManager.closeConsumer(routerId, consumerId);
    return { success: true };
  }

  private async closeTransport(
    params: Record<string, unknown> | undefined
  ): Promise<{ success: boolean }> {
    const routerId = params?.routerId as string;
    const transportId = params?.transportId as string;

    if (!routerId || !transportId) {
      throw new Error("routerId, transportId are required");
    }

    await this.routerManager.closeTransport(routerId, transportId);
    return { success: true };
  }

  private async closeRouter(
    params: Record<string, unknown> | undefined
  ): Promise<{ success: boolean }> {
    const routerId = params?.routerId as string;

    if (!routerId) {
      throw new Error("routerId is required");
    }

    await this.routerManager.closeRouter(routerId);
    return { success: true };
  }

  private getRouterStats(
    params: Record<string, unknown> | undefined
  ): Record<string, unknown> {
    const routerId = params?.routerId as string;

    if (!routerId) {
      throw new Error("routerId is required");
    }

    return this.routerManager.getRouterStats(routerId);
  }

  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down RPC Server...");
    this.rtpMonitor.stopMonitoring();

    for (const client of this.wss.clients) {
      client.close();
    }

    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log("✅ RPC Server shutdown complete");
        resolve();
      });
    });
  }
}
