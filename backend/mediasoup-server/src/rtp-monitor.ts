import * as mediasoup from "mediasoup";

export interface RtpMonitorOptions {
  heartbeatIntervalMs?: number;
  silenceThresholdMs?: number;
}

export interface ProducerRtpStatus {
  producerId: string;
  lastRtpReceivedAt: number;
  isActive: boolean;
  silenceDurationMs: number;
}

export interface ConsumerRtpStatus {
  consumerId: string;
  isPlaying: boolean;
  paused: boolean;
}

export class RtpMonitor {
  private producerLastRtp: Map<string, number> = new Map();
  private heartbeatIntervalMs: number;
  private silenceThresholdMs: number;
  private monitorInterval: NodeJS.Timer | null = null;
  private callbacks: {
    onProducerRtpStart?: (producerId: string) => void;
    onProducerRtpStop?: (producerId: string, silenceDurationMs: number) => void;
  } = {};

  constructor(options: RtpMonitorOptions = {}) {
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 5000;
    this.silenceThresholdMs = options.silenceThresholdMs ?? 8000;
  }

  setCallbacks(callbacks: RtpMonitor["callbacks"]): void {
    this.callbacks = callbacks;
  }

  startMonitoring(producers: Map<string, mediasoup.Producer>): void {
    if (this.monitorInterval) {
      console.warn("RTP monitoring already started");
      return;
    }

    console.log(
      `🔊 Starting RTP monitoring (heartbeat: ${this.heartbeatIntervalMs}ms, silence threshold: ${this.silenceThresholdMs}ms)`
    );

    this.monitorInterval = setInterval(async () => {
      for (const [producerId, producer] of producers) {
        try {
          const stats = await producer.getStats();
          const rtpStats = stats[0] as
            | {
                type?: string;
                timestamp?: number;
              }
            | undefined;

          if (!rtpStats) {
            continue;
          }

          const now = Date.now();
          const lastRtp =
            this.producerLastRtp.get(producerId) ??
            now - this.heartbeatIntervalMs;
          const silenceDuration = now - lastRtp;

          // RTPパケットが到達していると判定
          if (silenceDuration < this.silenceThresholdMs) {
            // 前回までsilenceだったが、今回はRTPが到達した
            if (!this.producerLastRtp.has(producerId)) {
              this.callbacks.onProducerRtpStart?.(producerId);
            }
            this.producerLastRtp.set(producerId, now);
          } else if (this.producerLastRtp.has(producerId)) {
            // silenceになった
            this.callbacks.onProducerRtpStop?.(producerId, silenceDuration);
            this.producerLastRtp.delete(producerId);
          }
        } catch (err) {
          console.error(`Error monitoring producer ${producerId}:`, err);
        }
      }
    }, this.heartbeatIntervalMs);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log("🛑 RTP monitoring stopped");
    }
  }

  getProducerStatus(
    producerId: string,
    allProducers: Map<string, mediasoup.Producer>
  ): ProducerRtpStatus | null {
    if (!allProducers.has(producerId)) {
      return null;
    }

    const now = Date.now();
    const lastRtp =
      this.producerLastRtp.get(producerId) ?? now - this.heartbeatIntervalMs;
    const silenceDuration = now - lastRtp;
    const isActive = silenceDuration < this.silenceThresholdMs;

    return {
      producerId,
      lastRtpReceivedAt: lastRtp,
      isActive,
      silenceDurationMs: silenceDuration,
    };
  }

  recordRtpReceived(producerId: string): void {
    this.producerLastRtp.set(producerId, Date.now());
  }

  isProducerActive(producerId: string): boolean {
    const now = Date.now();
    const lastRtp =
      this.producerLastRtp.get(producerId) ?? now - this.heartbeatIntervalMs;
    return now - lastRtp < this.silenceThresholdMs;
  }
}
