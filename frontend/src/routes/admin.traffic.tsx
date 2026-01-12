import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Cpu,
  Download,
  GaugeCircle,
  Loader2,
  Network,
  Radio,
  RefreshCw,
  Server,
  SignalHigh,
  ThermometerSun,
  Waves,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type {
  AdminActiveCall,
  AdminTrafficAlertEntry,
  AdminTrafficHeatmapEntry,
  AdminTrafficRtpQuality,
  AdminTrafficSfuNodeMetrics,
  AdminTrafficSummary,
  AdminTrafficTrendPoint,
  AdminTrafficTrendRange,
} from '@/lib/api'
import {
  fetchAdminActiveCalls,
  fetchAdminTrafficAlerts,
  fetchAdminTrafficHeatmap,
  fetchAdminTrafficRtpQuality,
  fetchAdminTrafficSfuMetrics,
  fetchAdminTrafficSummary,
  fetchAdminTrafficTrend,
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
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/admin/traffic')({
  component: AdminTrafficScreen,
})

type SummaryMetricKey = keyof Pick<
  AdminTrafficSummary,
  | 'concurrentCalls'
  | 'sfuLoadPct'
  | 'avgRttMs'
  | 'packetLossPct'
  | 'apiRequestsPerMin'
>

type SeverityLevel = 'normal' | 'warning' | 'critical'

type ExportState = 'idle' | 'success' | 'error'

const summarySeverityPalette: Record<SeverityLevel, string> = {
  normal: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-100',
  warning: 'border-amber-500/40 bg-amber-500/5 text-amber-100',
  critical: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
}

const summaryIconMap: Record<SummaryMetricKey, ReactNode> = {
  concurrentCalls: <SignalHigh className="h-5 w-5" />,
  sfuLoadPct: <Server className="h-5 w-5" />,
  avgRttMs: <Radio className="h-5 w-5" />,
  packetLossPct: <Activity className="h-5 w-5" />,
  apiRequestsPerMin: <Network className="h-5 w-5" />,
}

