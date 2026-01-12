import * as mediasoup from "mediasoup";
import type { types } from "mediasoup";

export interface WorkerPoolOptions {
  numWorkers?: number;
  logLevel?: "debug" | "warn" | "error";
}

export class WorkerPool {
  private workers: types.Worker[] = [];
  private currentWorkerIndex = 0;
  private readonly numWorkers: number;
  private readonly logLevel: "debug" | "warn" | "error";

  constructor(options: WorkerPoolOptions = {}) {
    this.numWorkers = options.numWorkers ?? 1;
    this.logLevel = options.logLevel ?? "warn";
  }

  async initialize(): Promise<void> {
    console.log(
      `🚀 Initializing mediasoup WorkerPool with ${this.numWorkers} worker(s)...`
    );

    for (let i = 0; i < this.numWorkers; i++) {
      try {
        const worker = await mediasoup.createWorker({
          logLevel: this.logLevel,
          logTags: [
            "info",
            "ice",
            "dtls",
            "rtp",
            "srtp",
            "rtcp",
            "rtx",
            "bwe",
            "score",
            "simulcast",
            "svc",
            "sctp",
          ],
          rtcMinPort: 40000 + i * 1000,
          rtcMaxPort: 40999 + i * 1000,
        });

        worker.on("died", () => {
          console.error(`❌ mediasoup worker ${i} died unexpectedly`);
          process.exit(1);
        });

        this.workers.push(worker);
        console.log(`✅ Worker ${i + 1}/${this.numWorkers} initialized`);
      } catch (err) {
        console.error(`❌ Failed to create worker ${i}:`, err);
        throw err;
      }
    }

    console.log(
      `✅ WorkerPool initialized with ${this.workers.length} worker(s)`
    );
  }

  getWorker(): types.Worker {
    if (this.workers.length === 0) {
      throw new Error("No workers available in the pool");
    }

    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex =
      (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down WorkerPool...");

    for (const worker of this.workers) {
      try {
        await worker.close();
      } catch (err) {
        console.error("Error closing worker:", err);
      }
    }

    this.workers = [];
    console.log("✅ WorkerPool shutdown complete");
  }
}
