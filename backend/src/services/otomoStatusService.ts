import { broadcastToAll } from "../ws/connectionRegistry.js";

export type OtomoPresenceStatus = "online" | "busy" | "offline" | "break";

type StatusSnapshot = {
  isOnline: boolean;
  isAvailable: boolean;
  statusMessage: string | null;
  statusUpdatedAt: string;
};

type TimestampInput = string | number | Date | undefined;

export function broadcastOtomoStatusUpdate(options: {
  otomoId: string;
  status: OtomoPresenceStatus;
  timestamp?: TimestampInput;
}) {
  broadcastToAll({
    type: "otomo_status_update",
    userId: options.otomoId,
    status: options.status,
    timestamp: normalizeEpochSeconds(options.timestamp),
  });
}

export function broadcastOtomoStatusFromSnapshot(options: {
  otomoId: string;
  snapshot: StatusSnapshot;
  overrideStatus?: OtomoPresenceStatus;
}) {
  const status = options.overrideStatus
    ? options.overrideStatus
    : deriveOtomoStatus(options.snapshot);

  broadcastOtomoStatusUpdate({
    otomoId: options.otomoId,
    status,
    timestamp: options.snapshot.statusUpdatedAt,
  });
}

export function deriveOtomoStatus(
  snapshot: StatusSnapshot
): OtomoPresenceStatus {
  if (!snapshot.isOnline) {
    return "offline";
  }

  const message = (snapshot.statusMessage ?? "").toLowerCase();
  if (message.includes("break") || message.includes("離席")) {
    return "break";
  }

  if (!snapshot.isAvailable) {
    return "busy";
  }

  return "online";
}

function normalizeEpochSeconds(timestamp: TimestampInput): number {
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
    return Math.floor(timestamp);
  }

  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }

  if (timestamp instanceof Date && !Number.isNaN(timestamp.getTime())) {
    return Math.floor(timestamp.getTime() / 1000);
  }

  return Math.floor(Date.now() / 1000);
}
