import { randomUUID } from "node:crypto";
import { getCallById } from "../repositories/callRepository.js";
import { findOtomoById } from "../repositories/otomoRepository.js";
import {
  findTransportById,
  type TransportDirection,
} from "../lib/rtc/transportStore.js";
import {
  findProducerById,
  type ProducerKind,
} from "../lib/rtc/producerStore.js";
import {
  saveConsumer,
  findConsumerForParticipant,
  type ConsumerRecord,
} from "../lib/rtc/consumerStore.js";

const TRANSPORT_KIND_DIRECTION: Record<ProducerKind, TransportDirection> = {
  audio: "recv",
};

export type CreateConsumerResult =
  | { success: true; consumer: ConsumerRecord; reused: boolean }
  | {
      success: false;
      reason:
        | "CALL_NOT_FOUND"
        | "FORBIDDEN"
        | "INVALID_STATE"
        | "TRANSPORT_NOT_FOUND"
        | "PRODUCER_NOT_FOUND"
        | "TRANSPORT_DIRECTION_MISMATCH"
        | "TRANSPORT_NOT_CONNECTED";
    };

export async function createConsumerForParticipant(options: {
  callId: string;
  requesterUserId: string;
  transportId: string;
  producerId: string;
}): Promise<CreateConsumerResult> {
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

  const existing = findConsumerForParticipant({
    callId: trimmedCallId,
    userId: options.requesterUserId,
    producerId: options.producerId,
  });

  if (existing) {
    return { success: true, consumer: existing, reused: true };
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

  if (transport.callId !== trimmedCallId) {
    return { success: false, reason: "FORBIDDEN" };
  }

  const producer = findProducerById(options.producerId);
  if (!producer) {
    return { success: false, reason: "PRODUCER_NOT_FOUND" };
  }

  if (producer.callId !== trimmedCallId) {
    return { success: false, reason: "FORBIDDEN" };
  }

  if (producer.userId === options.requesterUserId) {
    return { success: false, reason: "FORBIDDEN" };
  }

  const expectedDirection = TRANSPORT_KIND_DIRECTION[producer.kind];
  if (transport.direction !== expectedDirection) {
    return { success: false, reason: "TRANSPORT_DIRECTION_MISMATCH" };
  }

  const consumer: ConsumerRecord = {
    consumerId: randomUUID(),
    callId: trimmedCallId,
    userId: options.requesterUserId,
    transportId: transport.transportId,
    producerId: producer.producerId,
    kind: producer.kind,
    rtpParameters: buildMockRtpParameters(producer.kind),
    producerPaused: false,
    createdAt: new Date().toISOString(),
  };

  saveConsumer(consumer);

  return { success: true, consumer, reused: false };
}

function buildMockRtpParameters(kind: ProducerKind) {
  if (kind === "audio") {
    return {
      codecs: [
        {
          mimeType: "audio/opus",
          payloadType: 111,
          clockRate: 48_000,
          channels: 2,
          parameters: {
            useinbandfec: 1,
          },
        },
      ],
      headerExtensions: [
        {
          uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
          id: 1,
        },
        {
          uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
          id: 3,
        },
      ],
      encodings: [{ ssrc: Math.floor(Math.random() * 10_000_000) }],
      rtcp: {
        cname: randomUUID(),
        reducedSize: true,
      },
    };
  }

  return {};
}
