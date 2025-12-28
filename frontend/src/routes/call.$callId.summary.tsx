import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpenCheck, Home, List, Wallet } from 'lucide-react'

import type { CallEndReason, CallSession } from '@/lib/api'
import { fetchCallSession } from '@/lib/api'
import { getCallEndReasonMeta } from '@/lib/call-status'
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

const isCallEndReason = (value: unknown): value is CallEndReason =>
  typeof value === 'string' &&
  [
    'user_end',
    'otomo_end',
    'no_point',
    'network_lost',
    'timeout',
    'system_error',
  ].includes(value)

export const Route = createFileRoute('/call/$callId/summary')({
  component: CallSummaryScreen,
  validateSearch: (search: Record<string, unknown>) => ({
    reason: isCallEndReason(search.reason) ? search.reason : undefined,
  }),
})

function CallSummaryScreen() {
  const { callId } = Route.useParams()
  const { reason: reasonFromSearch } = Route.useSearch()
  const callQuery = useQuery({
    queryKey: ['call-session', callId, 'summary'],
    queryFn: () => fetchCallSession(callId),
    staleTime: 0,
  })

  const summary = callQuery.data
  const derivedReason = summary?.reason ?? reasonFromSearch
  const reasonMeta = getCallEndReasonMeta(derivedReason)

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-20 top-0 h-64 w-64 rounded-full bg-rose-500/30 blur-[110px]" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-blue-500/30 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6">
        <header className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white/80"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ホームへ戻る
            </Link>
          </Button>
          <div className="text-right text-sm text-white/60">
            <p>画面ID U-05 / 通話サマリー</p>
            <p className="text-xs">Call ID: {callId}</p>
          </div>
        </header>

        {callQuery.isLoading && <SummarySkeleton />}

        {callQuery.isError && <ErrorCard onRetry={() => callQuery.refetch()} />}

        {!callQuery.isLoading && !callQuery.isError && summary && (
          <>
            <SummaryHero summary={summary} reasonMeta={reasonMeta} />
            <SummaryStats summary={summary} />
            {summary.billingUnits && summary.billingUnits.length > 0 && (
              <BillingBreakdown
                units={summary.billingUnits}
                pricePerMinute={summary.pricePerMinute}
              />
            )}
            <ActionButtons callId={summary.id} />
          </>
        )}
      </main>
    </div>
  )
}

function SummaryHero({
  summary,
  reasonMeta,
}: {
  summary: CallSession
  reasonMeta: ReturnType<typeof getCallEndReasonMeta>
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="flex flex-col gap-4 p-6 text-center">
        <Avatar className="mx-auto h-24 w-24 rounded-full border-4 border-white/10">
          <AvatarImage
            src={summary.partner.avatarUrl}
            alt={summary.partner.name}
          />
          <AvatarFallback>
            {summary.partner.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm text-white/60">
            {summary.partner.name} さんとの通話が終了しました
          </p>
          <h1 className="text-2xl font-semibold text-white">
            通話が終了しました
          </h1>
        </div>
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm',
            toneToClasses(reasonMeta.tone),
          )}
        >
          <p className="font-semibold">{reasonMeta.title}</p>
          <p className="text-white/70">{reasonMeta.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryStats({ summary }: { summary: CallSession }) {
  const totalSeconds = summary.totalSeconds ?? 0
  const totalCharged = summary.totalCharged ?? summary.pricePerMinute
  const unitCount = summary.unitCount ?? Math.ceil(totalSeconds / 60)

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>通話サマリー</CardTitle>
        <CardDescription className="text-white/70">
          課金と残高の状況を確認できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs uppercase tracking-wide text-white/60">
              通話時間
            </dt>
            <dd className="text-2xl font-mono">
              {formatDuration(totalSeconds)}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs uppercase tracking-wide text-white/60">
              課金ポイント
            </dt>
            <dd className="text-2xl font-semibold">
              {numberFormatter.format(totalCharged)} pt
            </dd>
            <p className="text-xs text-white/60">
              {numberFormatter.format(summary.pricePerMinute)} pt × {unitCount}{' '}
              分
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <dt className="text-xs uppercase tracking-wide text-white/60">
              残ポイント
            </dt>
            <dd className="text-2xl font-semibold">
              {numberFormatter.format(summary.balance)} pt
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function BillingBreakdown({
  units,
  pricePerMinute,
}: {
  units: NonNullable<CallSession['billingUnits']>
  pricePerMinute: number
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>課金明細</CardTitle>
        <CardDescription className="text-white/70">
          1 分ごとの課金履歴
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-white/10 text-sm">
          {units.map((unit) => (
            <div
              key={unit.unitIndex}
              className="flex items-center justify-between py-2"
            >
              <span>第 {unit.unitIndex} 分</span>
              <span className="font-semibold">
                {numberFormatter.format(unit.charged)} pt
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButtons({ callId }: { callId: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        asChild
        className="rounded-2xl bg-white text-slate-900 hover:bg-white/90"
      >
        <Link to="/wallet">
          <Wallet className="mr-2 h-4 w-4" />
          ウォレットを確認
        </Link>
      </Button>
      <Button
        asChild
        className="rounded-2xl bg-white/90 text-slate-900 hover:bg-white"
      >
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          ホームに戻る
        </Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="rounded-2xl border-white/30 text-white hover:bg-white/10"
      >
        <Link to="/history/$callId" params={{ callId }}>
          <List className="mr-2 h-4 w-4" />
          この通話の詳細を見る
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="rounded-2xl border border-dashed border-white/20 text-white/70 hover:text-white"
        disabled
      >
        <BookOpenCheck className="mr-2 h-4 w-4" />
        レビューを書く（近日公開）
      </Button>
    </div>
  )
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-500/40 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-white">
          通話履歴の取得に失敗しました
        </CardTitle>
        <CardDescription className="text-rose-100">
          ネットワークをご確認のうえ、再度お試しください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onRetry} className="rounded-2xl">
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function SummarySkeleton() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-6 w-48" />
        <Skeleton className="h-20 rounded-2xl" />
      </CardContent>
    </Card>
  )
}

const toneToClasses = (
  tone: ReturnType<typeof getCallEndReasonMeta>['tone'],
) => {
  switch (tone) {
    case 'warning':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-50'
    case 'danger':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-50'
    default:
      return 'border-blue-400/30 bg-blue-400/10 text-blue-50'
  }
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) {
    return '00:00'
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60
  const segments = [hrs, remainingMins, secs]
    .map((segment) => String(segment).padStart(2, '0'))
    .join(':')
  return segments
}
