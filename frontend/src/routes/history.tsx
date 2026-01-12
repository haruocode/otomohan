import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  History as HistoryIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import type { CallHistoryEntry } from '@/lib/api'
import { fetchCallHistory } from '@/lib/api'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

const HISTORY_FILTERS = [
  { id: 'all', label: 'すべて' },
  { id: 'this-month', label: '今月' },
  { id: 'three-months', label: '過去3ヶ月' },
  { id: 'cancelled', label: '未接続' },
] as const

type HistoryFilter = (typeof HISTORY_FILTERS)[number]['id']

const isHistoryFilter = (value: string): value is HistoryFilter =>
  HISTORY_FILTERS.some((filter) => filter.id === value)

export const Route = createFileRoute('/history')({
  component: CallHistoryScreen,
})

function CallHistoryScreen() {
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const historyQuery = useQuery({
    queryKey: ['call-history'],
    queryFn: () => fetchCallHistory(),
    staleTime: 30_000,
  })
  const isLoading = historyQuery.status === 'pending'
  const isError = historyQuery.status === 'error'

  const entries: CallHistoryEntry[] = historyQuery.data ?? []
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const targetA = a.endedAt ?? a.startedAt
      const targetB = b.endedAt ?? b.startedAt
      return targetB - targetA
    })
  }, [entries])

  const filteredEntries = useMemo(() => {
    return sortedEntries.filter((entry) => matchesFilter(entry, filter))
  }, [sortedEntries, filter])

  const isEmptyState = !isLoading && !isError && filteredEntries.length === 0

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-500/20 blur-[120px]" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[140px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div className="text-right">
            <p className="text-sm text-white/60">画面ID U-08 / 通話履歴一覧</p>
            <h1 className="text-2xl font-semibold text-white">通話履歴</h1>
          </div>
        </header>

        <OverviewCard totalCount={entries.length} />

        <Tabs
          value={filter}
          onValueChange={(value) => {
            if (isHistoryFilter(value)) {
              setFilter(value)
            }
          }}
        >
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-lg">フィルター</CardTitle>
                <CardDescription className="text-white/70">
                  期間や未接続の履歴を素早く切り替え
                </CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="flex max-w-full flex-wrap gap-2 bg-transparent">
                  {HISTORY_FILTERS.map((option) => (
                    <TabsTrigger
                      key={option.id}
                      value={option.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl border border-white/10"
                  onClick={() => historyQuery.refetch()}
                  disabled={historyQuery.isFetching}
                >
                  {historyQuery.isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      更新中
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      最新を取得
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          <TabsContent value={filter} className="outline-none">
            {isLoading && <HistorySkeleton />}

            {isError && (
              <ErrorState
                message="履歴の取得に失敗しました"
                onRetry={() => historyQuery.refetch()}
              />
            )}

            {isEmptyState && <EmptyState />}

            {!isLoading && !isError && filteredEntries.length > 0 && (
              <section className="space-y-4">
                {filteredEntries.map((entry) => (
                  <HistoryCard key={entry.callId} entry={entry} />
                ))}
              </section>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function OverviewCard({ totalCount }: { totalCount: number }) {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <HistoryIcon className="h-5 w-5 text-rose-200" />
          </div>
          <div>
            <CardTitle>透明性のハブ</CardTitle>
            <CardDescription className="text-white/70">
              通話の料金と時間をいつでも再確認
            </CardDescription>
          </div>
        </div>
        <div className="text-right text-sm text-white/80">
          <p>累計履歴</p>
          <p className="text-2xl font-semibold text-white">
            {numberFormatter.format(totalCount)} 件
          </p>
        </div>
      </CardHeader>
    </Card>
  )
}

function HistoryCard({ entry }: { entry: CallHistoryEntry }) {
  const startedAt = new Date(entry.startedAt * 1000)
  const endedAt = entry.endedAt ? new Date(entry.endedAt * 1000) : null
  const isCancelled = entry.durationSec <= 0
  const billedMinutes = isCancelled
    ? 0
    : Math.max(1, Math.ceil(entry.durationSec / 60))
  const dateLabel = dateFormatter.format(startedAt)
  const startTime = timeFormatter.format(startedAt)
  const endTime =
    !isCancelled && endedAt ? timeFormatter.format(endedAt) : '未接続'
  const durationLabel = isCancelled
    ? '未接続（キャンセル）'
    : `通話時間 ${billedMinutes}分`

  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={entry.otomo.avatarUrl} alt={entry.otomo.name} />
            <AvatarFallback>
              {entry.otomo.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white">
                {entry.otomo.name} さん
              </p>
              {isCancelled && (
                <Badge variant="danger" className="text-xs">
                  キャンセル
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/70">
              {dateLabel} {startTime} - {endTime}
            </p>
            <p className="text-sm text-white/80">{durationLabel}</p>
            <p className="text-sm font-semibold text-white">
              消費ポイント：{numberFormatter.format(entry.totalCharged)} pt
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-2xl border border-white/10"
            asChild
          >
            <Link to="/history/$callId" params={{ callId: entry.callId }}>
              詳細を見る
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function HistorySkeleton() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="text-white">読み込み中</CardTitle>
        <CardDescription className="text-white/70">
          通話履歴を取得しています
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-24 rounded-2xl" />
          </div>
        ))}
      </CardContent>
    </Card>
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
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertCircle className="h-4 w-4" />
          エラー
        </CardTitle>
        <CardDescription className="text-rose-100">{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry} variant="destructive" className="rounded-2xl">
          <RefreshCw className="mr-2 h-4 w-4" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border-white/10 bg-white/5 text-center">
      <CardHeader>
        <CardTitle>まだ通話履歴がありません</CardTitle>
        <CardDescription className="text-white/70">
          通話をするとここに履歴が表示されます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          className="rounded-2xl bg-white text-slate-900 hover:bg-white/90"
        >
          <Link to="/">
            <CalendarClock className="mr-2 h-4 w-4" />
            おともはん一覧へ
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function matchesFilter(entry: CallHistoryEntry, filter: HistoryFilter) {
  const startedAtMs = entry.startedAt * 1000
  const startedDate = new Date(startedAtMs)

  switch (filter) {
    case 'all':
      return true
    case 'cancelled':
      return entry.durationSec <= 0
    case 'this-month': {
      const now = new Date()
      return (
        startedDate.getFullYear() === now.getFullYear() &&
        startedDate.getMonth() === now.getMonth()
      )
    }
    case 'three-months':
    default: {
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
      return Date.now() - startedAtMs <= ninetyDaysMs
    }
  }
}
