import { AzureCommunicationTokenCredential } from '@azure/communication-common'
import { CallClient } from '@azure/communication-calling'
import type {
  Call,
  CallAgent,
  DeviceManager,
  IncomingCall,
  LocalVideoStream,
  RemoteParticipant,
} from '@azure/communication-calling'

/**
 * Azure Communication Services Calling SDK ラッパー
 * 音声通話機能を提供
 */

// シングルトンインスタンス
let callClient: CallClient | null = null
let callAgent: CallAgent | null = null
let deviceManager: DeviceManager | null = null
let currentCall: Call | null = null

export interface AcsCredentials {
  acsUserId: string
  token: string
}

export interface CallEventHandlers {
  onCallStateChanged?: (state: string) => void
  onRemoteParticipantAdded?: (participant: RemoteParticipant) => void
  onRemoteParticipantRemoved?: (participant: RemoteParticipant) => void
  onIncomingCall?: (incomingCall: IncomingCall) => void
  onCallEnded?: (reason?: string) => void
}

/**
 * ACS Calling SDKを初期化
 * @param credentials ACSトークン情報
 * @param displayName 表示名
 */
export async function initializeAcsClient(
  credentials: AcsCredentials,
  displayName: string,
): Promise<void> {
  // 既存のインスタンスをクリーンアップ
  await disposeAcsClient()

  const tokenCredential = new AzureCommunicationTokenCredential(
    credentials.token,
  )

  callClient = new CallClient()
  callAgent = await callClient.createCallAgent(tokenCredential, {
    displayName,
  })
  deviceManager = await callClient.getDeviceManager()

  // マイクのアクセス許可をリクエスト
  await deviceManager.askDevicePermission({ audio: true, video: false })
}

/**
 * イベントハンドラーを設定
 */
export function setCallEventHandlers(handlers: CallEventHandlers): void {
  if (!callAgent) {
    console.warn('CallAgent not initialized')
    return
  }

  // 着信イベント
  if (handlers.onIncomingCall) {
    callAgent.on('incomingCall', (args) => {
      handlers.onIncomingCall?.(args.incomingCall)
    })
  }
}

/**
 * 通話を開始（発信）
 * @param targetAcsUserId 相手のACSユーザーID
 */
export function startCall(targetAcsUserId: string): Call | null {
  if (!callAgent) {
    throw new Error(
      'CallAgent not initialized. Call initializeAcsClient first.',
    )
  }

  const targetUser = { communicationUserId: targetAcsUserId }

  currentCall = callAgent.startCall([targetUser], {
    audioOptions: { muted: false },
    videoOptions: undefined,
  })

  setupCallEventListeners(currentCall)

  return currentCall
}

/**
 * 着信を受ける
 * @param incomingCall 着信オブジェクト
 */
export async function acceptIncomingCall(
  incomingCall: IncomingCall,
): Promise<Call | null> {
  currentCall = await incomingCall.accept({
    audioOptions: { muted: false },
  })

  setupCallEventListeners(currentCall)

  return currentCall
}

/**
 * 通話を終了
 */
export async function endCall(): Promise<void> {
  if (currentCall) {
    await currentCall.hangUp()
    currentCall = null
  }
}

/**
 * マイクをミュート/アンミュート
 */
export async function toggleMute(): Promise<boolean> {
  if (!currentCall) {
    throw new Error('No active call')
  }

  if (currentCall.isMuted) {
    await currentCall.unmute()
    return false
  } else {
    await currentCall.mute()
    return true
  }
}

/**
 * 現在の通話状態を取得
 */
export function getCallState(): string | null {
  return currentCall?.state ?? null
}

/**
 * 現在のミュート状態を取得
 */
export function isMuted(): boolean {
  return currentCall?.isMuted ?? false
}

/**
 * 利用可能なマイクデバイスを取得
 */
export async function getMicrophones(): Promise<
  Array<{ id: string; name: string }>
> {
  if (!deviceManager) {
    return []
  }

  const microphones = await deviceManager.getMicrophones()
  return microphones.map((mic) => ({
    id: mic.id,
    name: mic.name,
  }))
}

/**
 * マイクを選択
 */
export async function selectMicrophone(deviceId: string): Promise<void> {
  if (!deviceManager) {
    throw new Error('DeviceManager not initialized')
  }

  const microphones = await deviceManager.getMicrophones()
  const selected = microphones.find((mic) => mic.id === deviceId)
  if (selected) {
    await deviceManager.selectMicrophone(selected)
  }
}

/**
 * ACS Clientをクリーンアップ
 */
export async function disposeAcsClient(): Promise<void> {
  if (currentCall) {
    try {
      await currentCall.hangUp()
    } catch {
      // 通話が既に終了している場合は無視
    }
    currentCall = null
  }

  if (callAgent) {
    await callAgent.dispose()
    callAgent = null
  }

  // CallClientは明示的なdisposeが不要
  callClient = null
  deviceManager = null
}

/**
 * 通話イベントリスナーを設定（内部用）
 */
function setupCallEventListeners(call: Call): void {
  call.on('stateChanged', () => {
    console.log(`Call state changed: ${call.state}`)

    if (call.state === 'Disconnected') {
      const reason = call.callEndReason?.code.toString() ?? 'unknown'
      console.log(`Call ended with reason: ${reason}`)
      currentCall = null
    }
  })

  call.on('remoteParticipantsUpdated', (e) => {
    e.added.forEach((participant) => {
      console.log(`Remote participant added: ${participant.displayName}`)
    })
    e.removed.forEach((participant) => {
      console.log(`Remote participant removed: ${participant.displayName}`)
    })
  })
}

// 型エクスポート
export type { Call, IncomingCall, RemoteParticipant, LocalVideoStream }
