import { randomUUID } from "node:crypto";
import { getCallById } from "../repositories/callRepository.js";
import { findOtomoById } from "../repositories/otomoRepository.js";
import {
  findTransportById,
  type TransportDirection,
} from "../lib/rtc/transportStore.js";
import {
  saveProducer,
  findProducerForParticipant,
  type ProducerRecord,
  type ProducerKind,
} from "../lib/rtc/producerStore.js";

const ALLOWED_KINDS: ProducerKind[] = ["audio"];
const TRANSPORT_KIND_DIRECTION: Record<ProducerKind, TransportDirection> = {
  audio: "send",
};

export type CreateProducerResult =
  | { success: true; producer: ProducerRecord; reused: boolean }
  | {
      success: false;
      reason:
        | "CALL_NOT_FOUND"
        | "FORBIDDEN"
        | "INVALID_STATE"
        | "TRANSPORT_NOT_FOUND"
        | "TRANSPORT_DIRECTION_MISMATCH"
        | "TRANSPORT_NOT_CONNECTED"
        | "UNSUPPORTED_KIND";
    };

export async function createProducerForParticipant(options: {
  callId: string;
  requesterUserId: string;
  transportId: string;
  kind: ProducerKind;
  rtpParameters: unknown;
}): Promise<CreateProducerResult> {
  if (!ALLOWED_KINDS.includes(options.kind)) {
    return { success: false, reason: "UNSUPPORTED_KIND" };
  }

  const trimmedCallId = options.callId.trim();
  if (!trimmedCallId) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const call = await getCallById(trimmedCallId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (call.status !== "accepted" && call.status !== "active") {
    return { success: false, reason: "INVALID_STATE" };
  }

  const otomo = await findOtomoById(call.otomoId);
  if (!otomo) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const isParticipant =
    call.userId === options.requesterUserId ||
    otomo.ownerUserId === options.requesterUserId;

  if (!isParticipant) {
    return { success: false, reason: "FORBIDDEN" };
  }

  const existing = findProducerForParticipant({
    callId: trimmedCallId,
    userId: options.requesterUserId,
    kind: options.kind,
  });

  if (existing) {
    return { success: true, producer: existing, reused: true };
  }

  const transport = findTransportById(options.transportId);
  if (!transport) {
    return { success: false, reason: "TRANSPORT_NOT_FOUND" };
  }

  if (transport.userId !== options.requesterUserId) {
    return { success: false, reason: "FORBIDDEN" };
  }

  if (!transport.isConnected) {
    return { success: false, reason: "TRANSPORT_NOT_CONNECTED" };
  }

  const expectedDirection = TRANSPORT_KIND_DIRECTION[options.kind];
  if (transport.direction !== expectedDirection) {
    return { success: false, reason: "TRANSPORT_DIRECTION_MISMATCH" };
  }

  if (transport.callId !== trimmedCallId) {
    return { success: false, reason: "FORBIDDEN" };
  }

  const producer: ProducerRecord = {
    producerId: randomUUID(),
    callId: trimmedCallId,
    userId: options.requesterUserId,
    transportId: transport.transportId,
    kind: options.kind,
    rtpParameters: options.rtpParameters,
    createdAt: new Date().toISOString(),
  };

  saveProducer(producer);

  return { success: true, producer, reused: false };
}
