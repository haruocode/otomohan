import { WorkerPool } from "./worker-pool.js";
import { RouterManager } from "./router-manager.js";
import { RtpMonitor } from "./rtp-monitor.js";
import { RpcServer } from "./rpc-server.js";

async function main() {
  console.log("🎬 Starting mediasoup SFU Server...");

  const workerPool = new WorkerPool({
    numWorkers: 1,
    logLevel: "warn",
  });

  const routerManager = new RouterManager({
    workerPool,
  });

  const rtpMonitor = new RtpMonitor({
    heartbeatIntervalMs: 5000,
    silenceThresholdMs: 8000,
  });

  const rpcServer = new RpcServer({
    port: 8888,
    routerManager,
    rtpMonitor,
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Received SIGINT, shutting down...");
    await rpcServer.shutdown();
    await workerPool.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Received SIGTERM, shutting down...");
    await rpcServer.shutdown();
    await workerPool.shutdown();
    process.exit(0);
  });

  try {
    await workerPool.initialize();
    console.log("✅ mediasoup SFU Server is running");
  } catch (err) {
    console.error("❌ Failed to start mediasoup SFU Server:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
