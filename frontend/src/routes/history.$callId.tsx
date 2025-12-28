import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Home,
  List,
  Wallet,
} from 'lucide-react'

import type { CallSession } from '@/lib/api'
import { fetchCallSession } from '@/lib/api'
import { getCallEndReasonMeta } from '@/lib/call-status'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit',
  minute: '2-digit',
})

export const Route = createFileRoute('/history/$callId')({
  component: HistoryDetailScreen,
})

function HistoryDetailScreen() {
  const { callId } = Route.useParams()
  const callQuery = useQuery({
    queryKey: ['call-session', callId, 'history-detail'],
    queryFn: () => fetchCallSession(callId),
    staleTime: 0,
  })

  const session = callQuery.data ?? null

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-500/20 blur-[120px]" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[140px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 pt-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white"
          >
            <Link to="/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              履歴一覧に戻る
            </Link>
          </Button>
          <div className="text-right text-sm text-white/60">
            <p>画面ID U-09 / 通話履歴詳細</p>
            <p className="text-xs">Call ID: {callId}</p>
          </div>
        </header>

        {callQuery.isLoading && <DetailSkeleton />}

        {callQuery.isError && (
          <ErrorState
            message="通話履歴の取得に失敗しました"
            onRetry={() => callQuery.refetch()}
          />
        )}

        {!callQuery.isLoading && !callQuery.isError && !session && (
          <NotFoundState />
        )}

        {session && (
          <>
            <HeroSection session={session} />
            <CallSummaryCard session={session} />
            <StatsGrid session={session} />
            <BillingDetails
              units={session.billingUnits}
              totalCharged={session.totalCharged}
              pricePerMinute={session.pricePerMinute}
            />
            <MetaSection session={session} />
            <ActionButtons />
          </>
        )}
      </main>
    </div>
  )
}

function HeroSection({ session }: { session: CallSession }) {
  const reasonMeta = getCallEndReasonMeta(session.reason)
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0">
      <CardContent className="flex flex-col gap-4 p-6 text-center">
        <Avatar className="mx-auto h-24 w-24 rounded-full border-4 border-white/10">
          <AvatarImage
            src={session.partner.avatarUrl}
            alt={session.partner.name}
          />
          <AvatarFallback>
            {session.partner.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm text-white/70">
            {session.partner.name} さんとの通話
          </p>
          <h1 className="text-2xl font-semibold text-white">
            課金詳細と終了理由
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

function CallSummaryCard({ session }: { session: CallSession }) {
  const startedAt = safeDate(session.startedAt)
  const endedAt = safeDate(session.endedAt)
  const dateLabel = startedAt ? dateFormatter.format(startedAt) : '---'
  const startTime = startedAt ? timeFormatter.format(startedAt) : '--:--'
  const endTime = endedAt ? timeFormatter.format(endedAt) : '--:--'
  const durationSeconds = getDurationSeconds(session)
  const durationLabel = formatDurationLabel(durationSeconds)
  const totalCharged = getTotalCharged(session)

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>通話概要</CardTitle>
        <CardDescription className="text-white/70">
          課金トラブル時の証跡として参照できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <SummaryItem label="通話日" value={dateLabel} />
          <SummaryItem label="時間帯" value={`${startTime} - ${endTime}`} />
          <SummaryItem label="通話時間" value={durationLabel} />
          <SummaryItem
            label="消費ポイント"
            value={`${numberFormatter.format(totalCharged)} pt`}
          />
        </dl>
      </CardContent>
    </Card>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <dt className="text-xs uppercase tracking-wide text-white/60">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-white">{value}</dd>
    </div>
  )
}

function StatsGrid({ session }: { session: CallSession }) {
  const durationSeconds = getDurationSeconds(session)
  const totalCharged = getTotalCharged(session)
  const unitCount = getUnitCount(session)
  const balanceLabel =
    typeof session.balance === 'number'
      ? `${numberFormatter.format(session.balance)} pt`
      : '---'

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="累計通話時間"
        value={formatClock(durationSeconds)}
        helper="HH:MM:SS"
      />
      <StatCard
        label="課金ポイント"
        value={`${numberFormatter.format(totalCharged)} pt`}
        helper={`${numberFormatter.format(session.pricePerMinute)} pt / 分 × ${unitCount} 回`}
      />
      <StatCard label="残ポイント" value={balanceLabel} helper="通話終了時" />
    </div>
  )
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
        {helper && <p className="text-xs text-white/60">{helper}</p>}
      </CardContent>
    </Card>
  )
}

