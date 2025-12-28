import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarRange,
  Clock4,
  Loader2,
  PhoneCall,
  Repeat2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type {
  OtomoStatsCallEntry,
  OtomoStatsDailyPoint,
  OtomoStatsHourlyPoint,
  OtomoStatsRange,
  OtomoStatsRepeatStats,
  OtomoStatsSummaryResult,
} from '@/lib/api'
import {
  fetchOtomoStatsCalls,
  fetchOtomoStatsDaily,
  fetchOtomoStatsHourly,
  fetchOtomoStatsRepeat,
  fetchOtomoStatsSummary,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const RANGE_OPTIONS: Array<{ id: OtomoStatsRange; label: string }> = [
  { id: 'today', label: '本日' },
  { id: 'week', label: '今週' },
  { id: 'month', label: '今月' },
  { id: 'all', label: '全期間' },
]

const DEFAULT_RANGE: OtomoStatsRange = 'week'

export const Route = createFileRoute('/otomo-dashboard/revenue')({
  component: RevenueDashboardScreen,
})

function RevenueDashboardScreen() {
  const router = useRouter()
  const [range, setRange] = useState<OtomoStatsRange>(DEFAULT_RANGE)

  const summaryQuery = useQuery({
    queryKey: ['otomo-stats-summary', range],
    queryFn: () => fetchOtomoStatsSummary(range),
    staleTime: 30_000,
  })

  const dailyQuery = useQuery({
    queryKey: ['otomo-stats-daily', range],
    queryFn: () => fetchOtomoStatsDaily(range),
    staleTime: 30_000,
  })

  const hourlyQuery = useQuery({
    queryKey: ['otomo-stats-hourly', range],
    queryFn: () => fetchOtomoStatsHourly(range),
    staleTime: 30_000,
  })

  const callsQuery = useQuery({
    queryKey: ['otomo-stats-calls', range],
    queryFn: () => fetchOtomoStatsCalls({ range, limit: 6 }),
    staleTime: 30_000,
  })

  const repeatQuery = useQuery({
    queryKey: ['otomo-stats-repeat', range],
    queryFn: () => fetchOtomoStatsRepeat(range),
    staleTime: 30_000,
  })

  const isLoading =
    summaryQuery.isLoading ||
    dailyQuery.isLoading ||
    hourlyQuery.isLoading ||
    callsQuery.isLoading ||
    repeatQuery.isLoading

  const hasError =
    summaryQuery.isError ||
    dailyQuery.isError ||
    hourlyQuery.isError ||
    callsQuery.isError ||
    repeatQuery.isError

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (hasError || !summaryQuery.data) {
    return (
      <ErrorState
        message="収益データの取得に失敗しました。リロードしてください。"
        onRetry={() => {
          summaryQuery.refetch()
          dailyQuery.refetch()
          hourlyQuery.refetch()
          callsQuery.refetch()
          repeatQuery.refetch()
        }}
      />
    )
  }

  const summary = summaryQuery.data
  const dailyData = dailyQuery.data ?? []
  const trendData = useMemo(() => dailyData.slice(-8), [dailyData])
  const hourlyData = hourlyQuery.data ?? []
  const calls = callsQuery.data ?? []
  const repeatStats = repeatQuery.data ?? null

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.25),_transparent_60%)]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-8">
        <DashboardHeader
          onBack={() => router.navigate({ to: '/otomo-home' })}
        />
        <RangePicker current={range} onChange={setRange} />
        <KpiSection summary={summary} />
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <RevenueTrend data={trendData} />
          <RepeatStatsCard stats={repeatStats} summary={summary} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <HourlyHeatMap data={hourlyData} />
          <CallList data={calls} />
        </div>
        <DisclaimerNotice />
      </main>
    </div>
  )
}

function DashboardHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl border-white/30 text-white"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
      </Button>
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-white/60">
          画面ID O-05 / 収益アナリティクス
        </p>
        <h1 className="mt-2 text-2xl font-semibold">収益ダッシュボード</h1>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="rounded-2xl border border-white/10 text-white"
      >
        <CalendarRange className="mr-2 h-4 w-4" /> カスタム期間
      </Button>
    </header>
  )
}

