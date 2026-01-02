import WebSocket from "ws";

const activeConnections = new Map<string, Set<WebSocket>>();

export function registerConnection(userId: string, socket: WebSocket) {
  const existing = activeConnections.get(userId) ?? new Set<WebSocket>();
  existing.add(socket);
  activeConnections.set(userId, existing);
}

export function unregisterConnection(userId: string, socket: WebSocket) {
  const existing = activeConnections.get(userId);
  if (!existing) return;
  existing.delete(socket);
  if (existing.size === 0) {
    activeConnections.delete(userId);
  }
}

export function sendJson(socket: WebSocket, payload: unknown) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

export function broadcastToUser(userId: string, payload: unknown) {
  const sockets = activeConnections.get(userId);
  if (!sockets) return;
  const serialized = JSON.stringify(payload);
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(serialized);
    }
  }
}

export function broadcastToUsers(userIds: string[], payload: unknown) {
  const uniqueIds = [...new Set(userIds)];
  for (const id of uniqueIds) {
    broadcastToUser(id, payload);
  }
}

export function getActiveConnectionCount(userId: string): number {
  return activeConnections.get(userId)?.size ?? 0;
}

export function broadcastToAll(payload: unknown) {
  const serialized = JSON.stringify(payload);
  for (const sockets of activeConnections.values()) {
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(serialized);
      }
    }
  }
}
