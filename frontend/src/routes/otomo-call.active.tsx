import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  SignalHigh,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { OtomoActiveCall, OtomoConnectionQuality } from '@/lib/api'
import {
  endOtomoActiveCall,
  fetchOtomoActiveCall,
  fetchAcsToken,
} from '@/lib/api'
import { useAcsCall } from '@/lib/useAcsCall'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const CONNECTION_META: Record<
  OtomoConnectionQuality,
  { label: string; dot: string }
> = {
  excellent: { label: '非常に安定', dot: 'bg-emerald-400' },
  good: { label: '安定', dot: 'bg-sky-400' },
  unstable: { label: '不安定', dot: 'bg-amber-400' },
  critical: { label: '危険', dot: 'bg-rose-500' },
}

const EVENT_LEVEL_META = {
  info: { label: 'Info', color: 'text-white/70' },
  warning: { label: 'Warning', color: 'text-amber-300' },
  error: { label: 'Error', color: 'text-rose-400' },
} as const
type EventLevel = keyof typeof EVENT_LEVEL_META

export const Route = createFileRoute('/otomo-call/active')({
  component: OtomoActiveCallScreen,
})

function OtomoActiveCallScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [controls, setControls] = useState({ speakerOn: true })
  const [acsInitialized, setAcsInitialized] = useState(false)

  // ACS通話フック
  const acsCall = useAcsCall({
    displayName: 'おともはん',
    onCallEnded: () => {
      // 相手が通話を終了した場合
      router.navigate({ to: '/otomo-call/summary' })
    },
  })

  const callQuery = useQuery({
    queryKey: ['otomo-active-call'],
    queryFn: fetchOtomoActiveCall,
    refetchInterval: 5_000,
  })

  const activeCall = callQuery.data?.call ?? null

  // ACS初期化
  useEffect(() => {
    if (acsInitialized || !activeCall) return

    const initAcs = async () => {
      try {
        const tokenData = await fetchAcsToken(activeCall.callId)
        await acsCall.initialize({
          acsUserId: tokenData.acsUserId,
          token: tokenData.token,
        })
        setAcsInitialized(true)

        // 相手のACSユーザーIDがある場合は通話を開始
        // 注: 実際の実装ではWebSocketでシグナリングされた相手のACSユーザーIDを使用
        if (activeCall.user?.acsUserId) {
          await acsCall.call(activeCall.user.acsUserId)
        }
      } catch (err) {
        console.error('ACS initialization failed:', err)
        setActionError('音声接続の初期化に失敗しました')
      }
    }

    initAcs()
  }, [activeCall, acsInitialized, acsCall])

  // クリーンアップ
  useEffect(() => {
    return () => {
      acsCall.dispose()
    }
  }, [acsCall])

  const [elapsedSec, setElapsedSec] = useState(() =>
    getElapsedSeconds(activeCall?.startedAt),
  )

  useEffect(() => {
    setElapsedSec(getElapsedSeconds(activeCall?.startedAt))
    if (!activeCall) {
      return undefined
    }
    const interval = setInterval(() => {
      setElapsedSec(getElapsedSeconds(activeCall.startedAt))
    }, 1_000)
    return () => clearInterval(interval)
  }, [activeCall?.callId, activeCall?.startedAt])

  useEffect(() => {
    if (!activeCall && callQuery.isSuccess) {
      const timeout = setTimeout(() => {
        router.navigate({ to: '/otomo-home' })
      }, 1_500)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [activeCall, callQuery.isSuccess, router])

  const mutation = useMutation({
    mutationFn: async () => {
      // ACS通話を終了
      await acsCall.hangUp()
      return endOtomoActiveCall('otomo_end')
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['otomo-active-call'] })
      queryClient.invalidateQueries({ queryKey: ['otomo-self'] })
      queryClient.setQueryData(['otomo-call-summary'], {
        summary: response.summary,
      })
      setIsConfirmOpen(false)
      router.navigate({ to: '/otomo-call/summary' })
    },
    onError: (error: unknown) => {
      setActionError(
        error instanceof Error ? error.message : '通話終了に失敗しました。',
      )
    },
  })

  const isLoading = callQuery.isLoading
  const isIdle = !activeCall && !isLoading

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(59,130,246,0.35),transparent_65%)]" />
      </div>
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white"
            onClick={() => setIsConfirmOpen(true)}
            disabled={!activeCall}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
          </Button>
          <div className="text-center">
            <p className="text-xs text-white/60">画面ID O-03 / 通話中</p>
            <p className="text-lg font-semibold">通話中</p>
          </div>
          <ConnectionIndicator quality={activeCall?.connectionQuality} />
        </header>

        {isLoading && <ActiveCallSkeleton />}

        {!isLoading && activeCall && (
          <ActiveCallCard
            call={activeCall}
            elapsedSec={elapsedSec}
            micMuted={acsCall.muted}
            speakerOn={controls.speakerOn}
            onToggleMic={() => acsCall.toggleMute()}
            onToggleSpeaker={() =>
              setControls((prev) => ({ ...prev, speakerOn: !prev.speakerOn }))
            }
            onRequestEnd={() => setIsConfirmOpen(true)}
            isEnding={mutation.isPending}
          />
        )}

        {isIdle && (
          <IdleState onBack={() => router.navigate({ to: '/otomo-home' })} />
        )}

        {actionError && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
            <AlertCircle className="h-4 w-4" />
            {actionError}
          </div>
        )}
      </main>

      <EndCallDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={() => {
          setActionError(null)
          mutation.mutate()
        }}
        isProcessing={mutation.isPending}
      />
    </div>
  )
}