function AdminTrafficScreen() {
  const [range, setRange] = useState<AdminTrafficTrendRange>('15m')
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [exportMessage, setExportMessage] = useState('')

  const summaryQuery = useQuery<AdminTrafficSummary>({
    queryKey: ['admin-traffic-summary'],
    queryFn: () => fetchAdminTrafficSummary(),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })

  const trendQuery = useQuery({
    queryKey: ['admin-traffic-trend', range],
    queryFn: (): Promise<AdminTrafficTrendPoint[]> =>
      fetchAdminTrafficTrend(range),
    placeholderData: (previousData): AdminTrafficTrendPoint[] | undefined =>
      previousData,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })

  const sfuQuery = useQuery<Array<AdminTrafficSfuNodeMetrics>>({
    queryKey: ['admin-traffic-sfu'],
    queryFn: () => fetchAdminTrafficSfuMetrics(),
    refetchInterval: 15000,
  })

  const rtpQuery = useQuery<AdminTrafficRtpQuality>({
    queryKey: ['admin-traffic-rtp'],
    queryFn: () => fetchAdminTrafficRtpQuality(),
    refetchInterval: 15000,
  })

  const heatmapQuery = useQuery<Array<AdminTrafficHeatmapEntry>>({
    queryKey: ['admin-traffic-heatmap'],
    queryFn: () => fetchAdminTrafficHeatmap(),
  })

  const alertsQuery = useQuery<Array<AdminTrafficAlertEntry>>({
    queryKey: ['admin-traffic-alerts'],
    queryFn: () => fetchAdminTrafficAlerts(),
    refetchInterval: 8000,
  })

  const activeCallsQuery = useQuery<Array<AdminActiveCall>>({
    queryKey: ['admin-active-calls'],
    queryFn: () => fetchAdminActiveCalls(),
    refetchInterval: 12000,
  })

  const summary = summaryQuery.data
  const trendPoints: AdminTrafficTrendPoint[] = trendQuery.data ?? []

  const handleRefresh = () => {
    summaryQuery.refetch()
    trendQuery.refetch()
    sfuQuery.refetch()
    rtpQuery.refetch()
    heatmapQuery.refetch()
    alertsQuery.refetch()
    activeCallsQuery.refetch()
  }

  const handleExport = () => {
    if (!summary || !trendPoints.length) {
      setExportState('error')
      setExportMessage('サマリまたはトレンドが取得できていません')
      return
    }
    if (typeof window === 'undefined') {
      setExportState('error')
      setExportMessage('ブラウザ環境でのみエクスポートできます')
      return
    }
    const rows = trendPoints
      .map((point) => `${point.timestamp},${point.concurrentCalls}`)
      .join('\n')
    const csv = `metric,value\nconcurrentCalls,${summary.concurrentCalls}\nsfuLoadPct,${summary.sfuLoadPct}\navgRttMs,${summary.avgRttMs}\npacketLossPct,${summary.packetLossPct}\napiRequestsPerMin,${summary.apiRequestsPerMin}\n\ntimestamp,concurrentCalls\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `traffic-monitor-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExportState('success')
    setExportMessage(`${trendPoints.length} 行のデータを出力しました`)
  }

  const summaryCards = useMemo(() => {
    if (!summary) {
      return []
    }
    return [
      {
        metric: 'concurrentCalls' as SummaryMetricKey,
        label: '同時通話数',
        helper: 'リアルタイム',
        value: `${summary.concurrentCalls.toLocaleString()} 通話`,
        severity: evaluateSeverity('concurrentCalls', summary.concurrentCalls),
      },
      {
        metric: 'sfuLoadPct' as SummaryMetricKey,
        label: 'SFU 負荷',
        helper: 'mediasoup',
        value: `${summary.sfuLoadPct}%`,
        severity: evaluateSeverity('sfuLoadPct', summary.sfuLoadPct),
      },
      {
        metric: 'avgRttMs' as SummaryMetricKey,
        label: '平均 RTT',
        helper: '直近 1 分',
        value: `${summary.avgRttMs} ms`,
        severity: evaluateSeverity('avgRttMs', summary.avgRttMs),
      },
      {
        metric: 'packetLossPct' as SummaryMetricKey,
        label: 'パケットロス',
        helper: '全体平均',
        value: `${summary.packetLossPct}%`,
        severity: evaluateSeverity('packetLossPct', summary.packetLossPct),
      },
      {
        metric: 'apiRequestsPerMin' as SummaryMetricKey,
        label: 'API リクエスト数',
        helper: '直近 1 分',
        value: `${summary.apiRequestsPerMin} req/min`,
        severity: evaluateSeverity(
          'apiRequestsPerMin',
          summary.apiRequestsPerMin,
        ),
      },
    ]
  }, [summary])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-06 / TRAFFIC MONITOR
            </p>
            <h1 className="mt-2 text-4xl font-bold">トラフィックモニタ</h1>
            <p className="text-sm text-white/70">
              SFU 負荷・RTC 品質・API
              トラフィックを横断的に監視し、障害兆候を先取りします。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={handleExport}
              disabled={summaryQuery.isFetching || trendQuery.isFetching}
            >
              {summaryQuery.isFetching || trendQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              CSV エクスポート
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-2xl"
              onClick={handleRefresh}
              disabled={
                summaryQuery.isFetching ||
                trendQuery.isFetching ||
                sfuQuery.isFetching ||
                rtpQuery.isFetching ||
                heatmapQuery.isFetching ||
                alertsQuery.isFetching ||
                activeCallsQuery.isFetching
              }
            >
              {(summaryQuery.isFetching || trendQuery.isFetching) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {!summaryQuery.isFetching && !trendQuery.isFetching && (
                <RefreshCw className="h-4 w-4" />
              )}
              最新に更新
            </Button>
          </div>
        </header>
        {exportMessage && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm',
              exportState === 'success'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                : 'border-amber-400/40 bg-amber-500/10 text-amber-100',
            )}
          >
            <AlertCircle className="h-4 w-4" />
            {exportMessage}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-5">
          {summaryQuery.status === 'pending' &&
            Array.from({ length: 5 }).map((_, index) => (
              <SummarySkeleton key={index} />
            ))}
          {summaryQuery.status === 'success' &&
            summaryCards.map((card) => (
              <SummaryStatCard key={card.metric} {...card} />
            ))}
          {summaryQuery.status === 'error' && (
            <ErrorBanner error={summaryQuery.error} />
          )}
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BarChart3 className="h-6 w-6 text-rose-300" />
                通話トラフィック推移
              </CardTitle>
              <CardDescription>
                1
                分間隔の同時通話数。ピーク帯の傾向を把握し、スケールアウトの判断材料にします。
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['15m', '1h'] as Array<AdminTrafficTrendRange>).map(
                (option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={range === option ? 'secondary' : 'outline'}
                    className="rounded-2xl text-xs"
                    onClick={() => setRange(option)}
                  >
                    {option === '15m' ? '直近15分' : '直近1時間'}
                  </Button>
                ),
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trendQuery.status === 'pending' && <TrendSkeleton />}
            {trendQuery.status === 'error' && (
              <ErrorBanner error={trendQuery.error} />
            )}
            {trendQuery.status === 'success' && (
              <MiniTrendChart points={trendPoints} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">SFU 負荷状況</CardTitle>
                <CardDescription>
                  各ノードの CPU / メモリ /
                  帯域を俯瞰し、ホットスポットを検知します。
                </CardDescription>
              </div>
              <Badge variant="info" className="text-xs">
                <GaugeCircle className="mr-2 h-3.5 w-3.5" />
                {summary?.updatedAt
                  ? formatTimestamp(summary.updatedAt)
                  : '更新中'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {sfuQuery.status === 'pending' && <SfuSkeleton />}
              {sfuQuery.status === 'error' && (
                <ErrorBanner error={sfuQuery.error} />
              )}
              {sfuQuery.status === 'success' &&
                sfuQuery.data.map((node) => (
                  <SfuNodeCard key={node.nodeId} node={node} />
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">RTP 品質モニタ</CardTitle>
              <CardDescription>
                遅延・ジッター・パケットロスを集計し、クライアント品質の悪化兆候を示します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rtpQuery.status === 'pending' && <QualitySkeleton />}
              {rtpQuery.status === 'error' && (
                <ErrorBanner error={rtpQuery.error} />
              )}
              {rtpQuery.status === 'success' && (
                <RtpQualityPanel quality={rtpQuery.data} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                トラフィックヒートマップ
              </CardTitle>
              <CardDescription>
                時間帯ごとの通話集中度。要員シフトやサーバ増強の参考値です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapQuery.status === 'pending' && <HeatmapSkeleton />}
              {heatmapQuery.status === 'error' && (
                <ErrorBanner error={heatmapQuery.error} />
              )}
              {heatmapQuery.status === 'success' && (
                <TrafficHeatmap data={heatmapQuery.data} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">システムアラート</CardTitle>
                <CardDescription>
                  しきい値を超過したログを即時表示。クリックで詳細調査に進みます。
                </CardDescription>
              </div>
              <Badge variant="warning" className="text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {alertsQuery.data?.length ?? 0} 件
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertsQuery.status === 'pending' && <AlertSkeleton />}
              {alertsQuery.status === 'error' && (
                <ErrorBanner error={alertsQuery.error} />
              )}
              {alertsQuery.status === 'success' && (
                <AlertList entries={alertsQuery.data} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">進行中の通話（簡易）</CardTitle>
              <CardDescription>
                低遅延で監視するためのライトテーブル。A-04
                と連携して詳細を開けます。
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              <ThermometerSun className="mr-1 h-3 w-3" />
              {activeCallsQuery.data?.length ?? 0} セッション
            </Badge>
          </CardHeader>
          <CardContent>
            {activeCallsQuery.status === 'pending' && <ActiveTableSkeleton />}
            {activeCallsQuery.status === 'error' && (
              <ErrorBanner error={activeCallsQuery.error} />
            )}
            {activeCallsQuery.status === 'success' && (
              <ActiveCallTable calls={activeCallsQuery.data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryStatCard({
  label,
  helper,
  value,
  severity,
  metric,
}: {
  label: string
  helper: string
  value: string
  severity: SeverityLevel
  metric: SummaryMetricKey
}) {
  return (
    <Card className="border-white/5 bg-gradient-to-b from-white/5 to-transparent">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>{helper}</span>
          <span className="text-xs uppercase tracking-[0.3em] text-white/30">
            KPI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl border',
              summarySeverityPalette[severity],
            )}
          >
            {summaryIconMap[metric]}
          </div>
          <div>
            <p className="text-3xl font-semibold leading-tight">{value}</p>
            <p className="text-sm text-white/70">{label}</p>
          </div>
        </div>
        <Badge
          variant={
            severity === 'critical'
              ? 'danger'
              : severity === 'warning'
                ? 'warning'
                : 'success'
          }
        >
          {severity === 'critical'
            ? '危険域'
            : severity === 'warning'
              ? '注意'
              : '良好'}
        </Badge>
      </CardContent>
    </Card>
  )
}

function SummarySkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-3 w-24 rounded-full bg-white/10" />
        <Skeleton className="h-10 w-32 rounded-2xl bg-white/10" />
        <Skeleton className="h-3 w-20 rounded-full bg-white/10" />
      </CardContent>
    </Card>
  )
}

function TrendSkeleton() {
  return <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
}

function SfuSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

function QualitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

function HeatmapSkeleton() {
  return <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
}

function AlertSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

function ActiveTableSkeleton() {
  return <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
}

function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertCircle className="h-4 w-4" />
      {error instanceof Error
        ? error.message
        : 'データ取得中にエラーが発生しました'}
    </div>
  )
}

function MiniTrendChart({ points }: { points: Array<AdminTrafficTrendPoint> }) {
  if (!points.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/60">
        トレンドデータがありません。
      </div>
    )
  }
  const max = Math.max(...points.map((point) => point.concurrentCalls))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-3">
        {points.map((point) => (
          <div
            key={point.timestamp}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative flex h-40 w-6 items-end justify-center">
              <div
                className="w-full rounded-full bg-gradient-to-t from-rose-500/30 via-cyan-500/40 to-white"
                style={{ height: `${(point.concurrentCalls / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-white/50">
              {new Date(point.timestamp).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
        最大同時通話: {max.toLocaleString()} 通話
      </div>
    </div>
  )
}

function SfuNodeCard({ node }: { node: AdminTrafficSfuNodeMetrics }) {
  const severityClass =
    node.status === 'critical'
      ? 'text-rose-200'
      : node.status === 'warning'
        ? 'text-amber-200'
        : 'text-emerald-200'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            {node.nodeId}
          </p>
          <p className="mt-1 text-2xl font-semibold">CPU {node.cpuPct}%</p>
        </div>
        <Badge
          variant={
            node.status === 'critical'
              ? 'danger'
              : node.status === 'warning'
                ? 'warning'
                : 'success'
          }
        >
          <Cpu className="mr-1 h-4 w-4" />
          {node.status === 'critical'
            ? '危険'
            : node.status === 'warning'
              ? '注意'
              : '正常'}
        </Badge>
      </div>
      <div className="mt-4 space-y-3 text-sm text-white/70">
        <MetricBar
          label="CPU"
          value={node.cpuPct}
          suffix="%"
          severity={node.status}
        />
        <MetricBar
          label="メモリ"
          value={(node.memoryGb / node.memoryCapacityGb) * 100}
          suffix={`% (${node.memoryGb.toFixed(1)} / ${node.memoryCapacityGb} GB)`}
          severity={node.status}
        />
        <MetricBar
          label="帯域"
          value={Math.min(100, (node.upstreamMbps + node.downstreamMbps) / 1.2)}
          suffix={`${node.upstreamMbps}↑ / ${node.downstreamMbps}↓ Mbps`}
          severity={node.status}
        />
      </div>
      <p
        className={cn('mt-3 text-xs uppercase tracking-[0.3em]', severityClass)}
      >
        load status: {node.status}
      </p>
    </div>
  )
}

function MetricBar({
  label,
  value,
  suffix,
  severity,
}: {
  label: string
  value: number
  suffix: string
  severity: SeverityLevel
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-white/50">{suffix}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/10">
        <div
          className={cn(
            'h-full rounded-full',
            severity === 'critical'
              ? 'bg-gradient-to-r from-rose-500 to-rose-300'
              : severity === 'warning'
                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-300',
          )}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}

function RtpQualityPanel({ quality }: { quality: AdminTrafficRtpQuality }) {
  const metrics = [
    {
      label: '平均 RTT',
      value: `${quality.avgRttMs} ms`,
      severity: evaluateSeverity('avgRttMs', quality.avgRttMs),
      icon: <Radio className="h-4 w-4" />,
    },
    {
      label: '平均 Jitter',
      value: `${quality.avgJitterMs} ms`,
      severity: evaluateSeverity('avgRttMs', quality.avgJitterMs),
      icon: <Waves className="h-4 w-4" />,
    },
    {
      label: 'パケットロス',
      value: `${quality.packetLossPct}%`,
      severity: evaluateSeverity('packetLossPct', quality.packetLossPct),
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: '異常通話',
      value: `${quality.abnormalCallCount} 件`,
      severity:
        quality.abnormalCallCount > 2
          ? 'critical'
          : quality.abnormalCallCount > 0
            ? 'warning'
            : 'normal',
      icon: <ThermometerSun className="h-4 w-4" />,
    },
  ]
  return (
    <div className="space-y-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70">
              {metric.icon}
            </div>
            <div>
              <p className="text-sm text-white/70">{metric.label}</p>
              <p className="text-xl font-semibold">{metric.value}</p>
            </div>
          </div>
          <Badge
            variant={
              metric.severity === 'critical'
                ? 'danger'
                : metric.severity === 'warning'
                  ? 'warning'
                  : 'success'
            }
          >
            {metric.severity === 'critical'
              ? '要対応'
              : metric.severity === 'warning'
                ? '注意'
                : '正常'}
          </Badge>
        </div>
      ))}
      {quality.notes.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {quality.notes.join(' / ')}
        </div>
      )}
    </div>
  )
}

function TrafficHeatmap({ data }: { data: Array<AdminTrafficHeatmapEntry> }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/60">
        ヒートマップのデータがありません。
      </div>
    )
  }
  const max = Math.max(...data.map((entry) => entry.calls)) || 1
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {data.map((entry) => {
          const intensity = entry.calls / max
          return (
            <div
              key={entry.hourLabel}
              className="rounded-2xl border border-white/10 p-3 text-center"
              style={{
                background:
                  intensity > 0.7
                    ? 'linear-gradient(135deg, rgba(244,63,94,0.4), rgba(236,72,153,0.25))'
                    : intensity > 0.4
                      ? 'linear-gradient(135deg, rgba(14,165,233,0.35), rgba(79,70,229,0.2))'
                      : 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(71,85,105,0.1))',
              }}
            >
              <p className="text-sm text-white/60">{entry.hourLabel}</p>
              <p className="text-2xl font-semibold">{entry.calls}</p>
              <p className="text-xs text-white/60">calls</p>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-white/50">
        最大 {max.toLocaleString()} 通話帯（色濃度で表示）。
      </p>
    </div>
  )
}

function AlertList({ entries }: { entries: Array<AdminTrafficAlertEntry> }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/60">
        現在アラートはありません。
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
        >
          <div className="flex items-center justify-between">
            <Badge
              variant={
                entry.severity === 'critical'
                  ? 'danger'
                  : entry.severity === 'warning'
                    ? 'warning'
                    : 'info'
              }
            >
              {entry.severity === 'critical'
                ? 'Critical'
                : entry.severity === 'warning'
                  ? 'Warning'
                  : 'Info'}
            </Badge>
            <span className="text-xs text-white/60">
              {formatTimestamp(entry.occurredAt)}
            </span>
          </div>
          <p className="mt-2 text-base text-white">{entry.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
            {entry.relatedNodeId && (
              <span className="inline-flex items-center gap-1">
                <Server className="h-3 w-3" />
                {entry.relatedNodeId}
              </span>
            )}
            {entry.relatedCallId && (
              <span className="inline-flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {entry.relatedCallId}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ActiveCallTable({ calls }: { calls: Array<AdminActiveCall> }) {
  if (!calls.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/60">
        現在進行中の通話はありません。
      </div>
    )
  }
  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-white/50">
          <tr>
            <th className="px-4 py-3 font-medium">通話ID</th>
            <th className="px-4 py-3 font-medium">ユーザー</th>
            <th className="px-4 py-3 font-medium">おともはん</th>
            <th className="px-4 py-3 font-medium">経過</th>
            <th className="px-4 py-3 font-medium">RTT / 状態</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.callId} className="border-t border-white/5">
              <td className="px-4 py-3 text-white">{call.callId}</td>
              <td className="px-4 py-3 text-white/80">{call.userId}</td>
              <td className="px-4 py-3 text-white/80">{call.otomoId}</td>
              <td className="px-4 py-3 text-white/70">
                {formatDuration(call.elapsedSeconds)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">{call.rtpStatus}</span>
                  <Badge
                    variant={
                      call.health === 'critical'
                        ? 'danger'
                        : call.health === 'warning'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {call.health}
                  </Badge>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatDuration(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour12: false,
  })
}

function evaluateSeverity(
  metric: SummaryMetricKey,
  value: number,
): SeverityLevel {
  switch (metric) {
    case 'concurrentCalls':
      if (value >= 40) return 'critical'
      if (value >= 20) return 'warning'
      return 'normal'
    case 'sfuLoadPct':
      if (value >= 80) return 'critical'
      if (value >= 60) return 'warning'
      return 'normal'
    case 'avgRttMs':
      if (value >= 120) return 'critical'
      if (value >= 90) return 'warning'
      return 'normal'
    case 'packetLossPct':
      if (value >= 2.5) return 'critical'
      if (value >= 1.5) return 'warning'
      return 'normal'
    case 'apiRequestsPerMin':
      if (value >= 1000) return 'critical'
      if (value >= 800) return 'warning'
      return 'normal'
    default:
      return 'normal'
  }
}