function RangePicker({
  current,
  onChange,
}: {
  current: OtomoStatsRange
  onChange: (value: OtomoStatsRange) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {RANGE_OPTIONS.map((option) => {
        const isActive = current === option.id
        return (
          <Button
            key={option.id}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            className={`rounded-2xl border ${
              isActive
                ? 'border-white bg-white/95 text-slate-900'
                : 'border-white/20 text-white'
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}

function KpiSection({ summary }: { summary: OtomoStatsSummaryResult }) {
  const items = [
    {
      label: '総収益',
      value: `${summary.summary.totalRevenue.toLocaleString('ja-JP')} pt`,
      helper: '期間内ポイント',
      icon: Sparkles,
      delta: summary.summary.trend.revenue,
    },
    {
      label: '通話時間合計',
      value: `${summary.summary.totalMinutes.toLocaleString('ja-JP')} 分`,
      helper: '接続中の分数',
      icon: Clock4,
      delta: summary.summary.trend.minutes,
    },
    {
      label: '平均通話時間',
      value: `${summary.summary.averageMinutes.toFixed(1)} 分`,
      helper: '1通話あたり',
      icon: PhoneCall,
      delta: 0,
    },
    {
      label: 'リピート率',
      value: `${Math.round(summary.summary.repeatRate * 100)}%`,
      helper: '常連ユーザー比率',
      icon: Repeat2,
      delta: summary.summary.trend.repeatRate,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card
          key={item.label}
          className="border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-white/70">
                {item.label}
              </CardTitle>
              <p className="mt-2 text-3xl font-semibold text-white">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-white/60">{item.helper}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <item.icon className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          {item.delta ? (
            <CardContent className="flex items-center gap-2 text-xs text-emerald-300">
              <TrendingUp className="h-3 w-3" /> 前期間比 +
              {Math.round(item.delta * 100)}%
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

function RevenueTrend({ data }: { data: Array<OtomoStatsDailyPoint> }) {
  const maxValue = useMemo(
    () => data.reduce((max, point) => Math.max(max, point.points), 0),
    [data],
  )

  return (
    <Card className="border-white/10 bg-black/60">
      <CardHeader>
        <CardTitle>収益推移</CardTitle>
        <CardDescription className="text-white/70">
          日別ポイントのトレンド
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-white/60">データがありません。</p>
        ) : (
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            {data.map((point) => {
              const height = maxValue
                ? Math.max(6, (point.points / maxValue) * 100)
                : 0
              return (
                <div
                  key={point.date}
                  className="flex min-w-[48px] flex-col items-center gap-2"
                >
                  <div className="flex h-40 w-10 items-end rounded-full bg-white/10">
                    <div
                      className="w-full rounded-full bg-gradient-to-b from-rose-400 to-sky-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/60">
                    {formatShortDate(point.date)}
                  </p>
                  <p className="text-xs font-semibold">
                    {point.points.toLocaleString('ja-JP')} pt
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HourlyHeatMap({ data }: { data: Array<OtomoStatsHourlyPoint> }) {
  const maxCount = useMemo(
    () => data.reduce((max, point) => Math.max(max, point.callCount), 0),
    [data],
  )

  return (
    <Card className="border-white/10 bg-black/50">
      <CardHeader>
        <CardTitle>時間帯ヒートマップ</CardTitle>
        <CardDescription className="text-white/70">
          稼ぎやすい時間帯を把握
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {data.map((point) => {
          const intensity = maxCount ? point.callCount / maxCount : 0
          return (
            <div
              key={point.hour}
              className="rounded-2xl border border-white/10 p-3 text-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(56,189,248,' +
                  (0.2 + intensity * 0.6) +
                  '), rgba(236,72,153,' +
                  (0.15 + intensity * 0.5) +
                  '))',
              }}
            >
              <p className="text-xs text-white/70">{point.hour} 時</p>
              <p className="text-lg font-semibold">
                {point.callCount.toLocaleString('ja-JP')}
              </p>
              <p className="text-[11px] text-white/70">通話</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CallList({ data }: { data: Array<OtomoStatsCallEntry> }) {
  return (
    <Card className="border-white/10 bg-black/50">
      <CardHeader>
        <CardTitle>期間内の通話</CardTitle>
        <CardDescription className="text-white/70">
          最新の通話実績
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-white/60">通話履歴がありません。</p>
        ) : (
          data.map((call) => (
            <div
              key={call.callId}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{call.userName} さん</p>
                <p className="text-xs text-white/60">
                  {formatTime(call.startedAt)} / {call.durationMinutes}分
                </p>
              </div>
              <Badge className="rounded-full bg-white/90 text-slate-900">
                +{call.earnedPoints.toLocaleString('ja-JP')} pt
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function RepeatStatsCard({
  stats,
  summary,
}: {
  stats: OtomoStatsRepeatStats | null
  summary: OtomoStatsSummaryResult
}) {
  return (
    <Card className="border-white/10 bg-black/60">
      <CardHeader>
        <CardTitle>リピートユーザー</CardTitle>
        <CardDescription className="text-white/70">
          ファンの定着度をチェック
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats ? (
          <>
            <StatLine
              icon={Users}
              label="リピートユーザー"
              value={`${stats.repeatUsers} 人`}
            />
            <StatLine
              icon={Sparkles}
              label="新規ユーザー"
              value={`${stats.newUsers} 人`}
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">最も話しているユーザー</p>
              <p className="mt-1 text-lg font-semibold">{stats.topUser.name}</p>
              <p className="text-sm text-white/70">
                合計 {stats.topUser.totalMinutes}分 / {stats.topUser.totalCalls}{' '}
                通話
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/60">統計がありません。</p>
        )}
        <div className="rounded-2xl border border-dashed border-white/30 p-4 text-sm text-white/70">
          リピート率 {Math.round(summary.summary.repeatRate * 100)}% ・ 通話数{' '}
          {summary.summary.totalCalls.toLocaleString('ja-JP')} 件
        </div>
      </CardContent>
    </Card>
  )
}

function StatLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/10 p-2">
          <Icon className="h-4 w-4" />
        </div>
        {label}
      </div>
      <span className="text-base font-semibold">{value}</span>
    </div>
  )
}

function DisclaimerNotice() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
      ポイントは参考値です。最終的な報酬は運営の規定に基づき計算されます。
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <p className="text-lg font-semibold">{message}</p>
      <Button
        type="button"
        onClick={onRetry}
        className="rounded-2xl bg-white/90 text-slate-900"
      >
        再読み込み
      </Button>
    </div>
  )
}

const formatShortDate = (value: string) => {
  const date = new Date(value)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
