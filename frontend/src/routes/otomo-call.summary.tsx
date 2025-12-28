import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Clock, History, Loader2 } from 'lucide-react'

import type { OtomoCallSummary } from '@/lib/api'
import { fetchOtomoCallSummary, updateOtomoCallMemo } from '@/lib/api'
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

const REASON_LABELS: Record<string, string> = {
  user_end: 'ユーザーが通話を終了しました',
  otomo_end: 'おともはんが通話を終了しました',
  network_lost: '通信状態が不安定なため切断されました',
  app_closed: '相手がアプリを終了しました',
  default: '通話が終了しました',
}

export const Route = createFileRoute('/otomo-call/summary')({
  component: OtomoCallSummaryScreen,
})

function OtomoCallSummaryScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [memo, setMemo] = useState('')
  const [lastSavedMemo, setLastSavedMemo] = useState('')
  const [memoError, setMemoError] = useState<string | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['otomo-call-summary'],
    queryFn: fetchOtomoCallSummary,
    staleTime: 5_000,
  })

  const summary = summaryQuery.data?.summary ?? null

  useEffect(() => {
    if (!summary) return
    const nextMemo = summary.memo ?? ''
    setMemo(nextMemo)
    setLastSavedMemo(nextMemo)
  }, [summary])

  const memoMutation = useMutation({
    mutationFn: ({ callId, body }: { callId: string; body: string }) =>
      updateOtomoCallMemo(callId, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(['otomo-call-summary'], {
        summary: updated,
      })
      setLastSavedMemo(updated.memo ?? '')
      setMemoError(null)
    },
    onError: (error: unknown) => {
      setMemoError(
        error instanceof Error ? error.message : 'メモを保存できませんでした',
      )
    },
  })

  useEffect(() => {
    if (!summary) return
    if (memo === lastSavedMemo) return
    const handle = setTimeout(() => {
      memoMutation.mutate({ callId: summary.callId, body: memo })
    }, 800)
    return () => clearTimeout(handle)
  }, [memo, lastSavedMemo, summary, memoMutation])

  const isLoading = summaryQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <p className="text-xl font-semibold">表示できる通話がありません。</p>
        <p className="mt-2 text-sm text-white/70">
          通話を終了すると自動的にサマリーが表示されます。
        </p>
        <Button
          className="mt-6 rounded-2xl"
          onClick={() => router.navigate({ to: '/otomo-home' })}
        >
          待機画面へ戻る
        </Button>
      </div>
    )
  }

  const reasonLabel = REASON_LABELS[summary.reason] ?? REASON_LABELS.default
  const summaryMeta = useMemo(() => buildSummaryMeta(summary), [summary])

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.3),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.3),_transparent_60%)]" />
      </div>
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 pb-12 pt-10">
        <header className="text-center">
          <p className="text-xs text-white/60">画面ID O-04 / 通話終了</p>
          <h1 className="mt-2 text-3xl font-semibold">通話が終了しました</h1>
          <p className="mt-2 text-sm text-white/70">
            {summary.user.name} さんとの通話が終了しました
          </p>
        </header>

        <SummaryHero summary={summary} reasonLabel={reasonLabel} />

        <div className="grid gap-4 lg:grid-cols-2">
          <CallInfoCard meta={summaryMeta} />
          <RewardCard
            reward={summary.reward}
            billedMinutes={summary.billedMinutes}
          />
        </div>

        <MemoSection
          memo={memo}
          onChange={setMemo}
          isSaving={memoMutation.isPending}
          hasUnsavedChanges={memo !== lastSavedMemo}
          error={memoError}
        />

        <FooterActions
          onGoHome={() => router.navigate({ to: '/otomo-home' })}
          onViewHistory={() => router.navigate({ to: '/history' })}
        />
      </main>
    </div>
  )
}

