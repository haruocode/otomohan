import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from 'lucide-react'

import type { CallEndReason, CallSession } from '@/lib/api'
import { fetchCallSession, fetchWalletBalance, fetchAcsToken } from '@/lib/api'
import { getCallEndReasonMeta } from '@/lib/call-status'
import { useAcsCall } from '@/lib/useAcsCall'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const numberFormatter = new Intl.NumberFormat('ja-JP')

export const Route = createFileRoute('/call/$callId')({
  component: InCallScreen,
})

function InCallScreen() {
  const { callId } = Route.useParams()
  const navigate = useNavigate({ from: '/call/$callId' })
  const callQuery = useQuery({
    queryKey: ['call-session', callId],
    queryFn: () => fetchCallSession(callId),
    staleTime: 5_000,
  })
  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: fetchWalletBalance,
    refetchInterval: 20_000,
    staleTime: 10_000,
  })

  const [session, setSession] = useState<CallSession | null>(null)
  const [isSpeaker, setIsSpeaker] = useState(true)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [endReason, setEndReason] = useState<CallEndReason | null>(null)
  const [acsInitialized, setAcsInitialized] = useState(false)

  // ACS通話フック
  const acsCall = useAcsCall({
    displayName: 'ユーザー',
    onCallEnded: () => {
      setEndReason((prev) => prev ?? 'otomo_end')
    },
  })

  // ACS初期化
  useEffect(() => {
    if (acsInitialized || !session) return

    const initAcs = async () => {
      try {
        const tokenData = await fetchAcsToken(callId)
        await acsCall.initialize({
          acsUserId: tokenData.acsUserId,
          token: tokenData.token,
        })
        setAcsInitialized(true)

        // 相手のACSユーザーIDがある場合は通話を開始
        // 注: 実際の実装ではWebSocketでシグナリングされた相手のACSユーザーIDを使用
        if (session.partner?.acsUserId) {
          await acsCall.call(session.partner.acsUserId)
        }
      } catch (err) {
        console.error('ACS initialization failed:', err)
        setBanner({
          message: '音声接続の初期化に失敗しました',
          tone: 'warning',
        })
      }
    }

    initAcs()
  }, [callId, session, acsInitialized, acsCall])

  // クリーンアップ
  useEffect(() => {
    return () => {
      acsCall.dispose()
    }
  }, [acsCall])

  useEffect(() => {
    if (callQuery.data) {
      setSession(callQuery.data)
    }
  }, [callQuery.data])

  const elapsedSeconds = useElapsedTimer(
    session?.startedAt,
    session?.status === 'in_call' || session?.status === 'finishing',
  )

  const handleBillingElapsed = useCallback(() => {
    setSession((prev) => {
      if (prev === null) return prev
      const nextBalance = Math.max(0, prev.balance - prev.pricePerMinute)
      if (nextBalance <= 0) {
        setEndReason((reason) => reason ?? 'no_point')
        return {
          ...prev,
          balance: 0,
          status: 'finishing',
          nextBillingAt: undefined,
          reason: 'no_point',
        }
      }
      return {
        ...prev,
        balance: nextBalance,
        lastBilledAt: new Date().toISOString(),
        nextBillingAt: new Date(Date.now() + 60_000).toISOString(),
      }
    })
  }, [])

  const countdownSeconds = useBillingCountdown(
    session?.nextBillingAt,
    session?.status === 'in_call',
    handleBillingElapsed,
  )

  useEffect(() => {
    if (session?.status === 'finishing') {
      const derivedReason = endReason ?? session.reason ?? 'user_end'
      const reasonMeta = getCallEndReasonMeta(derivedReason)
      const bannerTone: BannerTone =
        reasonMeta.tone === 'danger' ? 'warning' : reasonMeta.tone
      setBanner({
        message: reasonMeta.title,
        tone: bannerTone,
      })
      const timeout = window.setTimeout(() => {
        navigate({
          to: '/call/$callId/summary',
          params: { callId },
          search: (prev) => ({ ...prev, reason: derivedReason }),
        })
      }, 1200)
      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [session?.status, session?.reason, endReason, navigate, callId])

  const handleEndCall = useCallback(async () => {
    setEndReason('user_end')
    // ACS通話を終了
    await acsCall.hangUp()
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'finishing',
            nextBillingAt: undefined,
            reason: 'user_end',
          }
        : prev,
    )
  }, [acsCall])

  const derivedBalance = session?.balance ?? walletQuery.data?.balance

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-16 top-0 h-64 w-64 rounded-full bg-rose-500/20 blur-[100px]" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-24 pt-8 sm:px-6">
        <HeaderSection
          balance={derivedBalance}
          onEndCall={handleEndCall}
          isEnding={session?.status === 'finishing'}
        />

        {banner && (
          <InlineBanner
            message={banner.message}
            tone={banner.tone}
            onDismiss={() => setBanner(null)}
          />
        )}

        {callQuery.isLoading && <CallSkeleton />}

        {callQuery.isError && (
          <CallError
            message="通話情報を取得できませんでした"
            onRetry={() => callQuery.refetch()}
          />
        )}

        {!callQuery.isLoading && !callQuery.isError && session && (
          <>
            <InCallHero
              session={session}
              elapsedSeconds={elapsedSeconds}
              countdownSeconds={countdownSeconds}
            />
            <ControlPanel
              isMuted={acsCall.muted}
              isSpeaker={isSpeaker}
              onToggleMute={() => acsCall.toggleMute()}
              onToggleSpeaker={() => setIsSpeaker((prev) => !prev)}
              onEndCall={handleEndCall}
              disableEnd={session.status === 'finishing'}
            />
          </>
        )}
      </main>
    </div>
  )
}