function BillingDetails({
  units,
  totalCharged,
  pricePerMinute,
}: {
  units?: CallSession['billingUnits']
  totalCharged?: number
  pricePerMinute: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const effectiveUnits = units ?? []
  const computedTotal = useMemo(() => {
    if (typeof totalCharged === 'number') return totalCharged
    if (effectiveUnits.length > 0) {
      return effectiveUnits.reduce((sum, unit) => sum + unit.charged, 0)
    }
    return pricePerMinute
  }, [effectiveUnits, pricePerMinute, totalCharged])

  if (effectiveUnits.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>課金明細</CardTitle>
          <CardDescription className="text-white/70">
            課金単位の記録がありません
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-white/80">
          <p>
            合計 {numberFormatter.format(computedTotal)} pt を課金しました。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>課金明細</CardTitle>
          <CardDescription className="text-white/70">
            1 分ごとの課金履歴を確認できます
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-2xl border border-white/10"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <>
              閉じる
              <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              詳細を表示
              <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="max-h-64 divide-y divide-white/10 overflow-auto text-sm">
            {effectiveUnits.map((unit) => (
              <div
                key={unit.unitIndex}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium text-white">
                    第 {unit.unitIndex} 分
                  </p>
                  {unit.timestamp && (
                    <p className="text-xs text-white/60">
                      {timeFormatter.format(new Date(unit.timestamp))}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-white">
                  {numberFormatter.format(unit.charged)} pt
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-semibold text-white">
            <span>合計</span>
            <span>{numberFormatter.format(computedTotal)} pt</span>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function MetaSection({ session }: { session: CallSession }) {
  const statusLabel = session.status
  const reasonMeta = getCallEndReasonMeta(session.reason)
  const items = [
    { label: 'callId', value: session.id },
    { label: 'おともはん ID', value: session.partner.id },
    { label: '終了ステータス', value: statusLabel },
    { label: '終了理由', value: reasonMeta.title },
  ]

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>メタ情報</CardTitle>
        <CardDescription className="text-white/70">
          サポート問い合わせ時に共有する識別子
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white/80">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-white/60">{item.label}</span>
            <span className="font-mono text-white">{item.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Badge variant="outline" className="border-white/20 text-white">
            {statusLabel}
          </Badge>
          <span>ステータスは課金ログと同期しています</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButtons() {
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
        <Link to="/history">
          <List className="mr-2 h-4 w-4" />
          通話履歴一覧に戻る
        </Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="rounded-2xl border-white/30 text-white hover:bg-white/10"
      >
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          ホームに戻る
        </Link>
      </Button>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="border-rose-500/40 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertCircle className="h-4 w-4" />
          エラー
        </CardTitle>
        <CardDescription className="text-rose-100">{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button variant="destructive" onClick={onRetry} className="rounded-2xl">
          再読み込み
        </Button>
        <Button
          asChild
          variant="ghost"
          className="rounded-2xl border border-white/20"
        >
          <Link to="/history">一覧に戻る</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function NotFoundState() {
  return (
    <Card className="border-white/10 bg-white/5 text-center">
      <CardHeader>
        <CardTitle>通話履歴が見つかりません</CardTitle>
        <CardDescription className="text-white/70">
          callId が無効か、削除された可能性があります。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild className="rounded-2xl bg-white text-slate-900">
          <Link to="/history">履歴一覧に戻る</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="mx-auto h-24 w-24 rounded-full" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-40" />
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/5">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="border-white/10 bg-white/5 p-4">
            <Skeleton className="h-16 rounded-2xl" />
          </Card>
        ))}
      </div>
    </div>
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

const safeDate = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getDurationSeconds = (session: CallSession) => {
  if (typeof session.totalSeconds === 'number') {
    return session.totalSeconds
  }
  const unitMinutes = session.unitCount ?? session.billingUnits?.length ?? 0
  if (unitMinutes > 0) {
    return unitMinutes * 60
  }
  return 0
}

const getUnitCount = (session: CallSession) => {
  if (typeof session.unitCount === 'number' && session.unitCount > 0) {
    return session.unitCount
  }
  if (session.billingUnits && session.billingUnits.length > 0) {
    return session.billingUnits.length
  }
  if (typeof session.totalSeconds === 'number') {
    return Math.max(1, Math.ceil(session.totalSeconds / 60))
  }
  return 0
}

const getTotalCharged = (session: CallSession) => {
  if (typeof session.totalCharged === 'number') {
    return session.totalCharged
  }
  if (session.billingUnits && session.billingUnits.length > 0) {
    return session.billingUnits.reduce((sum, unit) => sum + unit.charged, 0)
  }
  const inferredUnits = getUnitCount(session)
  return Math.max(1, inferredUnits || 1) * session.pricePerMinute
}

const formatDurationLabel = (seconds: number) => {
  if (!seconds || seconds <= 0) {
    return '00分00秒'
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}分${String(secs).padStart(2, '0')}秒`
}

const formatClock = (seconds: number) => {
  if (!seconds || seconds <= 0) {
    return '00:00:00'
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hrs, mins, secs]
    .map((segment) => String(segment).padStart(2, '0'))
    .join(':')
}
