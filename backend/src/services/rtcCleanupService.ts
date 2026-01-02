import { getCallById } from "../repositories/callRepository.js";
import { findOtomoById } from "../repositories/otomoRepository.js";
import { deleteTransportsByCall } from "../lib/rtc/transportStore.js";
import { deleteProducersByCall } from "../lib/rtc/producerStore.js";
import { deleteConsumersByCall } from "../lib/rtc/consumerStore.js";

export type CleanupRtcResourcesResult =
  | {
      success: true;
      released: {
        transports: number;
        producers: number;
        consumers: number;
      };
    }
  | {
      success: false;
      reason: "CALL_NOT_FOUND" | "FORBIDDEN";
    };

export async function cleanupRtcResourcesForCall(options: {
  callId: string;
  requesterUserId: string;
}): Promise<CleanupRtcResourcesResult> {
  const trimmedCallId = options.callId.trim();

  if (!trimmedCallId) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const call = await getCallById(trimmedCallId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
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

  const consumers = deleteConsumersByCall(trimmedCallId);
  const producers = deleteProducersByCall(trimmedCallId);
  const transports = deleteTransportsByCall(trimmedCallId);

  return {
    success: true,
    released: {
      transports,
      producers,
      consumers,
    },
  };
}
