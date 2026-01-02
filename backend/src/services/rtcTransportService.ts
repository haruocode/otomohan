import { randomBytes, randomUUID } from "node:crypto";
import { getCallById } from "../repositories/callRepository.js";
import { findOtomoById } from "../repositories/otomoRepository.js";
import {
  saveTransport,
  findTransportForParticipant,
  type TransportDirection,
  type TransportDescription,
} from "../lib/rtc/transportStore.js";

const PARTICIPANT_ALLOWED_STATUSES = new Set(["accepted", "active"]);

export type CreateTransportResult =
  | { success: true; transport: TransportDescription; reused: boolean }
  | {
      success: false;
      reason: "CALL_NOT_FOUND" | "FORBIDDEN" | "INVALID_STATE";
    };

export async function createTransportForParticipant(options: {
  callId: string;
  requesterUserId: string;
  direction: TransportDirection;
}): Promise<CreateTransportResult> {
  const trimmedCallId = options.callId.trim();
  if (!trimmedCallId) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const call = await getCallById(trimmedCallId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (!PARTICIPANT_ALLOWED_STATUSES.has(call.status)) {
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

  const existing = findTransportForParticipant({
    callId: trimmedCallId,
    userId: options.requesterUserId,
    direction: options.direction,
  });

  if (existing) {
    return { success: true, transport: existing, reused: true };
  }

  const transport = buildTransportDescription({
    callId: trimmedCallId,
    userId: options.requesterUserId,
    direction: options.direction,
  });

  saveTransport(transport);

  return { success: true, transport, reused: false };
}

function buildTransportDescription(options: {
  callId: string;
  userId: string;
  direction: TransportDirection;
}): TransportDescription {
  const transportId = randomUUID();
  const createdAt = new Date().toISOString();

  return {
    transportId,
    callId: options.callId,
    userId: options.userId,
    direction: options.direction,
    createdAt,
    iceParameters: {
      usernameFragment: randomBase64Url(16),
      password: randomBase64Url(32),
      iceLite: true,
    },
    iceCandidates: [
      {
        foundation: randomBase16(8),
        priority: 10_000 + Math.floor(Math.random() * 90_000),
        ip: "203.0.113.10",
        protocol: "udp",
        port: 30_000 + Math.floor(Math.random() * 10_000),
        type: "host",
      },
    ],
    dtlsParameters: {
      role: "auto",
      fingerprints: [
        {
          algorithm: "sha-256",
          value: randomFingerprint(),
        },
      ],
    },
  };
}

function randomBase64Url(length: number) {
  return randomBytes(length)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function randomBase16(length: number) {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

function randomFingerprint() {
  const hex = randomBytes(32).toString("hex").toUpperCase();
  return hex.match(/.{1,2}/g)?.join(":") ?? hex;
}
