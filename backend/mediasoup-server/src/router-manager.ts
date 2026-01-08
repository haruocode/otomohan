import * as mediasoup from "mediasoup";
import { WorkerPool } from "./worker-pool.js";

export interface RouterManagerOptions {
  workerPool: WorkerPool;
  mediaCodecs?: mediasoup.RtpCodecCapability[];
}

export interface TransportDescription {
  id: string;
  iceParameters: mediasoup.IceParameters;
  iceCandidates: mediasoup.IceCandidate[];
  dtlsParameters: mediasoup.DtlsParameters;
}

export interface ProducerDescription {
  id: string;
  kind: mediasoup.MediaKind;
  rtpParameters: mediasoup.RtpParameters;
}

export interface ConsumerDescription {
  id: string;
  producerId: string;
  kind: mediasoup.MediaKind;
  rtpParameters: mediasoup.RtpParameters;
}

export class RouterManager {
  private routers: Map<string, mediasoup.Router> = new Map();
  private workerPool: WorkerPool;
  private mediaCodecs: mediasoup.RtpCodecCapability[];

  constructor(options: RouterManagerOptions) {
    this.workerPool = options.workerPool;
    this.mediaCodecs = options.mediaCodecs ?? this.getDefaultMediaCodecs();
  }

  private getDefaultMediaCodecs(): mediasoup.RtpCodecCapability[] {
    return [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        parameters: {
          useinbandfec: 1,
          stereo: 1,
        },
      },
    ];
  }

  async createRouter(routerId: string): Promise<string> {
    if (this.routers.has(routerId)) {
      console.warn(`Router ${routerId} already exists`);
      return routerId;
    }

    try {
      const worker = this.workerPool.getWorker();
      const router = await worker.createRouter({
        mediaCodecs: this.mediaCodecs,
      });

      router.on("close", () => {
        console.log(`Router ${routerId} closed`);
        this.routers.delete(routerId);
      });

      this.routers.set(routerId, router);
      console.log(`✅ Router ${routerId} created`);
      return routerId;
    } catch (err) {
      console.error(`❌ Failed to create router ${routerId}:`, err);
      throw err;
    }
  }

  getRouter(routerId: string): mediasoup.Router {
    const router = this.routers.get(routerId);
    if (!router) {
      throw new Error(`Router ${routerId} not found`);
    }
    return router;
  }

  async closeRouter(routerId: string): Promise<void> {
    const router = this.routers.get(routerId);
    if (!router) {
      console.warn(`Router ${routerId} not found`);
      return;
    }

    try {
      await router.close();
      this.routers.delete(routerId);
      console.log(`✅ Router ${routerId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close router ${routerId}:`, err);
      throw err;
    }
  }

  async createTransport(
    routerId: string,
    transportId: string
  ): Promise<TransportDescription> {
    const router = this.getRouter(routerId);

    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: "127.0.0.1", announcedIp: undefined }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      transport.on("close", () => {
        console.log(`Transport ${transportId} closed`);
      });

      console.log(`✅ Transport ${transportId} created in router ${routerId}`);

      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    } catch (err) {
      console.error(`❌ Failed to create transport ${transportId}:`, err);
      throw err;
    }
  }

  async connectTransport(
    routerId: string,
    transportId: string,
    dtlsParameters: mediasoup.DtlsParameters
  ): Promise<void> {
    const router = this.getRouter(routerId);

    try {
      const transports = router.transports;
      const transport = Array.from(transports).find(
        (t) => t.id === transportId
      );

      if (!transport || !(transport instanceof mediasoup.WebRtcTransport)) {
        throw new Error(`WebRTC transport ${transportId} not found`);
      }

      await transport.connect({ dtlsParameters });
      console.log(`✅ Transport ${transportId} connected`);
    } catch (err) {
      console.error(`❌ Failed to connect transport ${transportId}:`, err);
      throw err;
    }
  }

  async createProducer(
    routerId: string,
    transportId: string,
    rtpParameters: mediasoup.RtpParameters
  ): Promise<ProducerDescription> {
    const router = this.getRouter(routerId);

    try {
      const transports = router.transports;
      const transport = Array.from(transports).find(
        (t) => t.id === transportId
      );

      if (!transport || !(transport instanceof mediasoup.WebRtcTransport)) {
        throw new Error(`WebRTC transport ${transportId} not found`);
      }

      const producer = await transport.produce({
        kind: rtpParameters.mid ? "audio" : "audio",
        rtpParameters,
      });

      producer.on("close", () => {
        console.log(`Producer ${producer.id} closed`);
      });

      console.log(`✅ Producer ${producer.id} created`);

      return {
        id: producer.id,
        kind: producer.kind,
        rtpParameters: producer.rtpParameters,
      };
    } catch (err) {
      console.error(`❌ Failed to create producer:`, err);
      throw err;
    }
  }

  async createConsumer(
    routerId: string,
    transportId: string,
    producerId: string
  ): Promise<ConsumerDescription> {
    const router = this.getRouter(routerId);

    try {
      const transports = router.transports;
      const transport = Array.from(transports).find(
        (t) => t.id === transportId
      );

      if (!transport || !(transport instanceof mediasoup.WebRtcTransport)) {
        throw new Error(`WebRTC transport ${transportId} not found`);
      }

      const producers = router.producers;
      const producer = Array.from(producers).find((p) => p.id === producerId);

      if (!producer) {
        throw new Error(`Producer ${producerId} not found`);
      }

      const consumer = await transport.consume({
        producerId,
        rtpCapabilities: router.rtpCapabilities,
        paused: true,
      });

      consumer.on("close", () => {
        console.log(`Consumer ${consumer.id} closed`);
      });

      console.log(
        `✅ Consumer ${consumer.id} created from producer ${producerId}`
      );

      return {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      };
    } catch (err) {
      console.error(`❌ Failed to create consumer:`, err);
      throw err;
    }
  }

  async resumeConsumer(routerId: string, consumerId: string): Promise<void> {
    const router = this.getRouter(routerId);

    try {
      const consumers = router.consumers;
      const consumer = Array.from(consumers).find((c) => c.id === consumerId);

      if (!consumer) {
        throw new Error(`Consumer ${consumerId} not found`);
      }

      await consumer.resume();
      console.log(`✅ Consumer ${consumerId} resumed`);
    } catch (err) {
      console.error(`❌ Failed to resume consumer ${consumerId}:`, err);
      throw err;
    }
  }

  async closeProducer(routerId: string, producerId: string): Promise<void> {
    const router = this.getRouter(routerId);

    try {
      const producers = router.producers;
      const producer = Array.from(producers).find((p) => p.id === producerId);

      if (!producer) {
        console.warn(`Producer ${producerId} not found`);
        return;
      }

      await producer.close();
      console.log(`✅ Producer ${producerId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close producer ${producerId}:`, err);
      throw err;
    }
  }

  async closeConsumer(routerId: string, consumerId: string): Promise<void> {
    const router = this.getRouter(routerId);

    try {
      const consumers = router.consumers;
      const consumer = Array.from(consumers).find((c) => c.id === consumerId);

      if (!consumer) {
        console.warn(`Consumer ${consumerId} not found`);
        return;
      }

      await consumer.close();
      console.log(`✅ Consumer ${consumerId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close consumer ${consumerId}:`, err);
      throw err;
    }
  }

  async closeTransport(routerId: string, transportId: string): Promise<void> {
    const router = this.getRouter(routerId);

    try {
      const transports = router.transports;
      const transport = Array.from(transports).find(
        (t) => t.id === transportId
      );

      if (!transport) {
        console.warn(`Transport ${transportId} not found`);
        return;
      }

      await transport.close();
      console.log(`✅ Transport ${transportId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close transport ${transportId}:`, err);
      throw err;
    }
  }

  getRouterStats(routerId: string) {
    const router = this.getRouter(routerId);
    const producers = Array.from(router.producers);
    const consumers = Array.from(router.consumers);
    const transports = Array.from(router.transports);

    return {
      routerId,
      producersCount: producers.length,
      consumersCount: consumers.length,
      transportsCount: transports.length,
    };
  }
}
