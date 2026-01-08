# mediasoup SFU Server for Otomohan

This is a standalone mediasoup-based Selective Forwarding Unit (SFU) server for the Otomohan project. It manages WebRTC connections, transports, producers, and consumers.

## Architecture

```
┌─────────────────────┐
│  Fastify Backend    │
│  (RTC API routes)   │
└──────────┬──────────┘
           │ WebSocket RPC
           ↓
┌─────────────────────┐
│  mediasoup Server   │
│  (This service)     │
└──────────┬──────────┘
           │
        ┌──┴──┐
        ↓     ↓
    Worker  Router (multiple)

        │
    ┌───┼───┐
    ↓   ↓   ↓
   Transport, Producer, Consumer
```

## Features

- **Single Worker, Multiple Routers**: Manages multiple call sessions with separate routers
- **RTP Monitoring**: Detects RTP activity and silence for billing/monitoring
- **WebSocket RPC**: Communicates with Fastify backend via JSON-RPC over WebSocket
- **Resource Management**: Proper cleanup of transports, producers, and consumers

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for containerized deployment)

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm run dev
```

The server will listen on `ws://localhost:8888`

### Docker Deployment

```bash
# From the backend directory
docker-compose up mediasoup

# Or build separately
cd mediasoup-server
docker build -t otomohan-mediasoup .
docker run -p 8888:8888 -p 40000-41000:40000-41000/udp otomohan-mediasoup
```

## RPC Methods

### Router Management

- `createRouter(routerId?)` → `{ routerId: string }`
- `closeRouter(routerId)` → `{ success: boolean }`
- `getRouterStats(routerId)` → `{ producersCount, consumersCount, transportsCount }`

### Transport

- `createTransport(routerId, transportId, userId, otomoId)` → `TransportDescription`
- `connectTransport(routerId, transportId, dtlsParameters)` → `{ success: boolean }`
- `closeTransport(routerId, transportId)` → `{ success: boolean }`

### Producer (Send Audio)

- `createProducer(routerId, transportId, rtpParameters)` → `{ producerId: string }`
- `closeProducer(routerId, producerId)` → `{ success: boolean }`

### Consumer (Receive Audio)

- `createConsumer(routerId, transportId, producerId)` → `{ consumerId: string; rtpParameters }`
- `resumeConsumer(routerId, consumerId)` → `{ success: boolean }`
- `closeConsumer(routerId, consumerId)` → `{ success: boolean }`

## Configuration

Environment variables (optional):

```env
NODE_ENV=production|development
PORT=8888
LOG_LEVEL=debug|warn|error
```

## RTP Monitoring

The server monitors RTP activity on each producer:

- **Heartbeat Interval**: 5 seconds (check RTP activity)
- **Silence Threshold**: 8 seconds (consider producer silent after 8 seconds without RTP)

Callbacks can be registered to handle RTP start/stop events.

## Troubleshooting

### Worker Dies Unexpectedly

Check logs and ensure:

- Sufficient memory and CPU available
- No port conflicts in RTC range (40000-41000)
- Valid RTP parameters from clients

### Connection Refused

Ensure the mediasoup server is running and accessible:

```bash
nc -zv 127.0.0.1 8888
```

### High CPU Usage

- Reduce the number of active producers/consumers
- Increase heartbeat interval if RTP monitoring is expensive
- Consider scaling with multiple workers

## Production Considerations

1. **Multiple Workers**: Set `numWorkers > 1` in `worker-pool.ts` for better CPU utilization
2. **Announced IP**: Configure `announcedIp` in `createTransport` for NAT scenarios
3. **TURN Server**: Ensure a TURN server is available for NAT traversal
4. **Monitoring**: Implement metrics collection for router stats
5. **Graceful Shutdown**: Properly close all resources on server shutdown

## Related Files

- Fastify Backend: `../src/mediasoup/mediasoup-client.ts`
- RTC Routes: `../src/routes/rtc.ts`
- Transport Service: `../src/services/rtcTransportService.ts`
