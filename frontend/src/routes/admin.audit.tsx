import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Code,
  ExternalLink,
  Filter,
  Fingerprint,
  History,
  Info,
  ListFilter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Undo2,
} from 'lucide-react'

import type { FormEvent, ReactNode } from 'react'

import type {
  AdminAuditActionCategory,
  AdminAuditActionType,
  AdminAuditDetail,
  AdminAuditFilters,
  AdminAuditResult,
  AdminAuditSummary,
  AdminAuditTargetType,
} from '@/lib/api'
import {
  adminAuditActionCatalog,
  fetchAdminAuditLogDetail,
  fetchAdminAuditLogs,
} from '@/lib/api'
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

export const Route = createFileRoute('/admin/audit')({
  component: AdminAuditLogsScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const actionCategoryLabel: Record<AdminAuditActionCategory, string> = {
  user: 'ユーザー操作',
  otomo: 'おともはん操作',
  notification: '通知',
  review: 'レビュー',
  call: '通話ログ',
  system: 'システム',
}

const targetTypeLabel: Record<AdminAuditTargetType, string> = {
  user: 'ユーザー',
  otomo: 'おともはん',
  call: '通話',
  review: 'レビュー',
  notification: '通知',
  system: 'システム',
}

const resultLabel: Record<AdminAuditResult, string> = {
  success: '成功',
  failed: '失敗',
}

const resultBadgeVariant: Record<AdminAuditResult, 'success' | 'danger'> = {
  success: 'success',
  failed: 'danger',
}

type FilterForm = {
  adminId: string
  actionCategory: '' | AdminAuditActionCategory
  action: '' | AdminAuditActionType
  targetId: string
  targetType: '' | AdminAuditTargetType
  result: '' | AdminAuditResult
  ip: string
  keyword: string
  occurredFrom: string
  occurredTo: string
}

const initialFilterForm: FilterForm = {
  adminId: '',
  actionCategory: '',
  action: '',
  targetId: '',
  targetType: '',
  result: '',
  ip: '',
  keyword: '',
  occurredFrom: '',
  occurredTo: '',
}

type AuditStats = {
  total: number
  success: number
  failed: number
  uniqueAdmins: number
}

function AdminAuditLogsScreen() {
  const [filterForm, setFilterForm] = useState<FilterForm>(initialFilterForm)
  const [activeFilters, setActiveFilters] =
    useState<FilterForm>(initialFilterForm)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  const logsQuery = useQuery<Array<AdminAuditSummary>>({
    queryKey: ['admin-audit', activeFilters],
    queryFn: () =>
      fetchAdminAuditLogs({
        adminId: activeFilters.adminId || undefined,
        actionCategory: activeFilters.actionCategory || undefined,
        action: activeFilters.action || undefined,
        targetId: activeFilters.targetId || undefined,
        targetType: activeFilters.targetType || undefined,
        result: activeFilters.result || undefined,
        ip: activeFilters.ip || undefined,
        keyword: activeFilters.keyword || undefined,
        occurredFrom: activeFilters.occurredFrom || undefined,
        occurredTo: activeFilters.occurredTo || undefined,
      }),
    keepPreviousData: true,
  })

  const logs = logsQuery.data ?? []
  const stats = useMemo<AuditStats>(() => buildAuditStats(logs), [logs])

  const actionOptions = useMemo(() => {
    const entries = Object.entries(adminAuditActionCatalog)
    if (!filterForm.actionCategory) {
      return entries
    }
    return entries.filter(
      ([, value]) => value.category === filterForm.actionCategory,
    )
  }, [filterForm.actionCategory])

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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-10 / AUDIT LEDGER
            </p>
            <h1 className="mt-2 text-4xl font-bold">管理操作ログ</h1>
            <p className="text-sm text-white/70">
              誰が・いつ・何を行ったかを追跡し、誤操作や不正を即座に棚卸します。
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => logsQuery.refetch()}
            disabled={logsQuery.isFetching}
          >
            {logsQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            最新に更新
          </Button>
        </header>

        <div className="flex items-start gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <Fingerprint className="mt-0.5 h-4 w-4" />
          <p>
            監査ログは Append Only
            で保存され、改ざん不可の設計です。検索結果は常に UTC→JST
            で表示されます。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Filter className="h-5 w-5 text-rose-300" />
              操作ログフィルター
            </CardTitle>
            <CardDescription>
              管理者・操作種別・対象・成功可否・IP・キーワードを指定して追跡します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-4">
                <input
                  value={filterForm.adminId}
                  onChange={(event) =>
                    handleFilterChange('adminId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="管理者ID"
                />
                <select
                  value={filterForm.actionCategory}
                  onChange={(event) =>
                    handleFilterChange(
                      'actionCategory',
                      event.target.value as FilterForm['actionCategory'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">操作カテゴリ（すべて）</option>
                  {Object.entries(actionCategoryLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterForm.action}
                  onChange={(event) =>
                    handleFilterChange(
                      'action',
                      event.target.value as FilterForm['action'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">操作種別（すべて）</option>
                  {actionOptions.map(([value, meta]) => (
                    <option value={value} key={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <input
                  value={filterForm.targetId}
                  onChange={(event) =>
                    handleFilterChange('targetId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="対象ID（ユーザー / おとも / 通話）"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={filterForm.targetType}
                  onChange={(event) =>
                    handleFilterChange(
                      'targetType',
                      event.target.value as FilterForm['targetType'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">対象種別（すべて）</option>
                  {Object.entries(targetTypeLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterForm.result}
                  onChange={(event) =>
                    handleFilterChange(
                      'result',
                      event.target.value as FilterForm['result'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">結果（すべて）</option>
                  {Object.entries(resultLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={filterForm.ip}
                  onChange={(event) =>
                    handleFilterChange('ip', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="IPアドレス"
                />
                <input
                  value={filterForm.keyword}
                  onChange={(event) =>
                    handleFilterChange('keyword', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="キーワード（JSON・理由）"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="datetime-local"
                  value={filterForm.occurredFrom}
                  onChange={(event) =>
                    handleFilterChange('occurredFrom', event.target.value)
                  }
                  className={inputBaseClass}
                />
                <input
                  type="datetime-local"
                  value={filterForm.occurredTo}
                  onChange={(event) =>
                    handleFilterChange('occurredTo', event.target.value)
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
                  <Undo2 className="h-4 w-4" />
                  リセット
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-4">
          <AuditStatCard
            icon={<ListFilter className="h-5 w-5" />}
            label="該当ログ"
            helper="抽出件数"
            value={`${stats.total.toLocaleString()} 件`}
          />
          <AuditStatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="成功操作"
            helper="result = success"
            value={`${stats.success.toLocaleString()} 件`}
          />
          <AuditStatCard
            icon={<ShieldAlert className="h-5 w-5" />}
            label="失敗操作"
            helper="result = failed"
            value={`${stats.failed.toLocaleString()} 件`}
          />
          <AuditStatCard
            icon={<History className="h-5 w-5" />}
            label="関与管理者"
            helper="ユニークID"
            value={`${stats.uniqueAdmins.toLocaleString()} 名`}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">監査ログ一覧</CardTitle>
              <CardDescription>
                重要操作を全件追跡し、詳細で JSON 記録とリンク先を確認できます。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {logs.length.toLocaleString()} 件
            </Badge>
          </CardHeader>
          <CardContent>
            {logsQuery.status === 'pending' && <AuditTableSkeleton />}
            {logsQuery.status === 'error' && (
              <ErrorBanner error={logsQuery.error} />
            )}
            {logsQuery.status === 'success' && (
              <AuditTable logs={logs} onSelect={setSelectedLogId} />
            )}
          </CardContent>
        </Card>
      </div>

      <AuditDetailDialog
        logId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  )
}

function AuditTable({
  logs,
  onSelect,
}: {
  logs: Array<AdminAuditSummary>
  onSelect: (logId: string) => void
}) {
  if (!logs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        条件に一致するログがありません。
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">ログID</th>
            <th className="px-4 py-3 font-medium">管理者</th>
            <th className="px-4 py-3 font-medium">操作種別</th>
            <th className="px-4 py-3 font-medium">対象</th>
            <th className="px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">結果</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-white/10">
              <td className="px-4 py-3 text-white">{log.id}</td>
              <td className="px-4 py-3 text-white/80">{log.adminId}</td>
              <td className="px-4 py-3 text-white/80">
                <div className="flex flex-col">
                  <span>{log.actionLabel}</span>
                  <span className="text-xs text-white/40">
                    {actionCategoryLabel[log.actionCategory]}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-white/80">
                <div className="flex flex-col">
                  <span>{log.targetId}</span>
                  <span className="text-xs text-white/40">
                    {targetTypeLabel[log.targetType]}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-white/70">
                {formatDateTime(log.occurredAt)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={resultBadgeVariant[log.result]}>
                  {resultLabel[log.result]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => onSelect(log.id)}
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

function AuditTableSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <Skeleton className="h-5 w-full rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function ErrorBanner({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : 'ログの取得に失敗しました'
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertTriangle className="h-4 w-4" />
      {message}
    </div>
  )
}

function AuditStatCard({
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
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-4">
      <div className="flex items-center justify-between text-white/60">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
          {icon}
          {label}
        </div>
        <span className="text-xs text-white/40">{helper}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function AuditDetailDialog({
  logId,
  onClose,
}: {
  logId: string | null
  onClose: () => void
}) {
  const detailQuery = useQuery<AdminAuditDetail>({
    queryKey: ['admin-audit-detail', logId],
    queryFn: () => fetchAdminAuditLogDetail(logId ?? ''),
    enabled: Boolean(logId),
  })

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  let detailDialogContent: ReactNode = null
  if (detailQuery.status === 'success') {
    detailDialogContent = <AuditDetailContent detail={detailQuery.data} />
  }

  return (
    <Dialog open={Boolean(logId)} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle>操作ログ詳細</DialogTitle>
          <DialogDescription>
            監査用 JSON と連携リンクを確認し、インシデント対応に活用します。
          </DialogDescription>
        </DialogHeader>
        {detailQuery.status === 'pending' && <AuditDetailSkeleton />}
        {detailQuery.status === 'error' && (
          <ErrorBanner error={detailQuery.error} />
        )}
        {detailDialogContent}
      </DialogContent>
    </Dialog>
  )
}

function AuditDetailContent({ detail }: { detail: AdminAuditDetail }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{detail.id}</Badge>
          <Badge variant={resultBadgeVariant[detail.result]}>
            {resultLabel[detail.result]}
          </Badge>
          <Badge variant="outline">{detail.actionLabel}</Badge>
        </div>
        {detail.failureReason && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
            失敗理由: {detail.failureReason}
          </div>
        )}
        <div className="grid gap-3 text-sm text-white/80 md:grid-cols-2">
          <InfoLine label="管理者ID" value={detail.adminId} />
          <InfoLine label="IPアドレス" value={detail.ip} />
          <InfoLine
            label="対象"
            value={`${targetTypeLabel[detail.targetType]} / ${detail.targetId}`}
          />
          <InfoLine label="操作種別" value={detail.action} />
          <InfoLine label="日時" value={formatDateTime(detail.occurredAt)} />
          <InfoLine
            label="カテゴリ"
            value={actionCategoryLabel[detail.actionCategory]}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-rose-300" />
          <h3 className="text-lg font-semibold">操作詳細 JSON</h3>
        </div>
        <pre className="select-none overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-relaxed text-white/80">
          {JSON.stringify(detail.detail, null, 2)}
        </pre>
        <p className="text-xs text-white/40">
          コピー禁止設定のため選択できません。権限者は専用監査APIから取得してください。
        </p>
      </section>

      {detail.relatedLinks && detail.relatedLinks.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-300" />
            <h3 className="text-lg font-semibold">連携リンク</h3>
          </div>
          <div className="flex flex-col gap-3">
            {detail.relatedLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="secondary"
                className="justify-start rounded-2xl"
              >
                <a href={link.href} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <div className="text-left">
                    <div>{link.label}</div>
                    {link.description && (
                      <div className="text-xs text-white/70">
                        {link.description}
                      </div>
                    )}
                  </div>
                </a>
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AuditDetailSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((section) => (
        <div
          key={section}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <Skeleton className="mb-3 h-6 w-40 rounded-full bg-white/10" />
          <Skeleton className="h-4 w-full rounded-full bg-white/10" />
          <Skeleton className="mt-2 h-4 w-3/4 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
      <span className="text-xs uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
      <span className="text-white/90">{value}</span>
    </div>
  )
}

function buildAuditStats(logs: Array<AdminAuditSummary>): AuditStats {
  const success = logs.filter((log) => log.result === 'success').length
  const failed = logs.filter((log) => log.result === 'failed').length
  const uniqueAdmins = new Set(logs.map((log) => log.adminId)).size
  return {
    total: logs.length,
    success,
    failed,
    uniqueAdmins,
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