function SummaryHero({
  summary,
  reasonLabel,
}: {
  summary: OtomoCallSummary
  reasonLabel: string
}) {
  const initials = useMemo(
    () => summary.user.name.slice(0, 2).toUpperCase(),
    [summary.user.name],
  )

  return (
    <Card className="border-white/15 bg-black/60 p-6 text-center backdrop-blur-xl">
      <CardHeader className="items-center">
        <Avatar className="h-28 w-28 border-4 border-white/20">
          <AvatarImage src={summary.user.avatarUrl} alt={summary.user.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle className="mt-4 text-2xl">
          {summary.user.name} さん
        </CardTitle>
        <CardDescription className="text-white/70">
          {reasonLabel}
        </CardDescription>
        <Badge className="mt-3 rounded-full bg-white/10 text-white">
          <Clock className="mr-1 h-4 w-4" /> 通話時間{' '}
          {formatDuration(summary.durationSeconds)}
        </Badge>
      </CardHeader>
    </Card>
  )
}

function CallInfoCard({ meta }: { meta: ReturnType<typeof buildSummaryMeta> }) {
  return (
    <Card className="border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
      <CardHeader>
        <CardTitle>通話情報</CardTitle>
        <CardDescription className="text-white/70">
          日時と接続ステータス
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <InfoRow label="通話日" value={meta.callDate} />
        <InfoRow label="通話時間" value={meta.duration} />
        <InfoRow label="接続開始" value={meta.startTime} />
        <InfoRow label="接続終了" value={meta.endTime} />
      </CardContent>
    </Card>
  )
}

function RewardCard({
  reward,
  billedMinutes,
}: {
  reward: OtomoCallSummary['reward']
  billedMinutes: number
}) {
  return (
    <Card className="border-white/15 bg-black/60">
      <CardHeader>
        <CardTitle>報酬サマリー</CardTitle>
        <CardDescription className="text-white/70">
          今回の通話で獲得したポイント
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">今回の報酬</p>
          <p className="text-3xl font-semibold text-white">
            {reward.earnedPoints.toLocaleString('ja-JP')} pt
          </p>
          <p className="text-xs text-white/60">
            レート {reward.ratePerMinute.toLocaleString('ja-JP')} pt/分 ×
            {billedMinutes.toLocaleString('ja-JP')} 分
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">累計報酬</p>
          <p className="text-2xl font-semibold text-white">
            {reward.totalPoints.toLocaleString('ja-JP')} pt
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function MemoSection({
  memo,
  onChange,
  isSaving,
  hasUnsavedChanges,
  error,
}: {
  memo: string
  onChange: (value: string) => void
  isSaving: boolean
  hasUnsavedChanges: boolean
  error: string | null
}) {
  return (
    <Card className="border-white/15 bg-black/60">
      <CardHeader>
        <CardTitle>通話メモ（任意）</CardTitle>
        <CardDescription className="text-white/70">
          次回の対応向けにメモを残せます。入力は自動保存されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <textarea
          className="min-h-[140px] w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-rose-400 focus:outline-none"
          value={memo}
          onChange={(event) => onChange(event.target.value)}
          placeholder="今回の会話内容や次回へのメモを入力"
          aria-label="通話メモ"
        />
        <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
          {isSaving || hasUnsavedChanges ? (
            <span>{isSaving ? '保存中...' : '自動保存を待機中...'}</span>
          ) : (
            <span>保存済み</span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-rose-300">
              <AlertCircle className="h-3 w-3" /> {error}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function FooterActions({
  onGoHome,
  onViewHistory,
}: {
  onGoHome: () => void
  onViewHistory: () => void
}) {
  return (
    <Card className="border-white/10 bg-white/5 p-4">
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-base font-semibold text-white shadow-lg shadow-sky-900/30"
          onClick={onGoHome}
        >
          待機画面に戻る
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-2xl border border-white/20 text-white"
          onClick={onViewHistory}
        >
          <History className="mr-2 h-4 w-4" /> 通話履歴を見る
        </Button>
      </CardFooter>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  )
}

const buildSummaryMeta = (summary: OtomoCallSummary) => {
  const started = new Date(summary.startedAt)
  const ended = new Date(summary.endedAt)
  return {
    callDate: started.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    duration: formatDuration(summary.durationSeconds),
    startTime: started.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    endTime: ended.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

const formatDuration = (seconds: number) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}分${ss}秒`
}
