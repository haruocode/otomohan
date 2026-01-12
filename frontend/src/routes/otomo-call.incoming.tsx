import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, PhoneIncoming, PhoneOff, ShieldAlert, Star } from 'lucide-react'

import type { IncomingCall } from '@/lib/api'
import {
  acceptIncomingCall,
  fetchIncomingCall,
  rejectIncomingCall,
} from '@/lib/api'
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

export const Route = createFileRoute('/otomo-call/incoming')({
  component: IncomingCallScreen,
})

function IncomingCallScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const callQuery = useQuery({
    queryKey: ['otomo-incoming-call'],
    queryFn: fetchIncomingCall,
    refetchInterval: 5_000,
  })

  const activeCall = callQuery.data?.call ?? null

  const [remainingSec, setRemainingSec] = useState(() =>
    getRemainingSeconds(activeCall),
  )

  useEffect(() => {
    setRemainingSec(getRemainingSeconds(activeCall))
    if (!activeCall) {
      return undefined
    }
    const interval = setInterval(() => {
      setRemainingSec((seconds) => Math.max(0, seconds - 1))
    }, 1_000)
    return () => clearInterval(interval)
  }, [activeCall?.callId])

  useEffect(() => {
    if (!activeCall && callQuery.isSuccess) {
      const timeout = setTimeout(() => {
        router.navigate({ to: '/otomo-home' })
      }, 2_000)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [activeCall, callQuery.isSuccess, router])

  const acceptMutation = useMutation({
    mutationFn: (callId: string) => acceptIncomingCall(callId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otomo-incoming-call'] })
      queryClient.invalidateQueries({ queryKey: ['otomo-active-call'] })
      queryClient.invalidateQueries({ queryKey: ['otomo-self'] })
      queryClient.setQueryData(['otomo-call-summary'], { summary: null })
      router.navigate({ to: '/otomo-call/active' })
    },
    onError: (error: unknown) => {
      setActionError(
        error instanceof Error ? error.message : '応答に失敗しました。',
      )
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (callId: string) => rejectIncomingCall(callId, 'busy'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otomo-incoming-call'] })
      queryClient.invalidateQueries({ queryKey: ['otomo-active-call'] })
      queryClient.invalidateQueries({ queryKey: ['otomo-self'] })
      queryClient.setQueryData(['otomo-call-summary'], { summary: null })
      router.navigate({ to: '/otomo-home' })
    },
    onError: (error: unknown) => {
      setActionError(
        error instanceof Error ? error.message : '拒否に失敗しました。',
      )
    },
  })

  const isLoading = callQuery.isLoading
  const isIdle = !activeCall && !isLoading

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.35),_transparent_65%)]" />
      </div>
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-12">
        {isLoading && <IncomingCallSkeleton />}

        {!isLoading && activeCall && (
          <IncomingCallCard
            call={activeCall}
            remainingSec={remainingSec}
            onAccept={() => {
              setActionError(null)
              acceptMutation.mutate(activeCall.callId)
            }}
            onReject={() => {
              setActionError(null)
              rejectMutation.mutate(activeCall.callId)
            }}
            isAccepting={acceptMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        )}

        {isIdle && (
          <IdleState onBack={() => router.navigate({ to: '/otomo-home' })} />
        )}

        {actionError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-rose-200">
            <ShieldAlert className="h-4 w-4" />
            {actionError}
          </div>
        )}
      </main>
    </div>
  )
}

function IncomingCallCard({
  call,
  remainingSec,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: {
  call: IncomingCall
  remainingSec: number
  onAccept: () => void
  onReject: () => void
  isAccepting: boolean
  isRejecting: boolean
}) {
  const deadlineLabel = useMemo(() => {
    const requested = new Date(call.requestedAt)
    return requested.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [call.requestedAt])

  const initials = useMemo(
    () => call.user.name.slice(0, 2).toUpperCase(),
    [call.user.name],
  )

  return (
    <Card className="w-full border-white/20 bg-black/60 p-6 text-center backdrop-blur-xl">
      <CardHeader className="items-center gap-2 text-center">
        <Avatar className="h-28 w-28 border-4 border-white/20">
          <AvatarImage src={call.user.avatarUrl} alt={call.user.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle className="mt-4 text-2xl">
          {call.user.name} さんから着信中…
        </CardTitle>
        <CardDescription className="text-white/70">
          リクエスト受信時刻 {deadlineLabel}
        </CardDescription>
        <div className="text-sm text-white/70">
          <Clock className="mr-1 inline-block h-4 w-4" /> 残り {remainingSec}{' '}
          秒で自動拒否
        </div>
        {call.badges && call.badges.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {call.badges.map((badge) => (
              <Badge key={badge} variant="default" className="bg-white/15">
                <Star className="mr-1 h-3 w-3" />
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {call.note && (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            {call.note}
          </p>
        )}
        <p className="text-sm text-white/70">
          通話開始には {call.ratePerMinute.toLocaleString('ja-JP')} pt/分
          がユーザーに課金されます。
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full rounded-2xl bg-emerald-400 text-slate-900 hover:bg-emerald-300"
          onClick={onAccept}
          disabled={isAccepting || isRejecting}
        >
          {isAccepting ? (
            <>
              <PhoneIncoming className="mr-2 h-4 w-4 animate-pulse" />
              接続中...
            </>
          ) : (
            <>
              <PhoneIncoming className="mr-2 h-4 w-4" />
              応答する
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="destructive"
          className="w-full rounded-2xl"
          onClick={onReject}
          disabled={isAccepting || isRejecting}
        >
          {isRejecting ? (
            <>
              <PhoneOff className="mr-2 h-4 w-4 animate-pulse" />
              処理中...
            </>
          ) : (
            <>
              <PhoneOff className="mr-2 h-4 w-4" />
              拒否する
            </>
          )}
        </Button>
        <p className="text-xs text-white/60">
          応答しない場合は 30 秒後に自動で拒否されます。
        </p>
      </CardFooter>
    </Card>
  )
}

function IdleState({ onBack }: { onBack: () => void }) {
  return (
    <Card className="w-full border-white/20 bg-black/50 p-6 text-center backdrop-blur-xl">
      <CardHeader className="items-center">
        <CardTitle>現在着信はありません</CardTitle>
        <CardDescription className="text-white/70">
          新しいリクエストが届くと自動でこの画面に切り替わります。
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

function IncomingCallSkeleton() {
  return (
    <Card className="w-full border-white/20 bg-black/50 p-6 text-center">
      <CardHeader>
        <div className="mx-auto h-28 w-28 rounded-full bg-white/10" />
        <div className="mt-4 h-6 w-3/4 rounded-full bg-white/10" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full rounded-full bg-white/10" />
        <div className="h-4 w-5/6 rounded-full bg-white/10" />
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="h-12 w-full rounded-2xl bg-white/10" />
        <div className="h-12 w-full rounded-2xl bg-white/10" />
      </CardFooter>
    </Card>
  )
}

const getRemainingSeconds = (call: IncomingCall | null) => {
  if (!call) return 0
  const expiresAtMs = new Date(call.expiresAt).getTime()
  if (!Number.isFinite(expiresAtMs)) return 0
  return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000))
}
