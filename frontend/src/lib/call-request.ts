export interface CallRequestPayload {
  toUserId: string
  pricePerMinute: number
}

export interface CallRequestResult {
  callId: string
  requestedAt: string
}

const SIMULATED_DELAY_MS = 1200
const FAILURE_RATE = 0.1

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function sendMockCallRequest(
  payload: CallRequestPayload,
): Promise<CallRequestResult> {
  await sleep(SIMULATED_DELAY_MS)

  if (!payload.toUserId) {
    throw new Error('相手の情報を取得できませんでした。')
  }

  if (payload.pricePerMinute <= 0) {
    throw new Error('料金情報が不正です。')
  }

  if (Math.random() < FAILURE_RATE) {
    throw new Error('通信エラーが発生しました。もう一度お試しください。')
  }

  const callId = `call-${payload.toUserId}`

  return {
    callId,
    requestedAt: new Date().toISOString(),
  }
}