function HeaderSection({
  balance,
  onEndCall,
  isEnding,
}: {
  balance?: number | null
  onEndCall: () => void
  isEnding: boolean
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Button
        variant="ghost"
        className="rounded-2xl border border-white/10 text-white"
        onClick={onEndCall}
        disabled={isEnding}
      >
        <PhoneOff className="mr-2 h-4 w-4" />
        終了
      </Button>
      <div className="text-center">
        <p className="text-sm text-white/60">画面ID U-04 / 通話中</p>
        <p className="text-xl font-semibold">通話中</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
        <p className="text-white/60">残ポイント</p>
        <p className="text-lg font-semibold">
          {typeof balance === 'number'
            ? `${numberFormatter.format(balance)} pt`
            : '---'}
        </p>
      </div>
    </header>
  )
}

function InCallHero({
  session,
  elapsedSeconds,
  countdownSeconds,
}: {
  session: CallSession
  elapsedSeconds: number
  countdownSeconds: number | null
}) {
  const statusDotClass =
    'h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_15px] shadow-rose-400/70'
  const formattedElapsed = formatDuration(elapsedSeconds)
  const formattedCountdown =
    typeof countdownSeconds === 'number'
      ? formatCountdown(countdownSeconds)
      : '--:--'

  return (
    <Card className="border-white/10 bg-white/5 text-center">
      <CardContent className="space-y-6 p-8">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-28 w-28 rounded-full border-4 border-white/10">
            <AvatarImage
              src={session.partner.avatarUrl}
              alt={session.partner.name}
            />
            <AvatarFallback>
              {session.partner.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{session.partner.name}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-white/70">
              <span className={statusDotClass} />
              <span>通話中</span>
            </div>
            <p className="text-sm text-white/60">
              料金 {numberFormatter.format(session.pricePerMinute)} pt / 分
            </p>
          </div>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-white/60">経過時間</p>
            <p className="text-3xl font-mono tracking-tight">
              {formattedElapsed}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-white/60">
              次の{numberFormatter.format(session.pricePerMinute)}pt減算まで
            </p>
            <p
              className={cn(
                'text-3xl font-mono tracking-tight',
                countdownSeconds !== null &&
                  countdownSeconds < 10 &&
                  'text-amber-300',
              )}
            >
              {formattedCountdown}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ControlPanel({
  isMuted,
  isSpeaker,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  disableEnd,
}: {
  isMuted: boolean
  isSpeaker: boolean
  onToggleMute: () => void
  onToggleSpeaker: () => void
  onEndCall: () => void
  disableEnd: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full flex-wrap justify-center gap-4">
        <ToggleButton
          label={isMuted ? 'ミュート解除' : 'ミュート'}
          icon={isMuted ? MicOff : Mic}
          active={isMuted}
          onClick={onToggleMute}
        />
        <ToggleButton
          label={isSpeaker ? 'スピーカー' : 'イヤホン'}
          icon={isSpeaker ? Volume2 : VolumeX}
          active={isSpeaker}
          onClick={onToggleSpeaker}
        />
      </div>
      <Button
        size="lg"
        className="h-16 w-48 rounded-full bg-rose-600 text-lg font-semibold text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500"
        onClick={onEndCall}
        disabled={disableEnd}
      >
        <PhoneOff className="mr-2 h-5 w-5" />
        通話終了
      </Button>
    </div>
  )
}

function ToggleButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: typeof Mic
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-35 flex-col items-center gap-2 rounded-2xl border px-6 py-4 text-sm transition',
        active
          ? 'border-white/50 bg-white/10 text-white'
          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}

function CallSkeleton() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="space-y-6 p-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  )
}

function CallError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-white">エラー</CardTitle>
        <CardDescription className="text-rose-100">{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onRetry} className="rounded-2xl">
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

type BannerTone = 'info' | 'warning' | 'danger'
interface BannerState {
  message: string
  tone: BannerTone
}

function InlineBanner({
  message,
  tone,
  onDismiss,
}: {
  message: string
  tone: BannerTone
  onDismiss: () => void
}) {
  const toneClasses: Record<BannerTone, string> = {
    info: 'border-blue-400/40 bg-blue-400/10 text-blue-50',
    warning: 'border-amber-400/40 bg-amber-400/10 text-amber-50',
    danger: 'border-rose-500/40 bg-rose-500/10 text-rose-50',
  }
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm',
        toneClasses[tone],
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-white/70 underline-offset-2 hover:underline"
      >
        閉じる
      </button>
    </div>
  )
}

function useElapsedTimer(startedAt?: string, active?: boolean) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt || !active) {
      setElapsed(0)
      return
    }
    const start = new Date(startedAt).getTime()
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    }
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [startedAt, active])

  return elapsed
}

function useBillingCountdown(
  targetIso?: string,
  active?: boolean,
  onElapsed?: () => void,
) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!targetIso || !active) {
      setSecondsLeft(null)
      return
    }
    let elapsedCalled = false
    const target = new Date(targetIso).getTime()
    const tick = () => {
      const diff = Math.ceil((target - Date.now()) / 1000)
      setSecondsLeft(diff > 0 ? diff : 0)
      if (diff <= 0 && !elapsedCalled) {
        elapsedCalled = true
        onElapsed?.()
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetIso, active, onElapsed])

  return secondsLeft
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const segments = [hrs, mins, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
  return segments
}

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