function ActiveCallCard({
  call,
  elapsedSec,
  micMuted,
  speakerOn,
  onToggleMic,
  onToggleSpeaker,
  onRequestEnd,
  isEnding,
}: {
  call: OtomoActiveCall
  elapsedSec: number
  micMuted: boolean
  speakerOn: boolean
  onToggleMic: () => void
  onToggleSpeaker: () => void
  onRequestEnd: () => void
  isEnding: boolean
}) {
  const initials = useMemo(
    () => call.user.name.slice(0, 2).toUpperCase(),
    [call.user.name],
  )

  return (
    <Card className="border-white/15 bg-black/60 p-6 backdrop-blur-xl">
      <CardHeader className="items-center text-center">
        <Avatar className="h-28 w-28 border-4 border-white/20">
          <AvatarImage src={call.user.avatarUrl} alt={call.user.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle className="mt-4 text-2xl">{call.user.name} さん</CardTitle>
        <CardDescription className="text-white/70">
          接続済み — 相手の声は {call.voiceStatus}
        </CardDescription>
        <Badge className="mt-3 rounded-full bg-rose-500/20 text-rose-100">
          <span className="mr-2 h-2 w-2 rounded-full bg-rose-400" aria-hidden />
          通話接続中
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-white/60">通話時間</p>
          <p className="text-5xl font-semibold tracking-widest">
            {formatDuration(elapsedSec)}
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <CallMetric
            icon={SignalHigh}
            label="音声状態"
            value={call.voiceStatus}
          />
          <CallMetric icon={Waves} label="接続方式" value={call.transport} />
          <CallMetric
            icon={Headphones}
            label="相手のマイク"
            value={call.remoteMicState === 'muted' ? 'ミュート中' : 'ON'}
            subtle={
              call.remoteMicState === 'muted'
                ? '相手が音声を停止しています'
                : undefined
            }
          />
        </div>

        <ControlBar
          micMuted={micMuted}
          speakerOn={speakerOn}
          onToggleMic={onToggleMic}
          onToggleSpeaker={onToggleSpeaker}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          size="lg"
          variant="destructive"
          className="w-full rounded-2xl bg-linear-to-r from-rose-500 to-orange-500 text-base font-semibold shadow-lg shadow-rose-900/40"
          onClick={onRequestEnd}
          disabled={isEnding}
        >
          <PhoneOff className="mr-2 h-4 w-4" />
          {isEnding ? '通話を終了しています...' : '通話を終了する'}
        </Button>
        {call.events && call.events.length > 0 && (
          <EventFeed events={call.events} />
        )}
      </CardFooter>
    </Card>
  )
}

function ControlBar({
  micMuted,
  speakerOn,
  onToggleMic,
  onToggleSpeaker,
}: {
  micMuted: boolean
  speakerOn: boolean
  onToggleMic: () => void
  onToggleSpeaker: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <ControlButton
        label={micMuted ? 'ミュート中' : 'ミュート'}
        active={micMuted}
        onClick={onToggleMic}
        icon={
          micMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )
        }
      />
      <ControlButton
        label={speakerOn ? 'スピーカー' : 'イヤホン'}
        active={speakerOn}
        onClick={onToggleSpeaker}
        icon={
          speakerOn ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )
        }
      />
    </div>
  )
}

function ControlButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-20 w-28 flex-col items-center justify-center rounded-3xl border text-sm transition',
        active
          ? 'border-rose-400 bg-rose-500/20 text-rose-100'
          : 'border-white/10 bg-white/5 text-white',
      )}
      aria-pressed={active}
    >
      {icon}
      <span className="mt-2">{label}</span>
    </button>
  )
}

function CallMetric({
  icon: Icon,
  label,
  value,
  subtle,
}: {
  icon: LucideIcon
  label: string
  value: string
  subtle?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-white/70">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-right text-white">
        <p>{value}</p>
        {subtle && <p className="text-xs text-white/60">{subtle}</p>}
      </div>
    </div>
  )
}

function EventFeed({
  events,
}: {
  events: NonNullable<OtomoActiveCall['events']>
}) {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-2 text-sm font-semibold text-white">通話イベント</p>
      <div className="space-y-2 text-sm">
        {events.map((event) => {
          const meta = EVENT_LEVEL_META[event.level as EventLevel]
          return (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2"
            >
              <span
                className={cn(
                  'flex items-center gap-2 text-xs uppercase tracking-wide',
                  meta.color,
                )}
              >
                <span
                  className="h-2 w-2 rounded-full bg-white/20"
                  aria-hidden
                />
                {meta.label}
              </span>
              <span className="text-white/80">{event.message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IdleState({ onBack }: { onBack: () => void }) {
  return (
    <Card className="border-white/15 bg-black/60 p-6 text-center">
      <CardHeader className="items-center">
        <CardTitle>現在通話中ではありません</CardTitle>
        <CardDescription className="text-white/70">
          通話が確立されると自動でこの画面に切り替わります。
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Button onClick={onBack} className="rounded-2xl" variant="secondary">
          待機画面へ戻る
        </Button>
      </CardFooter>
    </Card>
  )
}

function ActiveCallSkeleton() {
  return (
    <Card className="border-white/15 bg-black/60 p-6">
      <div className="space-y-4 animate-pulse">
        <div className="mx-auto h-28 w-28 rounded-full bg-white/10" />
        <div className="h-6 w-1/2 rounded-full bg-white/10" />
        <div className="h-4 w-3/4 rounded-full bg-white/10" />
        <div className="h-12 w-full rounded-2xl bg-white/10" />
        <div className="h-20 w-full rounded-2xl bg-white/10" />
      </div>
    </Card>
  )
}

function ConnectionIndicator({
  quality,
}: {
  quality?: OtomoConnectionQuality
}) {
  if (!quality) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
        <span className="h-2 w-2 rounded-full bg-white/30" aria-hidden />
        未接続
      </div>
    )
  }
  const meta = CONNECTION_META[quality]
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </div>
  )
}

function EndCallDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => void
  isProcessing: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>通話を終了しますか？</DialogTitle>
          <DialogDescription>
            相手との接続が切れ、通話時間の計測が停止します。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-2xl"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? '終了しています...' : '終了する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const formatDuration = (seconds: number) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

const getElapsedSeconds = (startedAt?: string | null) => {
  if (!startedAt) return 0
  const startMs = new Date(startedAt).getTime()
  if (!Number.isFinite(startMs)) return 0
  return Math.max(0, Math.round((Date.now() - startMs) / 1000))
}
