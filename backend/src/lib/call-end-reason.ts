import { CALL_END_REASON_VALUES } from "../db/index.js";
import type { CallEndReason } from "../db/index.js";

const LEGACY_REASON_MAP: Record<string, CallEndReason> = {
  rtp_stopped: "network_lost",
  disconnect: "network_lost",
  low_balance: "no_point",
  manual: "system_error",
};

export const ACCEPTED_CALL_END_REASON_INPUTS = [
  ...CALL_END_REASON_VALUES,
  "rtp_stopped",
  "disconnect",
  "low_balance",
  "manual",
] as const;

export const CANONICAL_CALL_END_REASONS = CALL_END_REASON_VALUES;

export function isCallEndReason(value: unknown): value is CallEndReason {
  return (
    typeof value === "string" &&
    (CALL_END_REASON_VALUES as readonly string[]).includes(value)
  );
}

export function normalizeCallEndReason(input?: string | null): CallEndReason {
  if (!input || typeof input !== "string") {
    return "system_error";
  }

  const lowered = input.trim().toLowerCase();
  if ((CALL_END_REASON_VALUES as readonly string[]).includes(lowered)) {
    return lowered as CallEndReason;
  }

  return LEGACY_REASON_MAP[lowered] ?? "system_error";
}
