import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarClock,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Users,
} from 'lucide-react'

import type { ChangeEvent, FormEvent } from 'react'

import type {
  AdminOtomoDetail,
  AdminOtomoListFilters,
  AdminOtomoStatus,
  AdminOtomoSummary,
  AdminReportFilter,
} from '@/lib/api'
import {
  fetchAdminOtomoDetail,
  fetchAdminOtomoList,
  updateAdminOtomoStatus,
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

export const Route = createFileRoute('/admin/otomo')({
  component: AdminOtomoScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const statusLabel: Record<AdminOtomoStatus, { label: string; badge: string }> =
  {
    underReview: { label: '審査中', badge: 'info' },
    approved: { label: '承認済み', badge: 'success' },
    paused: { label: '一時停止', badge: 'warning' },
    frozen: { label: '凍結', badge: 'danger' },
  }

const presenceLabel = {
  online: 'オンライン',
  offline: 'オフライン',
} as const

const statusOptions: Array<{ id: AdminOtomoStatus | 'all'; label: string }> = [
  { id: 'all', label: '状態 - すべて' },
  { id: 'underReview', label: statusLabel.underReview.label },
  { id: 'approved', label: statusLabel.approved.label },
  { id: 'paused', label: statusLabel.paused.label },
  { id: 'frozen', label: statusLabel.frozen.label },
]

const reportOptions: Array<{ id: AdminReportFilter | 'all'; label: string }> = [
  { id: 'all', label: '通報フィルターなし' },
  { id: 'none', label: '通報 0 件' },
  { id: 'onePlus', label: '1 件以上' },
  { id: 'many', label: '3 件以上' },
]

const presenceOptions = [
  { id: 'all', label: '稼働状況 - すべて' },
  { id: 'online', label: 'オンライン' },
  { id: 'offline', label: 'オフライン' },
] as const

const callVolumeOptions = [
  { id: 'all', label: '通話実績 - すべて' },
  { id: 'low', label: 'ライト（~120件）' },
  { id: 'mid', label: '標準（120〜299件）' },
  { id: 'high', label: '多い（300件〜）' },
] as const

type SortKey = 'calls' | 'rating' | 'lastLogin'
type SortOrder = 'asc' | 'desc'

type FormFilters = {
  otomoId: string
  name: string
  email: string
  status: AdminOtomoStatus | 'all'
  reportFilter: AdminReportFilter | 'all'
  minRating: string
  presence: 'online' | 'offline' | 'all'
  callVolume: 'low' | 'mid' | 'high' | 'all'
  sortBy: SortKey
  sortOrder: SortOrder
}

const initialFormFilters: FormFilters = {
  otomoId: '',
  name: '',
  email: '',
  status: 'all',
  reportFilter: 'all',
  minRating: '4.0',
  presence: 'all',
  callVolume: 'all',
  sortBy: 'lastLogin',
  sortOrder: 'desc',
}

type HeadlineStats = {
  total: number
  flagged: number
  online: number
  averageRating: number
  statusCounts: Record<AdminOtomoStatus, number>
  lastUpdated: string
}

const emptyStats: HeadlineStats = {
  total: 0,
  flagged: 0,
  online: 0,
  averageRating: 0,
  statusCounts: {
    underReview: 0,
    approved: 0,
    paused: 0,
    frozen: 0,
  },
  lastUpdated: '-',
}

function AdminOtomoScreen() {
  const [formFilters, setFormFilters] =
    useState<FormFilters>(initialFormFilters)
  const [activeFilters, setActiveFilters] = useState<AdminOtomoListFilters>(
    buildListFilters(initialFormFilters),
  )
  const [selectedOtomoId, setSelectedOtomoId] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState('')

  const otomoQuery = useQuery({
    queryKey: ['admin-otomo', activeFilters],
    queryFn: (): Promise<AdminOtomoSummary[]> =>
      fetchAdminOtomoList(activeFilters),
    placeholderData: (previousData): AdminOtomoSummary[] | undefined =>
      previousData,
  })

  const otomos: AdminOtomoSummary[] = otomoQuery.data ?? []
  const stats = useMemo(() => buildStats(otomos), [otomos])

  const handleInputChange =
    (field: keyof FormFilters) =>
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
    if (!otomos.length) {
      setExportMessage('エクスポート対象がありません')
      return
    }
    if (typeof window === 'undefined') {
      setExportMessage('ブラウザからのみエクスポートできます')
      return
    }
    const csv = createCsvFromOtomos(otomos)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `otomohan-admin-otomo-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExportMessage(`${otomos.length}件のプロバイダーを出力しました`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-03 / OTOMO MANAGEMENT
            </p>
            <h1 className="mt-2 text-4xl font-bold">おともはん管理</h1>
            <p className="text-sm text-white/70">
              審査・通話品質・通報状況を一元監視し、安全なサービス品質を守ります。
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => otomoQuery.refetch()}
            disabled={otomoQuery.isFetching}
          >
            {otomoQuery.isFetching ? (
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
              おともはん検索
            </CardTitle>
            <CardDescription>
              ID・評価・通報数・稼働状況で厳格に絞り込み、対応優先度を判断します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={formFilters.otomoId}
                  onChange={handleInputChange('otomoId')}
                  className={inputBaseClass}
                  placeholder="おともはんID (otomo_xxx)"
                />
                <input
                  value={formFilters.name}
                  onChange={handleInputChange('name')}
                  className={inputBaseClass}
                  placeholder="表示名 (部分一致)"
                />
                <input
                  value={formFilters.email}
                  onChange={handleInputChange('email')}
                  className={inputBaseClass}
                  placeholder="メールアドレス"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
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
                  value={formFilters.reportFilter}
                  onChange={handleInputChange('reportFilter')}
                  className={inputBaseClass}
                >
                  {reportOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={formFilters.presence}
                  onChange={handleInputChange('presence')}
                  className={inputBaseClass}
                >
                  {presenceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={formFilters.callVolume}
                  onChange={handleInputChange('callVolume')}
                  className={inputBaseClass}
                >
                  {callVolumeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={formFilters.minRating}
                  onChange={handleInputChange('minRating')}
                  className={inputBaseClass}
                  placeholder="最低平均評価 (例: 4.0)"
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">並び替え</span>
                  <select
                    value={formFilters.sortBy}
                    onChange={handleInputChange('sortBy')}
                    className={cn(inputBaseClass, 'bg-white/0')}
                  >
                    <option value="lastLogin">最終ログイン</option>
                    <option value="calls">累計通話数</option>
                    <option value="rating">平均評価</option>
                  </select>
                  <select
                    value={formFilters.sortOrder}
                    onChange={handleInputChange('sortOrder')}
                    className={cn(inputBaseClass, 'bg-white/0')}
                  >
                    <option value="desc">降順</option>
                    <option value="asc">昇順</option>
                  </select>
                </div>
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
            title="登録おともはん"
            value={`${stats.total.toLocaleString()} 名`}
            helper="検索結果"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="平均評価"
            value={stats.averageRating.toFixed(2)}
            helper="フィルター対象"
            icon={<Star className="h-5 w-5" />}
          />
          <StatCard
            title="稼働中"
            value={`${stats.online.toLocaleString()} 名`}
            helper="オンライン"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            title="通報注意"
            value={`${stats.flagged.toLocaleString()} 名`}
            helper="通報3件以上"
            icon={<ShieldAlert className="h-5 w-5" />}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-2xl">おともはん一覧</CardTitle>
              <CardDescription>
                ステータスと通話実績を可視化し、詳細モーダルから審査・凍結を即時実行。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {stats.lastUpdated}
            </Badge>
          </CardHeader>
          <CardContent>
            {otomoQuery.status === 'pending' && <OtomoTableSkeleton />}
            {otomoQuery.status === 'error' && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {otomoQuery.error instanceof Error
                    ? otomoQuery.error.message
                    : 'おともはん一覧を取得できませんでした'}
                </span>
              </div>
            )}
            {otomoQuery.status === 'success' && (
              <OtomoTable otomos={otomos} onSelect={setSelectedOtomoId} />
            )}
          </CardContent>
        </Card>
      </div>

      <AdminOtomoDetailDialog
        otomoId={selectedOtomoId}
        onClose={() => setSelectedOtomoId(null)}
      />
    </div>
  )
}

function OtomoTable({
  otomos,
  onSelect,
}: {
  otomos: Array<AdminOtomoSummary>
  onSelect: (id: string) => void
}) {
  if (!otomos.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        対象データがありません。条件を変えて再検索してください。
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="text-white/60">
            <th className="px-4 py-2 font-semibold">ID</th>
            <th className="px-4 py-2 font-semibold">名前</th>
            <th className="px-4 py-2 font-semibold">状態</th>
            <th className="px-4 py-2 font-semibold">平均評価</th>
            <th className="px-4 py-2 font-semibold">通話実績</th>
            <th className="px-4 py-2 font-semibold">通報</th>
            <th className="px-4 py-2 font-semibold">稼働</th>
            <th className="px-4 py-2 font-semibold">最終ログイン</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {otomos.map((otomo) => (
            <tr
              key={otomo.id}
              className="border-t border-white/5 transition hover:bg-white/5"
            >
              <td className="px-4 py-3 font-mono text-xs text-white/70">
                {otomo.id}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-semibold">{otomo.displayName}</span>
                  <span className="text-xs text-white/60">{otomo.email}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusLabel[otomo.status].badge as never}>
                  {statusLabel[otomo.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold">
                    {otomo.averageRating.toFixed(2)}
                  </span>
                  <span className="text-xs text-white/60">
                    ({otomo.reviewCount})
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col text-xs text-white/80">
                  <span>{otomo.callCount.toLocaleString()} 回</span>
                  <span>{otomo.callMinutes.toLocaleString()} 分</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center text-white/80">
                {otomo.reportCount}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                    otomo.presence === 'online'
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : 'bg-white/5 text-white/50',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      otomo.presence === 'online'
                        ? 'bg-emerald-400'
                        : 'bg-white/30',
                    )}
                  />
                  {presenceLabel[otomo.presence]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-white/70">
                {formatDateTime(otomo.lastLoginAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelect(otomo.id)}
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

function OtomoTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  )
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

function buildStats(otomos: Array<AdminOtomoSummary>): HeadlineStats {
  if (!otomos.length) {
    return emptyStats
  }
  const flagThreshold = 3
  const statusCounts: HeadlineStats['statusCounts'] = {
    underReview: 0,
    approved: 0,
    paused: 0,
    frozen: 0,
  }
  let ratingSum = 0
  let online = 0
  let flagged = 0

  otomos.forEach((otomo) => {
    statusCounts[otomo.status] += 1
    ratingSum += otomo.averageRating
    if (otomo.presence === 'online') online += 1
    if (otomo.reportCount >= flagThreshold) flagged += 1
  })

  return {
    total: otomos.length,
    flagged,
    online,
    averageRating: ratingSum / otomos.length,
    statusCounts,
    lastUpdated: new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function buildListFilters(form: FormFilters): AdminOtomoListFilters {
  return {
    otomoId: form.otomoId.trim() || undefined,
    name: form.name.trim() || undefined,
    email: form.email.trim().toLowerCase() || undefined,
    status: form.status === 'all' ? undefined : form.status,
    reportFilter: form.reportFilter === 'all' ? undefined : form.reportFilter,
    presence: form.presence === 'all' ? undefined : form.presence,
    callVolume: form.callVolume === 'all' ? undefined : form.callVolume,
    minRating: Number(form.minRating) || undefined,
    sortBy: form.sortBy,
    sortOrder: form.sortOrder,
  }
}

function createCsvFromOtomos(otomos: Array<AdminOtomoSummary>) {
  const header = [
    'id',
    'displayName',
    'email',
    'status',
    'presence',
    'averageRating',
    'reviewCount',
    'callCount',
    'callMinutes',
    'reportCount',
    'lastLoginAt',
  ]
  const rows = otomos.map((otomo) => [
    otomo.id,
    otomo.displayName,
    otomo.email,
    statusLabel[otomo.status].label,
    presenceLabel[otomo.presence],
    otomo.averageRating.toFixed(2),
    otomo.reviewCount.toString(),
    otomo.callCount.toString(),
    otomo.callMinutes.toString(),
    otomo.reportCount.toString(),
    formatDateTime(otomo.lastLoginAt),
  ])
  return [header, ...rows]
    .map((columns) =>
      columns.map((column) => `"${column.replace(/"/g, '""')}"`).join(','),
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

type StatusAction = {
  label: string
  nextStatus: AdminOtomoStatus
  variant: 'secondary' | 'destructive' | 'default'
}

function getStatusActions(status: AdminOtomoStatus): Array<StatusAction> {
  if (status === 'approved') {
    return [
      { label: '一時停止にする', nextStatus: 'paused', variant: 'secondary' },
      { label: '凍結する', nextStatus: 'frozen', variant: 'destructive' },
    ]
  }
  if (status === 'paused') {
    return [
      { label: '稼働を再開', nextStatus: 'approved', variant: 'default' },
      { label: '凍結する', nextStatus: 'frozen', variant: 'destructive' },
    ]
  }
  if (status === 'frozen') {
    return [{ label: '凍結を解除', nextStatus: 'approved', variant: 'default' }]
  }
  return [
    { label: '承認する', nextStatus: 'approved', variant: 'default' },
    { label: '一時停止する', nextStatus: 'paused', variant: 'secondary' },
  ]
}

function AdminOtomoDetailDialog({
  otomoId,
  onClose,
}: {
  otomoId: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [statusAction, setStatusAction] = useState<{
    label: string
    nextStatus: AdminOtomoStatus
  } | null>(null)

  const detailQuery = useQuery<AdminOtomoDetail>({
    queryKey: ['admin-otomo-detail', otomoId],
    queryFn: () => fetchAdminOtomoDetail(otomoId as string),
    enabled: Boolean(otomoId),
  })

  const statusMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!otomoId || !statusAction) {
        throw new Error('対象が選択されていません')
      }
      return updateAdminOtomoStatus({
        otomoId,
        nextStatus: statusAction.nextStatus,
        reason,
      })
    },
    onSuccess: (detail) => {
      if (!otomoId) return
      queryClient.setQueryData(['admin-otomo-detail', otomoId], detail)
      queryClient.invalidateQueries({ queryKey: ['admin-otomo'] })
      setStatusAction(null)
    },
  })

  const handleClose = () => {
    onClose()
    setStatusAction(null)
    statusMutation.reset()
  }

  return (
    <Dialog
      open={Boolean(otomoId)}
      onOpenChange={(next) => !next && handleClose()}
    >
      <DialogContent className="max-h-[90vh] w-full max-w-6xl overflow-y-auto bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle>おともはん詳細</DialogTitle>
          <DialogDescription className="text-white/60">
            プロフィール・実績・通報を確認し、状態変更を記録します。
          </DialogDescription>
        </DialogHeader>
        {detailQuery.status === 'pending' && <DetailSkeleton />}
        {detailQuery.status === 'error' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <AlertCircle className="h-4 w-4" />
            <span>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : '詳細を取得できませんでした'}
            </span>
          </div>
        )}
        {detailQuery.status === 'success' && (
          <AdminOtomoDetailBody
            detail={detailQuery.data}
            onRequestStatusChange={(action) => setStatusAction(action)}
          />
        )}
      </DialogContent>
      <StatusChangeDialog
        action={statusAction}
        loading={statusMutation.isPending}
        errorMessage={
          statusMutation.error instanceof Error
            ? statusMutation.error.message
            : ''
        }
        onCancel={() => {
          setStatusAction(null)
          statusMutation.reset()
        }}
        onConfirm={(reason) => statusMutation.mutate(reason)}
      />
    </Dialog>
  )
}

