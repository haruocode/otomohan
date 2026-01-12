import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Download,
  FileAudio2,
  Filter,
  FlagTriangleRight,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldBan,
  ShieldCheck,
  ShieldQuestion,
  Siren,
  Users,
} from 'lucide-react'

import type { FormEvent, ReactNode } from 'react'

import type {
  AdminReportAction,
  AdminReportCategory,
  AdminReportDetail,
  AdminReportStatus,
  AdminReportSummary,
} from '@/lib/api'
import {
  fetchAdminReportDetail,
  fetchAdminReports,
  resolveAdminReport,
  updateAdminReportStatus,
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

export const Route = createFileRoute('/admin/reports')({
  component: AdminReportsScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const statusBadgeVariant: Record<
  AdminReportStatus,
  'danger' | 'warning' | 'success'
> = {
  unprocessed: 'danger',
  reviewing: 'warning',
  resolved: 'success',
}

const statusLabel: Record<AdminReportStatus, string> = {
  unprocessed: '未対応',
  reviewing: '審査中',
  resolved: '処理済',
}

const categoryLabel: Record<AdminReportCategory, string> = {
  abuse: '不適切な言動',
  sexual: '性的表現',
  neglect: '無視・放置',
  spam: 'スパム行為',
  fraud: '課金不正',
  other: 'その他',
}

const actionLabel: Record<AdminReportAction, string> = {
  warn: '警告する',
  temporarySuspend: '一時停止',
  ban: '凍結',
  invalid: '無効通報としてクローズ',
}

const targetTypeLabel = {
  user: 'ユーザー',
  otomo: 'おともはん',
} as const

const priorityLabel = {
  high: '優先度 高',
  medium: '優先度 中',
  low: '優先度 低',
} as const

const priorityVariant = {
  high: 'danger',
  medium: 'warning',
  low: 'outline',
} as const

type FilterForm = {
  reportId: string
  callId: string
  reporterId: string
  targetId: string
  category: '' | AdminReportCategory
  status: '' | AdminReportStatus
  reportedFrom: string
  reportedTo: string
}

const initialFilterForm: FilterForm = {
  reportId: '',
  callId: '',
  reporterId: '',
  targetId: '',
  category: '',
  status: '',
  reportedFrom: '',
  reportedTo: '',
}

type ReportStats = {
  total: number
  unprocessed: number
  reviewing: number
  resolved: number
}

function AdminReportsScreen() {
  const [filterForm, setFilterForm] = useState<FilterForm>(initialFilterForm)
  const [activeFilters, setActiveFilters] = useState(initialFilterForm)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState('')

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', activeFilters],
    queryFn: (): Promise<AdminReportSummary[]> =>
      fetchAdminReports({
        reportId: activeFilters.reportId || undefined,
        callId: activeFilters.callId || undefined,
        reporterId: activeFilters.reporterId || undefined,
        targetId: activeFilters.targetId || undefined,
        category: activeFilters.category || undefined,
        status: activeFilters.status || undefined,
        reportedFrom: activeFilters.reportedFrom || undefined,
        reportedTo: activeFilters.reportedTo || undefined,
      }),
    placeholderData: (previousData): AdminReportSummary[] | undefined =>
      previousData,
  })

  const reports: AdminReportSummary[] = reportsQuery.data ?? []
  const stats = useMemo<ReportStats>(() => buildReportStats(reports), [reports])

  const handleFilterChange = (field: keyof FilterForm, value: string) => {
    setFilterForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveFilters(filterForm)
  }

  const handleReset = () => {
    setFilterForm(initialFilterForm)
    setActiveFilters(initialFilterForm)
  }

  const handleExport = () => {
    setExportMessage('通報一覧を CSV としてエクスポートしました（モック）')
    setTimeout(() => setExportMessage(''), 4000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-08 / REPORT OPERATIONS
            </p>
            <h1 className="mt-2 text-4xl font-bold">通報管理</h1>
            <p className="text-sm text-white/70">
              通報内容から証跡までを横断し、審査・対応・履歴を一元的に管理します。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => reportsQuery.refetch()}
              disabled={reportsQuery.isFetching}
            >
              {reportsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              最新に更新
            </Button>
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              CSVエクスポート
            </Button>
          </div>
        </header>

        {exportMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            {exportMessage}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Filter className="h-5 w-5 text-rose-300" />
              通報検索フィルター
            </CardTitle>
            <CardDescription>
              通報ID・通話ID・カテゴリ・状態・期間で絞り込み、優先すべき案件に絞って確認します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-4">
                <input
                  value={filterForm.reportId}
                  onChange={(event) =>
                    handleFilterChange('reportId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="通報ID"
                />
                <input
                  value={filterForm.callId}
                  onChange={(event) =>
                    handleFilterChange('callId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="通話ID"
                />
                <input
                  value={filterForm.reporterId}
                  onChange={(event) =>
                    handleFilterChange('reporterId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="通報者ID"
                />
                <input
                  value={filterForm.targetId}
                  onChange={(event) =>
                    handleFilterChange('targetId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="対象ID"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={filterForm.category}
                  onChange={(event) =>
                    handleFilterChange(
                      'category',
                      event.target.value as FilterForm['category'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">カテゴリ（すべて）</option>
                  {Object.entries(categoryLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterForm.status}
                  onChange={(event) =>
                    handleFilterChange(
                      'status',
                      event.target.value as FilterForm['status'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">状態（すべて）</option>
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={filterForm.reportedFrom}
                  onChange={(event) =>
                    handleFilterChange('reportedFrom', event.target.value)
                  }
                  className={inputBaseClass}
                />
                <input
                  type="datetime-local"
                  value={filterForm.reportedTo}
                  onChange={(event) =>
                    handleFilterChange('reportedTo', event.target.value)
                  }
                  className={inputBaseClass}
                />
              </div>
              <div className="flex items-center gap-3">
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
                  リセット
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-4">
          <ReportStatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="通報総数"
            helper="受付済み"
            value={`${stats.total.toLocaleString()} 件`}
          />
          <ReportStatCard
            icon={<Siren className="h-5 w-5" />}
            label="未対応"
            helper="要一次対応"
            value={`${stats.unprocessed.toLocaleString()} 件`}
          />
          <ReportStatCard
            icon={<ShieldQuestion className="h-5 w-5" />}
            label="審査中"
            helper="レビュー進行中"
            value={`${stats.reviewing.toLocaleString()} 件`}
          />
          <ReportStatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="処理済"
            helper="クローズ済み"
            value={`${stats.resolved.toLocaleString()} 件`}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">通報一覧</CardTitle>
              <CardDescription>
                未対応を最優先で表示し、詳細画面から録音や通話ログを参照して処理を記録します。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {reports.length.toLocaleString()} 件
            </Badge>
          </CardHeader>
          <CardContent>
            {reportsQuery.status === 'pending' && <ReportTableSkeleton />}
            {reportsQuery.status === 'error' && (
              <ErrorBanner error={reportsQuery.error} />
            )}
            {reportsQuery.status === 'success' && (
              <ReportTable
                reports={reports}
                onSelect={(reportId) => setSelectedReportId(reportId)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ReportDetailDialog
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </div>
  )
}

function ReportTable({
  reports,
  onSelect,
}: {
  reports: Array<AdminReportSummary>
  onSelect: (reportId: string) => void
}) {
  if (!reports.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        条件に一致する通報がありません。
      </div>
    )
  }
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">通報ID</th>
            <th className="px-4 py-3 font-medium">通話ID</th>
            <th className="px-4 py-3 font-medium">通報者</th>
            <th className="px-4 py-3 font-medium">対象</th>
            <th className="px-4 py-3 font-medium">カテゴリ</th>
            <th className="px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium">通報日時</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-t border-white/10">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                  {report.id}
                  <Badge
                    variant={priorityVariant[report.priority]}
                    className="text-[11px]"
                  >
                    {priorityLabel[report.priority]}
                  </Badge>
                </div>
              </td>
              <td className="px-4 py-3 text-white/80">{report.callId}</td>
              <td className="px-4 py-3 text-white/80">
                {report.reporterId}
                <span className="text-white/40">
                  {' '}
                  / {targetTypeLabel[report.reporterType]}
                </span>
              </td>
              <td className="px-4 py-3 text-white/80">
                {report.targetId}
                <span className="text-white/40">
                  {' '}
                  / {targetTypeLabel[report.targetType]}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs">
                  {categoryLabel[report.category]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusBadgeVariant[report.status]}>
                  {statusLabel[report.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-white/70">
                {formatDateTime(report.reportedAt)}
              </td>
              <td className="px-4 py-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => onSelect(report.id)}
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

function ReportDetailDialog({
  reportId,
  onClose,
}: {
  reportId: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [resolutionAction, setResolutionAction] =
    useState<AdminReportAction>('warn')
  const [resolutionReason, setResolutionReason] = useState('')
  const [resolutionNotice, setResolutionNotice] = useState('')

  const detailQuery = useQuery<AdminReportDetail>({
    queryKey: ['admin-report-detail', reportId],
    queryFn: () => fetchAdminReportDetail(reportId ?? ''),
    enabled: Boolean(reportId),
  })

  const detailData = detailQuery.data

  useEffect(() => {
    if (detailData) {
      setResolutionAction(detailData.resolution?.action ?? 'warn')
      setResolutionReason(detailData.resolution?.reason ?? '')
      setResolutionNotice('')
    }
  }, [detailData])

  const statusMutation = useMutation({
    mutationFn: updateAdminReportStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.setQueryData(['admin-report-detail', data.id], data)
    },
  })

  const resolveMutation = useMutation({
    mutationFn: resolveAdminReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.setQueryData(['admin-report-detail', data.id], data)
      setResolutionNotice('処理内容を記録しました')
    },
    onError: (error: unknown) => {
      setResolutionNotice(
        error instanceof Error ? error.message : '処理の保存に失敗しました',
      )
    },
  })

  const handleStatusChange = (status: AdminReportStatus) => {
    if (!reportId) return
    statusMutation.mutate({
      reportId,
      status,
      operator: 'admin_console',
    })
  }

  const handleResolveSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reportId) return
    if (!resolutionReason.trim()) {
      setResolutionNotice('対応理由を入力してください')
      return
    }
    resolveMutation.mutate({
      reportId,
      action: resolutionAction,
      reason: resolutionReason.trim(),
      operator: 'admin_console',
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={Boolean(reportId)} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle>通報詳細</DialogTitle>
          <DialogDescription>
            通報内容や証跡を確認し、ステータス・処理を更新します。
          </DialogDescription>
        </DialogHeader>
        {detailQuery.status === 'pending' && <ReportDetailSkeleton />}
        {detailQuery.status === 'error' && (
          <ErrorBanner error={detailQuery.error} />
        )}
        {detailQuery.status === 'success' && detailData && (
          <ReportDetailContent
            detail={detailData}
            resolutionAction={resolutionAction}
            onActionChange={setResolutionAction}
            resolutionReason={resolutionReason}
            onReasonChange={setResolutionReason}
            resolutionNotice={resolutionNotice}
            onStatusChange={handleStatusChange}
            onResolve={handleResolveSubmit}
            statusMutationPending={statusMutation.isPending}
            resolveMutationPending={resolveMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReportDetailContent({
  detail,
  resolutionAction,
  onActionChange,
  resolutionReason,
  onReasonChange,
  resolutionNotice,
  onStatusChange,
  onResolve,
  statusMutationPending,
  resolveMutationPending,
}: {
  detail: AdminReportDetail
  resolutionAction: AdminReportAction
  onActionChange: (action: AdminReportAction) => void
  resolutionReason: string
  onReasonChange: (value: string) => void
  resolutionNotice: string
  onStatusChange: (status: AdminReportStatus) => void
  onResolve: (event: FormEvent<HTMLFormElement>) => void
  statusMutationPending: boolean
  resolveMutationPending: boolean
}) {
  const canMoveToReview = detail.status === 'unprocessed'
  const canMarkUnprocessed = detail.status !== 'unprocessed'
  const canResolve = detail.status === 'reviewing'

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant[detail.status]}>
            {statusLabel[detail.status]}
          </Badge>
          <Badge variant={priorityVariant[detail.priority]}>
            {priorityLabel[detail.priority]}
          </Badge>
          <Badge variant="outline">
            カテゴリ: {categoryLabel[detail.category]}
          </Badge>
        </div>
        <div className="grid gap-3 text-sm text-white/80 md:grid-cols-2">
          <InfoLine
            icon={<FlagTriangleRight className="h-4 w-4" />}
            label="通報ID"
            value={detail.id}
          />
          <InfoLine
            icon={<Briefcase className="h-4 w-4" />}
            label="通話ID"
            value={detail.callId}
          />
          <InfoLine
            icon={<Users className="h-4 w-4" />}
            label="通報者"
            value={`${detail.reporterId} / ${targetTypeLabel[detail.reporterType]}`}
          />
          <InfoLine
            icon={<Users className="h-4 w-4" />}
            label="対象"
            value={`${detail.targetId} / ${targetTypeLabel[detail.targetType]}`}
          />
          <InfoLine
            icon={<History className="h-4 w-4" />}
            label="通報日時"
            value={formatDateTime(detail.reportedAt)}
          />
          <InfoLine
            icon={<History className="h-4 w-4" />}
            label="最終更新"
            value={formatDateTime(detail.lastUpdatedAt)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-2xl">
            <a
              href={detail.evidence.callLogUrl}
              target="_blank"
              rel="noreferrer"
            >
              <BookOpenCheck className="h-4 w-4" />
              通話ログを見る
            </a>
          </Button>
          {detail.evidence.recordingAvailable && (
            <Button variant="secondary" className="rounded-2xl">
              <FileAudio2 className="h-4 w-4" />
              録音を再生
            </Button>
          )}
          <Button type="button" variant="ghost" className="rounded-2xl">
            <Download className="h-4 w-4" />
            証跡をダウンロード
          </Button>
        </div>
        {detail.evidence.recordingNote && (
          <p className="text-xs text-white/50">
            {detail.evidence.recordingNote}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold">通報内容</h3>
        <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-relaxed text-white/80">
          {detail.message}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">通話サマリー</h3>
          <div className="space-y-2 text-sm text-white/80">
            <InfoLine
              icon={<ClockIcon />}
              label="開始"
              value={formatDateTime(detail.callSummary.startedAt)}
            />
            <InfoLine
              icon={<ClockIcon />}
              label="終了"
              value={formatDateTime(detail.callSummary.endedAt)}
            />
            <InfoLine
              icon={<History className="h-4 w-4" />}
              label="通話時間"
              value={`${Math.floor(detail.callSummary.durationSeconds / 60)}分 ${detail.callSummary.durationSeconds % 60}秒`}
            />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">対象者情報</h3>
          <p className="text-sm text-white/70">
            {detail.targetProfile.headline}
          </p>
          <div className="grid gap-2">
            {detail.targetProfile.metrics.map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-3 py-2 text-sm',
                  metric.tone === 'danger'
                    ? 'border-rose-500/40 bg-rose-500/5 text-rose-100'
                    : metric.tone === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-50'
                      : 'border-white/10 bg-white/5 text-white/80',
                )}
              >
                <span>{metric.label}</span>
                <span>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">審査フロー</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => onStatusChange('unprocessed')}
              disabled={!canMarkUnprocessed || statusMutationPending}
            >
              {statusMutationPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              未対応に戻す
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              onClick={() => onStatusChange('reviewing')}
              disabled={!canMoveToReview || statusMutationPending}
            >
              {statusMutationPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldBan className="h-4 w-4" />
              )}
              審査中にする
            </Button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white/70">
            ステータスを更新すると A-10 操作ログにも記録されます。
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">処理内容</h3>
          <form className="space-y-3" onSubmit={onResolve}>
            <select
              value={resolutionAction}
              onChange={(event) =>
                onActionChange(event.target.value as AdminReportAction)
              }
              className={inputBaseClass}
              disabled={!canResolve || resolveMutationPending}
            >
              {Object.entries(actionLabel).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              value={resolutionReason}
              onChange={(event) => onReasonChange(event.target.value)}
              className={cn(
                inputBaseClass,
                'min-h-[100px] resize-none bg-white/0',
              )}
              placeholder="理由（監査ログに記録されます）"
              disabled={!canResolve || resolveMutationPending}
            />
            <Button
              type="submit"
              className="w-full rounded-2xl"
              disabled={!canResolve || resolveMutationPending}
            >
              {resolveMutationPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              処理を記録
            </Button>
            {resolutionNotice && (
              <p className="text-sm text-white/70">{resolutionNotice}</p>
            )}
            {detail.status === 'resolved' && detail.resolution && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <div className="font-semibold">
                  最終対応: {actionLabel[detail.resolution.action]}
                </div>
                <div className="text-white/80">{detail.resolution.reason}</div>
                <div className="text-xs text-white/50">
                  {formatDateTime(detail.resolution.resolvedAt)} /{' '}
                  {detail.resolution.operator}
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold">審査履歴</h3>
        {detail.history.length === 0 ? (
          <p className="text-sm text-white/60">履歴がまだありません。</p>
        ) : (
          <div className="space-y-2">
            {detail.history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="text-white/80">
                    {formatDateTime(entry.occurredAt)} / {entry.operator}
                  </span>
                  <span className="text-white/60">
                    {statusLabel[entry.status]}
                    {entry.resolutionAction &&
                      ` : ${actionLabel[entry.resolutionAction]}`}
                  </span>
                  {entry.note && (
                    <span className="text-xs text-white/40">{entry.note}</span>
                  )}
                </div>
                <Badge variant={statusBadgeVariant[entry.status]}>
                  {statusLabel[entry.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          disabled={detail.status !== 'resolved'}
        >
          通報をクローズする
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ReportStatCard({
  icon,
  label,
  helper,
  value,
}: {
  icon: ReactNode
  label: string
  helper: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            {helper}
          </p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className="text-sm text-white/70">{label}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-rose-200">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function ReportTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

function ReportDetailSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertCircle className="h-4 w-4" />
      {error instanceof Error ? error.message : 'データを取得できませんでした'}
    </div>
  )
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/50">{icon}</span>
      <span className="text-white/50">{label}:</span>
      <span className="text-white">{value}</span>
    </div>
  )
}

function buildReportStats(items: Array<AdminReportSummary>): ReportStats {
  return items.reduce<ReportStats>(
    (acc, item) => {
      acc.total += 1
      if (item.status === 'unprocessed') acc.unprocessed += 1
      else if (item.status === 'reviewing') acc.reviewing += 1
      else acc.resolved += 1
      return acc
    },
    { total: 0, unprocessed: 0, reviewing: 0, resolved: 0 },
  )
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour12: false,
  })
}

function ClockIcon() {
  return <History className="h-4 w-4" />
}
