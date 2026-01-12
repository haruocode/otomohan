import React, { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Filter,
  Loader2,
  MonitorSmartphone,
  PlayCircle,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
} from 'lucide-react'

import type { UseQueryResult } from '@tanstack/react-query'
import type { ChangeEvent, FormEvent } from 'react'

import type {
  AdminActiveCall,
  AdminCallDetail,
  AdminCallListFilters,
  AdminCallStatus,
  AdminCallSummary,
} from '@/lib/api'
import {
  fetchAdminActiveCalls,
  fetchAdminCallDetail,
  fetchAdminCallLogs,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/admin/calls')({
  component: AdminCallsScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const statusLabel: Record<
  AdminCallStatus,
  { label: string; badge: 'success' | 'warning' | 'danger' | 'outline' }
> = {
  normal: { label: '正常終了', badge: 'success' },
  abnormal: { label: '異常切断', badge: 'danger' },
  notConnected: { label: '未接続', badge: 'outline' },
  suspected: { label: '不正疑い', badge: 'warning' },
}

const statusOptions: Array<{ id: AdminCallStatus | 'all'; label: string }> = [
  { id: 'all', label: '状態 - すべて' },
  { id: 'normal', label: statusLabel.normal.label },
  { id: 'abnormal', label: statusLabel.abnormal.label },
  { id: 'notConnected', label: statusLabel.notConnected.label },
  { id: 'suspected', label: statusLabel.suspected.label },
]

const durationOptions = [
  { id: 'all', label: '通話時間 - すべて' },
  { id: 'under1', label: '0〜1分' },
  { id: 'oneToFive', label: '1〜5分' },
  { id: 'overFive', label: '5分以上' },
] as const

const billingOptions = [
  { id: 'all', label: '課金ポイント - すべて' },
  { id: 'under100', label: '0〜100pt' },
  { id: 'oneToFiveHundred', label: '100〜500pt' },
  { id: 'overFiveHundred', label: '500pt以上' },
] as const

type SortFilters = {
  callId: string
  userId: string
  otomoId: string
  startedFrom: string
  startedTo: string
  status: AdminCallStatus | 'all'
  durationBucket: 'under1' | 'oneToFive' | 'overFive' | 'all'
  billingBucket: 'under100' | 'oneToFiveHundred' | 'overFiveHundred' | 'all'
}

const initialFormFilters: SortFilters = {
  callId: '',
  userId: '',
  otomoId: '',
  startedFrom: '',
  startedTo: '',
  status: 'all',
  durationBucket: 'all',
  billingBucket: 'all',
}

type CallHeadlineStats = {
  total: number
  abnormal: number
  suspected: number
  totalPoints: number
  lastUpdated: string
}

function AdminCallsScreen() {
  const [formFilters, setFormFilters] = useState(initialFormFilters)
  const [activeFilters, setActiveFilters] = useState<AdminCallListFilters>(
    buildListFilters(initialFormFilters),
  )
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState('')

  const callQuery = useQuery({
    queryKey: ['admin-calls', activeFilters],
    queryFn: (): Promise<AdminCallSummary[]> =>
      fetchAdminCallLogs(activeFilters),
    placeholderData: (previousData): AdminCallSummary[] | undefined =>
      previousData,
  })

  const activeCallsQuery = useQuery({
    queryKey: ['admin-active-calls'],
    queryFn: (): Promise<AdminActiveCall[]> => fetchAdminActiveCalls(),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  })

  const calls: AdminCallSummary[] = callQuery.data ?? []
  const stats = useMemo<CallHeadlineStats>(() => buildStats(calls), [calls])

  const handleInputChange =
    (field: keyof SortFilters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormFilters((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveFilters(buildListFilters(formFilters))
  }

  const handleReset = () => {
    setFormFilters(initialFormFilters)
    setActiveFilters(buildListFilters(initialFormFilters))
  }

  const handleExport = () => {
    if (!calls.length) {
      setExportMessage('エクスポート対象がありません')
      return
    }
    if (typeof window === 'undefined') {
      setExportMessage('ブラウザからのみエクスポートできます')
      return
    }
    const csv = createCsvFromCalls(calls)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `otomohan-call-logs-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExportMessage(`${calls.length}件の通話ログを出力しました`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-04 / CALL MONITORING
            </p>
            <h1 className="mt-2 text-4xl font-bold">通話ログ / モニタリング</h1>
            <p className="text-sm text-white/70">
              異常切断や課金不整合をリアルタイムに監査し、訴訟対策用の証跡を保全します。
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => callQuery.refetch()}
            disabled={callQuery.isFetching}
          >
            {callQuery.isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                更新中
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                最新に更新
              </>
            )}
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Filter className="h-5 w-5 text-rose-300" />
              通話検索フィルター
            </CardTitle>
            <CardDescription>
              通話ID、期間、状態、課金レンジで絞り込み、異常通話を迅速に抽出します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={formFilters.callId}
                  onChange={handleInputChange('callId')}
                  className={inputBaseClass}
                  placeholder="通話ID (call_xxx)"
                />
                <input
                  value={formFilters.userId}
                  onChange={handleInputChange('userId')}
                  className={inputBaseClass}
                  placeholder="ユーザーID"
                />
                <input
                  value={formFilters.otomoId}
                  onChange={handleInputChange('otomoId')}
                  className={inputBaseClass}
                  placeholder="おともはんID"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <input
                  type="date"
                  value={formFilters.startedFrom}
                  onChange={handleInputChange('startedFrom')}
                  className={inputBaseClass}
                />
                <input
                  type="date"
                  value={formFilters.startedTo}
                  onChange={handleInputChange('startedTo')}
                  className={inputBaseClass}
                />
                <select
                  value={formFilters.status}
                  onChange={handleInputChange('status')}
                  className={inputBaseClass}
                >
                  {statusOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={formFilters.durationBucket}
                  onChange={handleInputChange('durationBucket')}
                  className={inputBaseClass}
                >
                  {durationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <select
                  value={formFilters.billingBucket}
                  onChange={handleInputChange('billingBucket')}
                  className={inputBaseClass}
                >
                  {billingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="rounded-2xl">
                  <Search className="h-4 w-4" />
                  検索
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={handleReset}
                >
                  条件をリセット
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                  検索結果をエクスポート
                </Button>
                {exportMessage && (
                  <span className="text-sm text-white/60">{exportMessage}</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="検索結果"
            value={`${stats.total.toLocaleString()} 件`}
            helper="通話ログ"
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5" />}
            title="異常切断"
            value={`${stats.abnormal.toLocaleString()} 件`}
            helper="要調査"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            title="不正疑い"
            value={`${stats.suspected.toLocaleString()} 件`}
            helper="自動検知"
          />
          <StatCard
            icon={<TimerReset className="h-5 w-5" />}
            title="課金合計"
            value={`${stats.totalPoints.toLocaleString()} pt`}
            helper="検索範囲"
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-2xl">通話ログ一覧</CardTitle>
              <CardDescription>
                通話IDごとの状態と課金履歴を確認し、詳細モーダルからステートログを参照します。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {stats.lastUpdated}
            </Badge>
          </CardHeader>
          <CardContent>
            {callQuery.status === 'pending' && <CallTableSkeleton />}
            {callQuery.status === 'error' && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {callQuery.error instanceof Error
                    ? callQuery.error.message
                    : '通話ログを取得できませんでした'}
                </span>
              </div>
            )}
            {callQuery.status === 'success' && (
              <CallTable calls={calls} onSelect={setSelectedCallId} />
            )}
          </CardContent>
        </Card>

        <ActiveMonitoringPanel query={activeCallsQuery} />
      </div>

      <CallDetailDialog
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />
    </div>
  )
}

function CallTable({
  calls,
  onSelect,
}: {
  calls: Array<AdminCallSummary>
  onSelect: (callId: string) => void
}) {
  if (!calls.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        対象となる通話ログがありません。検索条件を調整してください。
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="text-white/60">
            <th className="px-4 py-2 font-semibold">通話ID</th>
            <th className="px-4 py-2 font-semibold">ユーザー / おともはん</th>
            <th className="px-4 py-2 font-semibold">開始 / 終了</th>
            <th className="px-4 py-2 font-semibold">通話時間</th>
            <th className="px-4 py-2 font-semibold">課金</th>
            <th className="px-4 py-2 font-semibold">状態</th>
            <th className="px-4 py-2 font-semibold">操作</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr
              key={call.callId}
              className={cn(
                'border-t border-white/5 transition hover:bg-white/5',
                call.status === 'abnormal' && 'bg-rose-950/40',
                call.status === 'suspected' && 'bg-amber-950/30',
              )}
            >
              <td className="px-4 py-3 font-mono text-xs text-white/70">
                {call.callId}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold">{call.userId}</span>
                  <span className="text-xs text-white/60">{call.otomoId}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-white/70">
                <div className="flex flex-col">
                  <span>{formatDateTime(call.startedAt)}</span>
                  <span>{formatDateTime(call.endedAt)}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-white/80">
                {formatDuration(call.durationSeconds)}
              </td>
              <td className="px-4 py-3">
                <span className="font-semibold">
                  {call.billedPoints.toLocaleString()} pt
                </span>
              </td>
              <td className="px-4 py-3">
                <CallStatusBadge status={call.status} />
                <p className="text-xs text-white/50">{call.endReason}</p>
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(call.callId)}
                >
                  詳細
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CallTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  )
}

function CallStatusBadge({ status }: { status: AdminCallStatus }) {
  return (
    <Badge variant={statusLabel[status].badge} className="mb-1 w-fit">
      {statusLabel[status].label}
    </Badge>
  )
}

function CallDetailDialog({
  callId,
  onClose,
}: {
  callId: string | null
  onClose: () => void
}) {
  const detailQuery = useQuery<AdminCallDetail>({
    queryKey: ['admin-call-detail', callId],
    queryFn: () => fetchAdminCallDetail(callId as string),
    enabled: Boolean(callId),
  })

  return (
    <Dialog
      open={Boolean(callId)}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-y-auto bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle>通話詳細</DialogTitle>
          <DialogDescription className="text-white/60">
            ステートマシン、RTP、課金tick、警告を横断的に確認します。
          </DialogDescription>
        </DialogHeader>
        {detailQuery.status === 'pending' && <DetailSkeleton />}
        {detailQuery.status === 'error' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <AlertCircle className="h-4 w-4" />
            <span>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : '通話詳細を取得できませんでした'}
            </span>
          </div>
        )}
        {detailQuery.status === 'success' && (
          <CallDetailBody detail={detailQuery.data} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CallDetailBody({ detail }: { detail: AdminCallDetail }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">
              {detail.callId}
            </p>
            <h2 className="text-3xl font-semibold">{detail.userId}</h2>
            <p className="text-white/60">{detail.otomoId}</p>
          </div>
          <div className="text-right">
            <CallStatusBadge status={detail.status} />
            <p className="text-sm text-white/60">{detail.endReason}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-sm text-white/80 md:grid-cols-3">
          <InfoBlock label="開始" value={formatDateTime(detail.startedAt)} />
          <InfoBlock label="終了" value={formatDateTime(detail.endedAt)} />
          <InfoBlock
            label="通話時間"
            value={formatDuration(detail.durationSeconds)}
          />
          <InfoBlock
            label="課金ポイント"
            value={`${detail.billedPoints.toLocaleString()} pt`}
          />
          <InfoBlock
            label="単価"
            value={`${detail.pricingPerMinute} pt / 分`}
          />
          <InfoBlock label="異常メモ" value={detail.anomalyNote ?? 'なし'} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">ステートマシン履歴</h3>
            <Badge variant="outline" className="text-xs">
              <Radio className="mr-1 h-4 w-4" />
              SFUログ
            </Badge>
          </div>
          <StateTimeline events={detail.stateEvents} />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">RTP 到達ログ</h3>
          <RtpSummary summary={detail.rtpSummary} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">課金ログ（Tick）</h3>
          <BillingTicks ticks={detail.billingTicks} />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h3 className="text-lg font-semibold">品質ログ</h3>
          <QualitySummary log={detail.qualityLog} />
          <RecordingPanel recording={detail.recording} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">自動検知アラート</h3>
          <Badge variant="outline" className="text-xs">
            <ShieldCheck className="mr-1 h-4 w-4" />
            A-10 連携
          </Badge>
        </div>
        <AlertList alerts={detail.alerts} />
      </section>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function StateTimeline({ events }: { events: AdminCallDetail['stateEvents'] }) {
  if (!events.length) {
    return <p className="mt-3 text-sm text-white/60">履歴がありません。</p>
  }
  return (
    <ol className="mt-4 space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3">
          <span className="text-xs text-white/40">{formatTime(event.at)}</span>
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-semibold',
                event.level === 'danger' && 'text-rose-300',
                event.level === 'warning' && 'text-amber-300',
              )}
            >
              {event.state}
            </p>
            {event.note && (
              <p className="text-xs text-white/60">{event.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function RtpSummary({ summary }: { summary: AdminCallDetail['rtpSummary'] }) {
  const rows = [
    { label: 'ユーザー → SFU', value: summary.userIngress },
    { label: 'おともはん → SFU', value: summary.otomoIngress },
    { label: 'ユーザー RTT', value: `${summary.userLatencyMs} ms` },
    { label: 'おともはん RTT', value: `${summary.otomoLatencyMs} ms` },
    { label: 'パケットロス', value: `${summary.packetLossPct}%` },
    { label: 'Jitter', value: `${summary.jitterMs} ms` },
  ]
  return (
    <div className="mt-4 space-y-2 text-sm text-white/80">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-2"
        >
          <span>{row.label}</span>
          <span className="font-mono text-xs text-white/60">{row.value}</span>
        </div>
      ))}
      {summary.note && <p className="text-xs text-amber-300">{summary.note}</p>}
    </div>
  )
}

function BillingTicks({ ticks }: { ticks: AdminCallDetail['billingTicks'] }) {
  if (!ticks.length) {
    return <p className="mt-2 text-sm text-white/60">課金ログはありません。</p>
  }
  return (
    <ul className="mt-3 space-y-3 text-sm">
      {ticks.map((tick) => (
        <li
          key={tick.id}
          className={cn(
            'rounded-2xl border border-white/10 px-4 py-3',
            tick.missing && 'border-amber-500/40 bg-amber-500/10',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-white/60">
              {formatDateTime(tick.at)}
            </span>
            <span className="font-semibold">
              {tick.points ? `${tick.points} pt` : '未課金'}
            </span>
          </div>
          {tick.missing && (
            <p className="text-xs text-amber-200">tick 欠損を検知</p>
          )}
        </li>
      ))}
    </ul>
  )
}

function QualitySummary({ log }: { log: AdminCallDetail['qualityLog'] }) {
  return (
    <div className="grid gap-3 text-sm text-white/80">
      <div className="rounded-2xl border border-white/10 px-4 py-3">
        <p className="text-xs text-white/50">平均RTT</p>
        <p className="text-xl font-semibold">{log.avgRttMs} ms</p>
      </div>
      <div className="rounded-2xl border border-white/10 px-4 py-3">
        <p className="text-xs text-white/50">切断回数</p>
        <p className="text-xl font-semibold">{log.disconnectCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 px-4 py-3">
        <p className="text-xs text-white/50">ユーザー端末</p>
        <p className="font-mono text-xs text-white/70">{log.userDevice}</p>
      </div>
      <div className="rounded-2xl border border-white/10 px-4 py-3">
        <p className="text-xs text-white/50">おともはん端末</p>
        <p className="font-mono text-xs text-white/70">{log.otomoDevice}</p>
      </div>
      {log.networkNotes && (
        <p className="text-xs text-amber-300">{log.networkNotes}</p>
      )}
    </div>
  )
}

function RecordingPanel({
  recording,
}: {
  recording: AdminCallDetail['recording']
}) {
  if (!recording.available) {
    return (
      <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/60">
        録音データはありません。
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-white/10 px-4 py-3">
      <p className="text-sm font-semibold">録音データ</p>
      <p className="text-xs text-white/60">{recording.note ?? '内部限定'}</p>
      <Button className="mt-2" size="sm">
        <PlayCircle className="mr-2 h-4 w-4" />
        再生 / ダウンロード
      </Button>
    </div>
  )
}

function AlertList({ alerts }: { alerts: AdminCallDetail['alerts'] }) {
  if (!alerts.length) {
    return <p className="mt-2 text-sm text-white/60">警告はありません。</p>
  }
  return (
    <ul className="mt-3 space-y-3 text-sm">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className={cn(
            'rounded-2xl border px-4 py-3',
            alert.severity === 'danger' && 'border-rose-500/30 bg-rose-500/10',
            alert.severity === 'warning' &&
              'border-amber-500/30 bg-amber-500/10 text-amber-100',
            alert.severity === 'info' &&
              'border-white/10 bg-white/5 text-white/80',
          )}
        >
          {alert.message}
        </li>
      ))}
    </ul>
  )
}

function ActiveMonitoringPanel({
  query,
}: {
  query: UseQueryResult<Array<AdminActiveCall>>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MonitorSmartphone className="h-5 w-5 text-emerald-300" />
            リアルタイム通話モニタリング
          </CardTitle>
          <CardDescription>
            WebRTC SFU
            からのヘルスチェックを5秒単位で集約し、危険通話を強調表示します。
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              更新中
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              再取得
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {query.status === 'pending' && <CallTableSkeleton />}
        {query.status === 'error' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <AlertCircle className="h-4 w-4" />
            <span>
              {query.error instanceof Error
                ? query.error.message
                : 'リアルタイム情報を取得できませんでした'}
            </span>
          </div>
        )}
        {query.status === 'success' && <ActiveCallList calls={query.data} />}
      </CardContent>
    </Card>
  )
}

function ActiveCallList({ calls }: { calls: Array<AdminActiveCall> }) {
  if (!calls.length) {
    return <p className="text-sm text-white/60">進行中の通話はありません。</p>
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {calls.map((call) => (
        <div
          key={call.callId}
          className={cn(
            'rounded-3xl border px-5 py-4',
            call.health === 'normal' &&
              'border-emerald-500/30 bg-emerald-500/5',
            call.health === 'warning' && 'border-amber-500/30 bg-amber-500/10',
            call.health === 'critical' && 'border-rose-500/40 bg-rose-500/10',
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">{call.callId}</p>
              <p className="text-lg font-semibold">
                {call.userId} → {call.otomoId}
              </p>
            </div>
            <HealthPill level={call.health} />
          </div>
          <p className="mt-2 text-sm text-white/70">
            経過 {formatDuration(call.elapsedSeconds)} / RTP {call.rtpStatus}
          </p>
          {call.note && <p className="text-xs text-amber-200">{call.note}</p>}
        </div>
      ))}
    </div>
  )
}

function HealthPill({ level }: { level: AdminActiveCall['health'] }) {
  const label =
    level === 'normal' ? '正常' : level === 'warning' ? '警告' : '危険'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        level === 'normal' && 'bg-emerald-500/20 text-emerald-100',
        level === 'warning' && 'bg-amber-500/20 text-amber-100',
        level === 'critical' && 'bg-rose-600/30 text-rose-50',
      )}
    >
      <Activity className="mr-1 h-3 w-3" />
      {label}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-3xl" />
      ))}
    </div>
  )
}

function buildStats(calls: Array<AdminCallSummary>): CallHeadlineStats {
  if (!calls.length) {
    return {
      total: 0,
      abnormal: 0,
      suspected: 0,
      totalPoints: 0,
      lastUpdated: '-',
    }
  }
  const abnormal = calls.filter((call) => call.status === 'abnormal').length
  const suspected = calls.filter((call) => call.status === 'suspected').length
  const totalPoints = calls.reduce((sum, call) => sum + call.billedPoints, 0)
  return {
    total: calls.length,
    abnormal,
    suspected,
    totalPoints,
    lastUpdated: new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function buildListFilters(form: SortFilters): AdminCallListFilters {
  return {
    callId: form.callId.trim() || undefined,
    userId: form.userId.trim() || undefined,
    otomoId: form.otomoId.trim() || undefined,
    startedFrom: form.startedFrom || undefined,
    startedTo: form.startedTo || undefined,
    status: form.status === 'all' ? undefined : form.status,
    durationBucket:
      form.durationBucket === 'all' ? undefined : form.durationBucket,
    billingBucket:
      form.billingBucket === 'all' ? undefined : form.billingBucket,
  }
}

function createCsvFromCalls(calls: Array<AdminCallSummary>): string {
  const header = [
    'callId',
    'userId',
    'otomoId',
    'startedAt',
    'endedAt',
    'duration',
    'billedPoints',
    'status',
    'endReason',
  ]
  const rows = calls.map((call) => [
    call.callId,
    call.userId,
    call.otomoId,
    formatDateTime(call.startedAt),
    formatDateTime(call.endedAt),
    formatDuration(call.durationSeconds),
    call.billedPoints.toString(),
    statusLabel[call.status].label,
    call.endReason,
  ])
  return [header, ...rows]
    .map((columns) =>
      columns.map((value) => `"${value.replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return '0分'
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  if (minutes === 0) {
    return `${remain}秒`
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }
  return remain ? `${minutes}分${remain}秒` : `${minutes}分`
}

function StatCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string
  value: string
  helper: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-5">
      <div className="flex items-center justify-between text-white/60">
        <span className="text-xs uppercase tracking-[0.3em]">{helper}</span>
        <span className="text-white/70">{icon}</span>
      </div>
      <p className="mt-3 text-sm text-white/50">{title}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  )
}
