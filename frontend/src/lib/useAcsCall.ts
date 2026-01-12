import { useCallback, useEffect, useRef, useState } from 'react'

import {
  disposeAcsClient,
  endCall,
  getCallState,
  initializeAcsClient,
  isMuted,
  startCall,
  toggleMute,
} from './acsClient'
import type { AcsCredentials, Call } from './acsClient'

export interface UseAcsCallOptions {
  /** 表示名 */
  displayName: string
  /** 通話状態変更時のコールバック */
  onStateChange?: (state: string | null) => void
  /** 通話終了時のコールバック */
  onCallEnded?: (reason?: string) => void
}

export interface UseAcsCallReturn {
  /** 初期化状態 */
  isInitialized: boolean
  /** 初期化中 */
  isInitializing: boolean
  /** 通話中かどうか */
  isInCall: boolean
  /** 接続中かどうか */
  isConnecting: boolean
  /** 現在の通話状態 */
  callState: string | null
  /** ミュート状態 */
  muted: boolean
  /** エラー */
  error: string | null
  /** ACSを初期化 */
  initialize: (credentials: AcsCredentials) => Promise<void>
  /** 通話を開始 */
  call: (targetAcsUserId: string) => Promise<void>
  /** 通話を終了 */
  hangUp: () => Promise<void>
  /** ミュート切り替え */
  toggleMute: () => Promise<void>
  /** クリーンアップ */
  dispose: () => Promise<void>
}

/**
 * ACS通話機能を提供するReact Hook
 */
export function useAcsCall(options: UseAcsCallOptions): UseAcsCallReturn {
  const { displayName, onStateChange, onCallEnded } = options

  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [callState, setCallState] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callRef = useRef<Call | null>(null)
  const stateIntervalRef = useRef<number | null>(null)

  // 通話状態をポーリングで監視
  const startStatePolling = useCallback(() => {
    if (stateIntervalRef.current) {
      clearInterval(stateIntervalRef.current)
    }

    stateIntervalRef.current = window.setInterval(() => {
      const state = getCallState()
      setCallState((prev) => {
        if (prev !== state) {
          onStateChange?.(state)

          if (state === 'Disconnected' || state === null) {
            if (prev && prev !== 'Disconnected') {
              onCallEnded?.()
            }
            if (stateIntervalRef.current) {
              clearInterval(stateIntervalRef.current)
              stateIntervalRef.current = null
            }
          }
        }
        return state
      })

      setMuted(isMuted())
    }, 500)
  }, [onStateChange, onCallEnded])

  // ACSクライアントを初期化
  const initialize = useCallback(
    async (credentials: AcsCredentials) => {
      setIsInitializing(true)
      setError(null)

      try {
        await initializeAcsClient(credentials, displayName)
        setIsInitialized(true)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '初期化に失敗しました'
        setError(message)
        throw err
      } finally {
        setIsInitializing(false)
      }
    },
    [displayName],
  )

  // 通話を開始
  const call = useCallback(
    async (targetAcsUserId: string) => {
      if (!isInitialized) {
        throw new Error('ACSが初期化されていません')
      }

      setError(null)

      try {
        const newCall = await startCall(targetAcsUserId)
        callRef.current = newCall
        startStatePolling()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '通話開始に失敗しました'
        setError(message)
        throw err
      }
    },
    [isInitialized, startStatePolling],
  )

  // 通話を終了
  const hangUp = useCallback(async () => {
    setError(null)

    try {
      await endCall()
      callRef.current = null
      setCallState(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '通話終了に失敗しました'
      setError(message)
    }
  }, [])

  // ミュート切り替え
  const handleToggleMute = useCallback(async () => {
    try {
      const newMuted = await toggleMute()
      setMuted(newMuted)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ミュート切り替えに失敗しました'
      setError(message)
    }
  }, [])

  // クリーンアップ
  const dispose = useCallback(async () => {
    if (stateIntervalRef.current) {
      clearInterval(stateIntervalRef.current)
      stateIntervalRef.current = null
    }

    await disposeAcsClient()
    callRef.current = null
    setIsInitialized(false)
    setCallState(null)
    setMuted(false)
  }, [])

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (stateIntervalRef.current) {
        clearInterval(stateIntervalRef.current)
      }
      // 非同期クリーンアップは発火のみ
      disposeAcsClient().catch(console.error)
    }
  }, [])

  const isInCall =
    callState !== null && callState !== 'Disconnected' && callState !== 'None'

  const isConnecting = callState === 'Connecting' || callState === 'Ringing'

  return {
    isInitialized,
    isInitializing,
    isInCall,
    isConnecting,
    callState,
    muted,
    error,
    initialize,
    call,
    hangUp,
    toggleMute: handleToggleMute,
    dispose,
  }
}
