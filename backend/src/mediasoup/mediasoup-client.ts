import WebSocket from "ws";
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

export interface TransportDescription {
  id: string;
  iceParameters: Record<string, unknown>;
  iceCandidates: Array<Record<string, unknown>>;
  dtlsParameters: Record<string, unknown>;
}

export class MediasoupClient {
  private ws: WebSocket | null = null;
  private pending: Map<string, { resolve: Function; reject: Function }> =
    new Map();
  private readonly serverUrl: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(serverUrl: string = "ws://127.0.0.1:8888") {
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.on("open", () => {
          console.log(`✅ Connected to mediasoup server at ${this.serverUrl}`);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          this.handleMessage(data);
        });

        this.ws.on("close", () => {
          console.log("❌ Disconnected from mediasoup server");
          this.ws = null;
          this.attemptReconnect();
        });

        this.ws.on("error", (err) => {
          console.error("WebSocket error:", err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached, giving up");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(
      `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`
    );

    setTimeout(() => {
      this.connect().catch((err) => {
        console.error("Reconnection failed:", err);
      });
    }, delay);
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const response = JSON.parse(data.toString()) as RpcResponse;
      const pending = this.pending.get(response.id);

      if (!pending) {
        console.warn(`Received response for unknown request ${response.id}`);
        return;
      }

      this.pending.delete(response.id);

      if (response.error) {
        pending.reject(
          new Error(
            `RPC Error: ${response.error.message} (code: ${response.error.code})`
          )
        );
      } else {
        pending.resolve(response.result);
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }

  private async sendRpc(request: RpcRequest): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(request.id);
        reject(new Error(`RPC timeout for method ${request.method}`));
      }, 30000);

      this.pending.set(request.id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      this.ws!.send(JSON.stringify(request));
    });
  }

  async createRouter(routerId?: string): Promise<string> {
    const result = (await this.sendRpc({
      id: uuidv4(),
      method: "createRouter",
      params: { routerId: routerId || uuidv4() },
    })) as { routerId: string };
    return result.routerId;
  }

  async createTransport(
    routerId: string,
    transportId: string,
    userId: string,
    otomoId: string
  ): Promise<TransportDescription> {
    const result = (await this.sendRpc({
      id: uuidv4(),
      method: "createTransport",
      params: { routerId, transportId, userId, otomoId },
    })) as TransportDescription;
    return result;
  }

  async connectTransport(
    routerId: string,
    transportId: string,
    dtlsParameters: Record<string, unknown>
  ): Promise<void> {
    await this.sendRpc({
      id: uuidv4(),
      method: "connectTransport",
      params: { routerId, transportId, dtlsParameters },
    });
  }

  async createProducer(
    routerId: string,
    transportId: string,
    rtpParameters: Record<string, unknown>
  ): Promise<string> {
    const result = (await this.sendRpc({
      id: uuidv4(),
      method: "createProducer",
      params: { routerId, transportId, rtpParameters },
    })) as { producerId: string };
    return result.producerId;
  }

  async createConsumer(
    routerId: string,
    transportId: string,
    producerId: string
  ): Promise<{ consumerId: string; rtpParameters: Record<string, unknown> }> {
    const result = (await this.sendRpc({
      id: uuidv4(),
      method: "createConsumer",
      params: { routerId, transportId, producerId },
    })) as { consumerId: string; rtpParameters: Record<string, unknown> };
    return result;
  }

  async resumeConsumer(routerId: string, consumerId: string): Promise<void> {
    await this.sendRpc({
      id: uuidv4(),
      method: "resumeConsumer",
      params: { routerId, consumerId },
    });
  }

  async closeProducer(routerId: string, producerId: string): Promise<void> {
    await this.sendRpc({
      id: uuidv4(),
      method: "closeProducer",
      params: { routerId, producerId },
    });
  }

  async closeConsumer(routerId: string, consumerId: string): Promise<void> {
    await this.sendRpc({
      id: uuidv4(),
      method: "closeConsumer",
      params: { routerId, consumerId },
    });
  }

  async closeTransport(routerId: string, transportId: string): Promise<void> {
    await this.sendRpc({
      id: uuidv4(),
      method: "closeTransport",
      params: { routerId, transportId },
    });
  }

  async closeRouter(routerId: string): Promise<void> {
    await this.sendRpc({
      id: uuidv4(),
      method: "closeRouter",
      params: { routerId },
    });
  }

  async getRouterStats(routerId: string): Promise<Record<string, unknown>> {
    const result = (await this.sendRpc({
      id: uuidv4(),
      method: "getRouterStats",
      params: { routerId },
    })) as Record<string, unknown>;
    return result;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let mediasoupClient: MediasoupClient | null = null;

export function getMediasoupClient(): MediasoupClient {
  if (!mediasoupClient) {
    mediasoupClient = new MediasoupClient();
  }
  return mediasoupClient;
}

export async function initializeMediasoupClient(
  serverUrl?: string
): Promise<MediasoupClient> {
  const client = new MediasoupClient(serverUrl);
  await client.connect();
  mediasoupClient = client;
  return client;
}
