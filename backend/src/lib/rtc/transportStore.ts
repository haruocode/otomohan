export type TransportDirection = "send" | "recv";

export type IceParameters = {
  usernameFragment: string;
  password: string;
  iceLite: boolean;
};

export type IceCandidate = {
  foundation: string;
  priority: number;
  ip: string;
  protocol: "udp" | "tcp";
  port: number;
  type: "host" | "srflx" | "prflx" | "relay";
};

export type DtlsFingerprint = {
  algorithm: string;
  value: string;
};

export type DtlsParameters = {
  role: "auto" | "client" | "server";
  fingerprints: DtlsFingerprint[];
};

export type TransportDescription = {
  transportId: string;
  callId: string;
  userId: string;
  direction: TransportDirection;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  clientDtlsParameters: DtlsParameters | null;
  isConnected: boolean;
  connectedAt: string | null;
  createdAt: string;
};

const transportById = new Map<string, TransportDescription>();
const participantKeyToTransportId = new Map<string, string>();

function buildParticipantKey(
  callId: string,
  userId: string,
  direction: TransportDirection
): string {
  return `${callId}:${userId}:${direction}`;
}

export function saveTransport(record: TransportDescription) {
  transportById.set(record.transportId, record);
  participantKeyToTransportId.set(
    buildParticipantKey(record.callId, record.userId, record.direction),
    record.transportId
  );
}

export function findTransportById(
  transportId: string
): TransportDescription | null {
  return transportById.get(transportId) ?? null;
}

export function findTransportForParticipant(options: {
  callId: string;
  userId: string;
  direction: TransportDirection;
}): TransportDescription | null {
  const key = buildParticipantKey(
    options.callId,
    options.userId,
    options.direction
  );
  const transportId = participantKeyToTransportId.get(key);
  if (!transportId) {
    return null;
  }
  return transportById.get(transportId) ?? null;
}

export function markTransportConnected(options: {
  transportId: string;
  clientDtlsParameters: DtlsParameters;
}): TransportDescription | null {
  const existing = transportById.get(options.transportId);
  if (!existing) {
    return null;
  }
  existing.clientDtlsParameters = options.clientDtlsParameters;
  existing.isConnected = true;
  existing.connectedAt = new Date().toISOString();
  return existing;
}

export function deleteTransportsByCall(callId: string): number {
  const targets: Array<{ transportId: string; participantKey: string }> = [];

  for (const [transportId, record] of transportById) {
    if (record.callId === callId) {
      targets.push({
        transportId,
        participantKey: buildParticipantKey(
          record.callId,
          record.userId,
          record.direction
        ),
      });
    }
  }

  for (const target of targets) {
    transportById.delete(target.transportId);
    participantKeyToTransportId.delete(target.participantKey);
  }

  return targets.length;
}
