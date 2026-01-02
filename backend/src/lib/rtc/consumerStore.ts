import type { ProducerKind } from "./producerStore.js";

export type ConsumerRecord = {
  consumerId: string;
  callId: string;
  userId: string;
  transportId: string;
  producerId: string;
  kind: ProducerKind;
  rtpParameters: unknown;
  producerPaused: boolean;
  createdAt: string;
};

const consumersById = new Map<string, ConsumerRecord>();
const participantKeyToConsumerId = new Map<string, string>();

function buildParticipantKey(
  callId: string,
  userId: string,
  producerId: string
) {
  return `${callId}:${userId}:${producerId}`;
}

export function saveConsumer(record: ConsumerRecord) {
  consumersById.set(record.consumerId, record);
  participantKeyToConsumerId.set(
    buildParticipantKey(record.callId, record.userId, record.producerId),
    record.consumerId
  );
}

export function findConsumerById(consumerId: string): ConsumerRecord | null {
  return consumersById.get(consumerId) ?? null;
}

export function findConsumerForParticipant(options: {
  callId: string;
  userId: string;
  producerId: string;
}): ConsumerRecord | null {
  const key = buildParticipantKey(
    options.callId,
    options.userId,
    options.producerId
  );
  const consumerId = participantKeyToConsumerId.get(key);
  if (!consumerId) {
    return null;
  }
  return consumersById.get(consumerId) ?? null;
}
