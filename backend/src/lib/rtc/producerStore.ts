export type ProducerKind = "audio" | "video";

export type ProducerRecord = {
  producerId: string;
  callId: string;
  userId: string;
  transportId: string;
  kind: ProducerKind;
  rtpParameters: unknown;
  createdAt: string;
};

const producersById = new Map<string, ProducerRecord>();
const participantKeyToProducerId = new Map<string, string>();

function buildParticipantKey(
  callId: string,
  userId: string,
  kind: ProducerKind
) {
  return `${callId}:${userId}:${kind}`;
}

export function saveProducer(record: ProducerRecord) {
  producersById.set(record.producerId, record);
  participantKeyToProducerId.set(
    buildParticipantKey(record.callId, record.userId, record.kind),
    record.producerId
  );
}

export function findProducerById(producerId: string): ProducerRecord | null {
  return producersById.get(producerId) ?? null;
}

export function findProducerForParticipant(options: {
  callId: string;
  userId: string;
  kind: ProducerKind;
}): ProducerRecord | null {
  const key = buildParticipantKey(options.callId, options.userId, options.kind);
  const producerId = participantKeyToProducerId.get(key);
  if (!producerId) {
    return null;
  }
  return producersById.get(producerId) ?? null;
}