function AdminOtomoDetailBody({
  detail,
  onRequestStatusChange,
}: {
  detail: AdminOtomoDetail
  onRequestStatusChange: (action: {
    label: string
    nextStatus: AdminOtomoStatus
  }) => void
}) {
  const actions = getStatusActions(detail.status)

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={detail.avatarUrl}
            alt={detail.displayName}
            className="h-20 w-20 rounded-3xl object-cover"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">
              {detail.id}
            </p>
            <h2 className="text-3xl font-semibold">{detail.displayName}</h2>
            <p className="text-sm text-white/70">{detail.profileTitle}</p>
            <p className="text-xs text-white/50">
              登録日 {formatDateTime(detail.registeredAt)} / 最終ログイン{' '}
              {formatDateTime(detail.lastLoginAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusLabel[detail.status].badge as never}>
            {statusLabel[detail.status].label}
          </Badge>
          <Badge variant="outline">{presenceLabel[detail.presence]}</Badge>
          {detail.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="通話数"
          value={`${detail.callMetrics.totalCalls.toLocaleString()} 回`}
          helper="累計"
        />
        <MetricCard
          label="合計通話時間"
          value={`${detail.callMetrics.totalMinutes.toLocaleString()} 分`}
          helper="累計"
        />
        <MetricCard
          label="平均通話時間"
          value={`${detail.callMetrics.averageMinutes.toFixed(1)} 分`}
          helper="直近30日"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">通話実績（直近30日）</h3>
            <Badge variant="info" className="text-xs flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              A-06 連携
            </Badge>
          </div>
          <p className="mt-1 text-sm text-white/60">
            ピーク帯を把握し、通話品質トラブル時は A-06
            の個別通話詳細へジャンプ。
          </p>
          <CallTrendChart points={detail.callMetrics.last30Days} />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h3 className="text-lg font-semibold">人気時間帯</h3>
          <ul className="space-y-3 text-sm text-white/80">
            {detail.callMetrics.popularSlots.map((slot) => (
              <li
                key={slot.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2"
              >
                <span>{slot.label}</span>
                <span className="font-mono text-xs text-white/60">
                  {slot.calls} 回 / {slot.minutes} 分
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">アカウント状態</h3>
            <p className="text-sm text-white/60">
              状態変更時は必ず理由を入力し、A-10 管理ログへ記録します。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button
                key={action.nextStatus}
                variant={action.variant}
                className="rounded-2xl"
                onClick={() => onRequestStatusChange(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-white/80 md:grid-cols-2">
          <div>
            <p className="text-white/50">氏名</p>
            <p className="font-semibold">{detail.legalName}</p>
          </div>
          <div>
            <p className="text-white/50">メール</p>
            <p className="font-mono text-xs">{detail.email}</p>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/80">
          {detail.profileBio}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">レビュー</h3>
            <Badge variant="outline">
              ★ {detail.reviewStats.averageRating.toFixed(2)} /{' '}
              {detail.reviewStats.reviewCount} 件
            </Badge>
          </div>
          <p className="text-sm text-white/60">
            {detail.reviewStats.highlight}
          </p>
          <div className="space-y-2">
            {detail.reviewStats.distribution.map((entry) => (
              <div key={entry.rating}>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>★{entry.rating}</span>
                  <span>
                    {entry.count}件 ({entry.percentage}%)
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${entry.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {detail.recentReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-white/60">
                    {review.userId}
                  </span>
                  <span className="font-semibold text-amber-300">
                    ★{review.rating}
                  </span>
                </div>
                <p className="mt-2 text-white/80">{review.comment}</p>
                <p className="mt-1 text-xs text-white/40">
                  {formatDateTime(review.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">通報履歴</h3>
            <Badge variant="danger">{detail.reportCount} 件</Badge>
          </div>
          <ul className="space-y-3 text-sm">
            {detail.reports.length === 0 && (
              <li className="rounded-2xl border border-white/10 px-4 py-3 text-white/60">
                通報はありません。
              </li>
            )}
            {detail.reports.map((report) => (
              <li
                key={report.id}
                className="rounded-2xl border border-white/10 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-white/60">
                    {report.reporterId}
                  </span>
                  <Badge
                    variant={
                      report.status === 'resolved' ? 'success' : 'warning'
                    }
                    className="text-[10px]"
                  >
                    {report.status === 'resolved' ? '対応済み' : '調査中'}
                  </Badge>
                </div>
                <p className="mt-2 font-semibold">{report.reason}</p>
                <p className="text-xs text-white/40">
                  {formatDateTime(report.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">稼働スケジュール</h3>
            <Badge variant="outline" className="text-xs">
              <CalendarClock className="mr-1 h-4 w-4" />
              O-06 連携
            </Badge>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {detail.schedule.map((day) => (
              <li
                key={day.dayLabel}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-2"
              >
                <span className="font-semibold">{day.dayLabel}</span>
                {day.isDayOff ? (
                  <span className="text-xs text-white/50">休み</span>
                ) : (
                  <span className="text-xs text-white/70">
                    {day.slots
                      .map((slot) => `${slot.start}〜${slot.end}`)
                      .join(' / ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h3 className="text-lg font-semibold">添付資料 / 管理ログ</h3>
          <div className="space-y-3">
            {detail.attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{file.label}</p>
                  {file.note && (
                    <p className="text-xs text-white/50">{file.note}</p>
                  )}
                </div>
                <Badge variant={file.confidential ? 'danger' : 'outline'}>
                  {file.type === 'document' ? '書類' : '音声'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-xs">
            {detail.auditLog.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-white/60">
                  <Badge variant={statusLabel[entry.status].badge as never}>
                    {statusLabel[entry.status].label}
                  </Badge>
                  <span className="font-mono">{entry.changedBy}</span>
                  <span>{formatDateTime(entry.changedAt)}</span>
                </div>
                <p className="mt-1 text-white/80">{entry.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        {helper}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  )
}

function CallTrendChart({
  points,
}: {
  points: AdminOtomoDetail['callMetrics']['last30Days']
}) {
  if (!points.length) {
    return (
      <p className="mt-6 text-sm text-white/60">
        チャートを表示するデータがありません。
      </p>
    )
  }
  const maxCalls = Math.max(...points.map((point) => point.calls), 1)
  return (
    <div className="mt-6 flex items-end gap-2 overflow-x-auto">
      {points.map((point) => {
        const height = Math.max((point.calls / maxCalls) * 90, 8)
        return (
          <div key={point.label} className="flex flex-col items-center gap-2">
            <div
              className="w-4 rounded-full bg-gradient-to-t from-rose-500/20 to-rose-300/80"
              style={{ height: `${height}px` }}
            />
            <span className="text-[10px] text-white/50">{point.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-3xl" />
      ))}
    </div>
  )
}

function StatusChangeDialog({
  action,
  loading,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  action: { label: string; nextStatus: AdminOtomoStatus } | null
  loading: boolean
  errorMessage: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (action) {
      setReason('')
    }
  }, [action?.nextStatus])

  return (
    <Dialog open={Boolean(action)} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-full max-w-md bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle>{action?.label}</DialogTitle>
          <DialogDescription className="text-white/60">
            変更理由を入力すると A-10 管理ログへ記録されます。
          </DialogDescription>
        </DialogHeader>
        <textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none"
          placeholder="例：通報内容を確認したため一時停止とします"
        />
        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {errorMessage}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '実行する'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
