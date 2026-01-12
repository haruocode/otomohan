import type { types } from "mediasoup";
import { WorkerPool } from "./worker-pool.js";

export interface RouterManagerOptions {
  workerPool: WorkerPool;
  mediaCodecs?: types.RouterRtpCodecCapability[];
}

export interface TransportDescription {
  id: string;
  iceParameters: types.IceParameters;
  iceCandidates: types.IceCandidate[];
  dtlsParameters: types.DtlsParameters;
}

export interface ProducerDescription {
  id: string;
  kind: types.MediaKind;
  rtpParameters: types.RtpParameters;
}

export interface ConsumerDescription {
  id: string;
  producerId: string;
  kind: types.MediaKind;
  rtpParameters: types.RtpParameters;
}

interface RouterResources {
  router: types.Router;
  transports: Map<string, types.WebRtcTransport>;
  producers: Map<string, types.Producer>;
  consumers: Map<string, types.Consumer>;
}

export class RouterManager {
  private routerResources: Map<string, RouterResources> = new Map();
  private workerPool: WorkerPool;
  private mediaCodecs: types.RouterRtpCodecCapability[];

  constructor(options: RouterManagerOptions) {
    this.workerPool = options.workerPool;
    this.mediaCodecs = options.mediaCodecs ?? this.getDefaultMediaCodecs();
  }

  private getDefaultMediaCodecs(): types.RouterRtpCodecCapability[] {
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
    if (this.routerResources.has(routerId)) {
      console.warn(`Router ${routerId} already exists`);
      return routerId;
    }

    try {
      const worker = this.workerPool.getWorker();
      const router = await worker.createRouter({
        mediaCodecs: this.mediaCodecs,
      });

      router.on("workerclose", () => {
        console.log(`Router ${routerId} closed due to worker close`);
        this.routerResources.delete(routerId);
      });

      this.routerResources.set(routerId, {
        router,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      });

      console.log(`✅ Router ${routerId} created`);
      return routerId;
    } catch (err) {
      console.error(`❌ Failed to create router ${routerId}:`, err);
      throw err;
    }
  }

  private getResources(routerId: string): RouterResources {
    const resources = this.routerResources.get(routerId);
    if (!resources) {
      throw new Error(`Router ${routerId} not found`);
    }
    return resources;
  }

  getRouter(routerId: string): types.Router {
    return this.getResources(routerId).router;
  }

  async closeRouter(routerId: string): Promise<void> {
    const resources = this.routerResources.get(routerId);
    if (!resources) {
      console.warn(`Router ${routerId} not found`);
      return;
    }

    try {
      resources.router.close();
      this.routerResources.delete(routerId);
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
    const resources = this.getResources(routerId);

    try {
      const transport = await resources.router.createWebRtcTransport({
        listenIps: [{ ip: "127.0.0.1", announcedIp: undefined }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      transport.on("routerclose", () => {
        console.log(`Transport ${transport.id} closed due to router close`);
        resources.transports.delete(transport.id);
      });

      resources.transports.set(transport.id, transport);
      console.log(`✅ Transport ${transport.id} created in router ${routerId}`);

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
    dtlsParameters: types.DtlsParameters
  ): Promise<void> {
    const resources = this.getResources(routerId);
    const transport = resources.transports.get(transportId);

    if (!transport) {
      throw new Error(`WebRTC transport ${transportId} not found`);
    }

    try {
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
    rtpParameters: types.RtpParameters
  ): Promise<ProducerDescription> {
    const resources = this.getResources(routerId);
    const transport = resources.transports.get(transportId);

    if (!transport) {
      throw new Error(`WebRTC transport ${transportId} not found`);
    }

    try {
      const producer = await transport.produce({
        kind: "audio",
        rtpParameters,
      });

      producer.on("transportclose", () => {
        console.log(`Producer ${producer.id} closed due to transport close`);
        resources.producers.delete(producer.id);
      });

      resources.producers.set(producer.id, producer);
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
    const resources = this.getResources(routerId);
    const transport = resources.transports.get(transportId);

    if (!transport) {
      throw new Error(`WebRTC transport ${transportId} not found`);
    }

    const producer = resources.producers.get(producerId);
    if (!producer) {
      throw new Error(`Producer ${producerId} not found`);
    }

    try {
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities: resources.router.rtpCapabilities,
        paused: true,
      });

      consumer.on("transportclose", () => {
        console.log(`Consumer ${consumer.id} closed due to transport close`);
        resources.consumers.delete(consumer.id);
      });

      consumer.on("producerclose", () => {
        console.log(`Consumer ${consumer.id} closed due to producer close`);
        resources.consumers.delete(consumer.id);
      });

      resources.consumers.set(consumer.id, consumer);
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
    const resources = this.getResources(routerId);
    const consumer = resources.consumers.get(consumerId);

    if (!consumer) {
      throw new Error(`Consumer ${consumerId} not found`);
    }

    try {
      await consumer.resume();
      console.log(`✅ Consumer ${consumerId} resumed`);
    } catch (err) {
      console.error(`❌ Failed to resume consumer ${consumerId}:`, err);
      throw err;
    }
  }

  async closeProducer(routerId: string, producerId: string): Promise<void> {
    const resources = this.getResources(routerId);
    const producer = resources.producers.get(producerId);

    if (!producer) {
      console.warn(`Producer ${producerId} not found`);
      return;
    }

    try {
      producer.close();
      resources.producers.delete(producerId);
      console.log(`✅ Producer ${producerId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close producer ${producerId}:`, err);
      throw err;
    }
  }

  async closeConsumer(routerId: string, consumerId: string): Promise<void> {
    const resources = this.getResources(routerId);
    const consumer = resources.consumers.get(consumerId);

    if (!consumer) {
      console.warn(`Consumer ${consumerId} not found`);
      return;
    }

    try {
      consumer.close();
      resources.consumers.delete(consumerId);
      console.log(`✅ Consumer ${consumerId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close consumer ${consumerId}:`, err);
      throw err;
    }
  }

  async closeTransport(routerId: string, transportId: string): Promise<void> {
    const resources = this.getResources(routerId);
    const transport = resources.transports.get(transportId);

    if (!transport) {
      console.warn(`Transport ${transportId} not found`);
      return;
    }

    try {
      transport.close();
      resources.transports.delete(transportId);
      console.log(`✅ Transport ${transportId} closed`);
    } catch (err) {
      console.error(`❌ Failed to close transport ${transportId}:`, err);
      throw err;
    }
  }

  getRouterStats(routerId: string) {
    const resources = this.getResources(routerId);

    return {
      routerId,
      producersCount: resources.producers.size,
      consumersCount: resources.consumers.size,
      transportsCount: resources.transports.size,
    };
  }
}
