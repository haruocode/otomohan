import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Coins,
  History,
  Loader2,
  Menu,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
} from 'lucide-react'

import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
} from 'react'
import type { AdminPointDashboard, AdminPointSearchFilters } from '@/lib/api'
import {
  deductAdminPoints,
  fetchAdminPointDashboard,
  grantAdminPoints,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type AdjustmentMode = 'add' | 'subtract'

type ConfirmState = {
  mode: AdjustmentMode
  amount: number
  reason: string
}

type ToastState = {
  type: 'success' | 'error'
  message: string
}

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:outline-none'

const adjustmentInputClass =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none'

const initialFilters = {
  userId: '',
  email: '',
  otomoId: '',
  name: '',
}

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

export const Route = createFileRoute('/admin/points')({
  component: AdminPointsScreen,
})

function AdminPointsScreen() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [searchError, setSearchError] = useState('')
  const [submittedFilters, setSubmittedFilters] =
    useState<AdminPointSearchFilters | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [grantForm, setGrantForm] = useState({ amount: '', reason: '' })
  const [deductForm, setDeductForm] = useState({ amount: '', reason: '' })

  const searchKey = submittedFilters ? JSON.stringify(submittedFilters) : null
  const queryKey = searchKey
    ? (['admin-point-dashboard', searchKey] as const)
    : null

  const dashboardQuery = useQuery({
    queryKey: ['admin-point-dashboard', searchKey],
    queryFn: () => fetchAdminPointDashboard(submittedFilters!),
    enabled: Boolean(submittedFilters),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!toast) return
    const handle = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(handle)
  }, [toast])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = buildSearchFilters(filters)
    if (!normalized) {
      setSearchError('検索条件を1つ以上入力してください')
      return
    }
    setSearchError('')
    setSubmittedFilters(normalized)
  }

  const handleReset = () => {
    setFilters(initialFilters)
    setSearchError('')
  }

  const handleInputChange =
    (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const activeQuerySummary = useMemo(() => {
    if (!submittedFilters) return ''
    const chips: Array<string> = []
    if (submittedFilters.userId) chips.push(`ID: ${submittedFilters.userId}`)
    if (submittedFilters.email) chips.push(submittedFilters.email)
    if (submittedFilters.otomoId)
      chips.push(`otomo: ${submittedFilters.otomoId}`)
    if (submittedFilters.name) chips.push(`名前: ${submittedFilters.name}`)
    return chips.join(' / ')
  }, [submittedFilters])

  const grantMutation = useMutation({
    mutationFn: (payload: { userId: string; amount: number; reason: string }) =>
      grantAdminPoints(payload.userId, {
        amount: payload.amount,
        reason: payload.reason,
        operator: 'admin_ops',
      }),
    onSuccess: (data) => {
      if (queryKey) {
        queryClient.setQueryData(queryKey, data)
      }
      setToast({ type: 'success', message: 'ポイントを付与しました' })
      setGrantForm({ amount: '', reason: '' })
    },
    onError: (error) =>
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'ポイント付与に失敗しました',
      }),
    onSettled: () => setConfirmState(null),
  })

  const deductMutation = useMutation({
    mutationFn: (payload: { userId: string; amount: number; reason: string }) =>
      deductAdminPoints(payload.userId, {
        amount: payload.amount,
        reason: payload.reason,
        operator: 'admin_ops',
      }),
    onSuccess: (data) => {
      if (queryKey) {
        queryClient.setQueryData(queryKey, data)
      }
      setToast({ type: 'success', message: 'ポイントを減算しました' })
      setDeductForm({ amount: '', reason: '' })
    },
    onError: (error) =>
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'ポイント減算に失敗しました',
      }),
    onSettled: () => setConfirmState(null),
  })

  const isMutationRunning = grantMutation.isPending || deductMutation.isPending

  const submitAdjustment = (mode: AdjustmentMode) => {
    const form = mode === 'add' ? grantForm : deductForm
    const parsed = Number(form.amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setToast({
        type: 'error',
        message: 'ポイントは1以上の数値で入力してください',
      })
      return
    }
    if (!form.reason.trim()) {
      setToast({ type: 'error', message: '理由を入力してください' })
      return
    }
    if (!dashboardQuery.data) {
      setToast({ type: 'error', message: '先にユーザー検索を行ってください' })
      return
    }
    setConfirmState({
      mode,
      amount: Math.floor(parsed),
      reason: form.reason.trim(),
    })
  }

  const runConfirmedAdjustment = () => {
    if (!confirmState || !dashboardQuery.data) return
    const payload = {
      userId: dashboardQuery.data.summary.userId,
      amount: confirmState.amount,
      reason: confirmState.reason,
    }
    if (confirmState.mode === 'add') {
      grantMutation.mutate(payload)
    } else {
      deductMutation.mutate(payload)
    }
  }

  const closeConfirm = () => {
    if (isMutationRunning) return
    setConfirmState(null)
  }

  const showSkeleton =
    submittedFilters && dashboardQuery.isLoading && !dashboardQuery.data
  const showEmptyState = !submittedFilters && !dashboardQuery.isFetching

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <PageHeader onRefresh={() => dashboardQuery.refetch()} />

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Search className="h-5 w-5 text-cyan-300" />
              ユーザー検索
            </CardTitle>
            <CardDescription>
              ユーザーID / メール / おともID /
              名前を組み合わせて的確に特定します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <input
                  className={inputBaseClass}
                  placeholder="ユーザーID"
                  value={filters.userId}
                  onChange={handleInputChange('userId')}
                />
                <input
                  className={inputBaseClass}
                  placeholder="メールアドレス"
                  value={filters.email}
                  onChange={handleInputChange('email')}
                />
                <input
                  className={inputBaseClass}
                  placeholder="おともはんID (otomo_XXX)"
                  value={filters.otomoId}
                  onChange={handleInputChange('otomoId')}
                />
                <input
                  className={inputBaseClass}
                  placeholder="名前（部分一致）"
                  value={filters.name}
                  onChange={handleInputChange('name')}
                />
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
                  リセット
                </Button>
                {submittedFilters && activeQuerySummary && (
                  <Badge variant="info" className="rounded-full px-4 text-xs">
                    {activeQuerySummary}
                  </Badge>
                )}
              </div>
              {searchError && (
                <p className="text-sm text-rose-200">{searchError}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {dashboardQuery.isError && (
          <ErrorCallout
            message={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : 'ポイント情報を取得できませんでした'
            }
            onRetry={() => dashboardQuery.refetch()}
          />
        )}

        {showSkeleton && <DashboardSkeleton />}
        {showEmptyState && <EmptyState />}

        {dashboardQuery.data && (
          <DashboardSections
            data={dashboardQuery.data}
            grantForm={grantForm}
            deductForm={deductForm}
            setGrantForm={setGrantForm}
            setDeductForm={setDeductForm}
            onSubmitAdd={() => submitAdjustment('add')}
            onSubmitSubtract={() => submitAdjustment('subtract')}
            disableAdjust={isMutationRunning}
          />
        )}
      </div>

      <Dialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => (!open ? closeConfirm() : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              操作の確認
            </DialogTitle>
            <DialogDescription>
              ポイント調整は即時反映され、監査ログに記録されます。取り消しできません。
            </DialogDescription>
          </DialogHeader>
          {confirmState && (
            <div className="space-y-3 rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <p>
                {confirmState.mode === 'add' ? '付与' : '減算'}:
                <span className="ml-2 text-lg font-semibold text-white">
                  {confirmState.amount.toLocaleString()} pt
                </span>
              </p>
              <p>理由: {confirmState.reason}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={closeConfirm}
              disabled={isMutationRunning}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant={confirmState?.mode === 'add' ? 'default' : 'destructive'}
              className="rounded-2xl"
              onClick={runConfirmedAdjustment}
              disabled={isMutationRunning}
            >
              {isMutationRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  実行中
                </>
              ) : (
                '実行する'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function PageHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-2xl border border-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-white/40">
            A-05 / POINT CONTROL
          </p>
          <h1 className="text-3xl font-semibold">ポイント管理</h1>
          <p className="text-sm text-white/70">
            残高・履歴・手動調整を統合し、異常検知に即応する運営画面です。
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-2xl"
        onClick={onRefresh}
      >
        <RefreshCw className="h-4 w-4" />
        最新に更新
      </Button>
    </header>
  )
}

function DashboardSections({
  data,
  grantForm,
  deductForm,
  setGrantForm,
  setDeductForm,
  onSubmitAdd,
  onSubmitSubtract,
  disableAdjust,
}: {
  data: AdminPointDashboard
  grantForm: { amount: string; reason: string }
  deductForm: { amount: string; reason: string }
  setGrantForm: Dispatch<SetStateAction<{ amount: string; reason: string }>>
  setDeductForm: Dispatch<SetStateAction<{ amount: string; reason: string }>>
  onSubmitAdd: () => void
  onSubmitSubtract: () => void
  disableAdjust: boolean
}) {
  const { summary } = data

  return (
    <div className="space-y-8">
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-3xl">{summary.userName}</CardTitle>
            <CardDescription className="space-y-1 text-white/70">
              <p>ユーザーID: {summary.userId}</p>
              <p>メール: {summary.email}</p>
              {summary.otomoId && <p>紐付けおともID: {summary.otomoId}</p>}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {summary.suspiciousFlag && (
              <Badge variant="warning" className="rounded-full px-4 text-xs">
                ⚠ {summary.suspiciousFlag.message}
              </Badge>
            )}
            <Button variant="outline" className="rounded-2xl">
              <ClipboardList className="h-4 w-4" />
              詳細を見る
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="残ポイント"
              value={`${summary.balance.toLocaleString()} pt`}
              helper={
                summary.lastUsageAt
                  ? `最終消費 ${formatDate(summary.lastUsageAt)}`
                  : '最終消費情報なし'
              }
              accent="from-emerald-500/30 to-emerald-400/20"
              icon={<Coins className="h-6 w-6" />}
            />
            <MetricCard
              label="累計購入"
              value={`${summary.totalPurchased.toLocaleString()} pt`}
              helper={
                summary.lastChargeAt
                  ? `最終購入 ${formatDate(summary.lastChargeAt)}`
                  : '最終購入情報なし'
              }
              accent="from-sky-500/30 to-indigo-500/20"
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <MetricCard
              label="累計使用"
              value={`${summary.totalUsed.toLocaleString()} pt`}
              helper="通話・調整による総消費"
              accent="from-rose-500/30 to-orange-500/20"
              icon={<Activity className="h-6 w-6" />}
            />
          </div>
          <p className="text-sm text-white/60">
            最終更新: {formatDate(data.lastUpdatedAt)}
          </p>
        </CardContent>
      </Card>

      {summary.suspiciousFlag && (
        <SuspiciousAlert flag={summary.suspiciousFlag} />
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <History className="h-5 w-5 text-cyan-300" />
            ポイント履歴
          </CardTitle>
          <CardDescription>
            購入履歴 / 使用履歴 / 管理者操作ログをタブで切り替えて閲覧できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="purchases">
            <TabsList>
              <TabsTrigger value="purchases">購入履歴</TabsTrigger>
              <TabsTrigger value="usage">使用履歴</TabsTrigger>
              <TabsTrigger value="adminLogs">管理ログ</TabsTrigger>
            </TabsList>
            <TabsContent value="purchases">
              <PurchaseHistoryTable entries={data.purchases} />
            </TabsContent>
            <TabsContent value="usage">
              <UsageHistoryTable entries={data.usage} />
            </TabsContent>
            <TabsContent value="adminLogs">
              <AdminLogTable entries={data.adminLogs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Shield className="h-5 w-5 text-emerald-300" />
            ポイント調整（手動）
          </CardTitle>
          <CardDescription>
            付与・減算はいずれも理由必須で確認モーダルを経由し、監査ログに自動記録されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <AdjustmentPanel
              title="ポイント付与"
              description="問い合わせ補填 / プロモーション付与"
              icon={<PlusCircle className="h-5 w-5 text-emerald-300" />}
              amount={grantForm.amount}
              reason={grantForm.reason}
              onAmountChange={(value) =>
                setGrantForm((prev) => ({ ...prev, amount: value }))
              }
              onReasonChange={(value) =>
                setGrantForm((prev) => ({ ...prev, reason: value }))
              }
              onSubmit={onSubmitAdd}
              disabled={disableAdjust}
              actionLabel="付与する"
              accent="from-emerald-500/20"
            />
            <AdjustmentPanel
              title="ポイント減算"
              description="不正利用 / 返金補正時の差し引き"
              icon={<MinusCircle className="h-5 w-5 text-rose-300" />}
              amount={deductForm.amount}
              reason={deductForm.reason}
              onAmountChange={(value) =>
                setDeductForm((prev) => ({ ...prev, amount: value }))
              }
              onReasonChange={(value) =>
                setDeductForm((prev) => ({ ...prev, reason: value }))
              }
              onSubmit={onSubmitSubtract}
              disabled={disableAdjust}
              actionLabel="減算する"
              accent="from-rose-500/20"
            />
          </div>
          <p className="mt-4 text-xs text-white/60">
            操作後は「管理ログ」タブで監査証跡を即座に確認できます。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AdjustmentPanel({
  title,
  description,
  icon,
  amount,
  reason,
  onAmountChange,
  onReasonChange,
  onSubmit,
  disabled,
  actionLabel,
  accent,
}: {
  title: string
  description: string
  icon: ReactNode
  amount: string
  reason: string
  onAmountChange: (value: string) => void
  onReasonChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
  actionLabel: string
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'rounded-2xl border border-white/10 bg-gradient-to-r p-3 text-white',
            accent,
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-white/70">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <input
          type="number"
          min="0"
          className={adjustmentInputClass}
          placeholder="100"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          disabled={disabled}
        />
        <textarea
          className={cn(adjustmentInputClass, 'min-h-[96px] resize-none')}
          placeholder="理由を入力 (必須)"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          disabled={disabled}
        />
        <Button
          type="button"
          className="w-full rounded-2xl"
          onClick={onSubmit}
          disabled={disabled}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  accent,
}: {
  label: string
  value: string
  helper: string
  icon: ReactNode
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">{label}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br text-white',
            accent,
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-white/60">{helper}</p>
    </div>
  )
}

function PurchaseHistoryTable({
  entries,
}: {
  entries: AdminPointDashboard['purchases']
}) {
  if (!entries.length) {
    return <EmptyTable message="購入履歴がまだありません" />
  }
  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
          <tr>
            {[
              '日付',
              '購入ポイント',
              '金額',
              '決済手段',
              'トランザクションID',
            ].map((heading) => (
              <th key={heading} className="px-4 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-white/5">
              <td className="px-4 py-3">{formatDate(entry.occurredAt)}</td>
              <td className="px-4 py-3 font-semibold">
                {entry.points.toLocaleString()} pt
              </td>
              <td className="px-4 py-3">
                {yenFormatter.format(entry.amountYen)}
              </td>
              <td className="px-4 py-3">{entry.method}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {entry.transactionId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsageHistoryTable({
  entries,
}: {
  entries: AdminPointDashboard['usage']
}) {
  if (!entries.length) {
    return <EmptyTable message="使用履歴がまだありません" />
  }
  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
          <tr>
            {['日付', '消費ポイント', '通話ID', '相手', '通話時間'].map(
              (heading) => (
                <th key={heading} className="px-4 py-3">
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-white/5">
              <td className="px-4 py-3">{formatDate(entry.occurredAt)}</td>
              <td className="px-4 py-3 font-semibold">
                {entry.points.toLocaleString()} pt
              </td>
              <td className="px-4 py-3">{entry.callId}</td>
              <td className="px-4 py-3">{entry.partnerName}</td>
              <td className="px-4 py-3">{entry.durationMinutes} 分</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminLogTable({
  entries,
}: {
  entries: AdminPointDashboard['adminLogs']
}) {
  if (!entries.length) {
    return <EmptyTable message="管理者操作ログはまだありません" />
  }
  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
          <tr>
            {['日付', '操作', '担当者', '変更量', '理由'].map((heading) => (
              <th key={heading} className="px-4 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-white/5">
              <td className="px-4 py-3">{formatDate(entry.occurredAt)}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    entry.operation === 'add' ? 'success' : 'destructive'
                  }
                >
                  {entry.operation === 'add' ? '手動付与' : '減算'}
                </Badge>
              </td>
              <td className="px-4 py-3">{entry.operator}</td>
              <td className="px-4 py-3 font-semibold">
                {entry.operation === 'add' ? '+' : '-'}
                {entry.delta.toLocaleString()} pt
              </td>
              <td className="px-4 py-3 text-white/70">{entry.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SuspiciousAlert({
  flag,
}: {
  flag: NonNullable<AdminPointDashboard['summary']['suspiciousFlag']>
}) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
      <div className="flex items-center gap-2 text-base font-semibold">
        <AlertTriangle className="h-5 w-5" />
        不正利用の可能性があります
      </div>
      <p className="mt-2 text-white">{flag.message}</p>
      <p className="text-xs text-rose-200">
        検知日時: {formatDate(flag.detectedAt)} / レベル:{' '}
        {flag.severity.toUpperCase()}
      </p>
    </div>
  )
}

function ErrorCallout({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-2xl"
        onClick={onRetry}
      >
        再試行
      </Button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl bg-white/10" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl bg-white/10" />
      <Skeleton className="h-64 rounded-2xl bg-white/10" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center text-white/70">
      <AlertCircle className="h-8 w-8 text-cyan-300" />
      <p className="text-lg font-semibold text-white">
        ユーザーを検索してください
      </p>
      <p className="text-sm">
        条件を指定して検索を実行すると、残高・履歴・操作ログがここに表示されます。
      </p>
    </div>
  )
}

function EmptyTable({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-white/60">
      {message}
    </div>
  )
}

function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastState
  onDismiss: () => void
}) {
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white shadow-2xl">
      <AlertCircle
        className={cn(
          'h-4 w-4',
          toast.type === 'success' ? 'text-emerald-300' : 'text-rose-300',
        )}
      />
      <span>{toast.message}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-2xl"
        onClick={onDismiss}
      >
        閉じる
      </Button>
    </div>
  )
}

function formatDate(input: string) {
  const date = new Date(input)
  return dateFormatter.format(date)
}

function buildSearchFilters(
  filters: typeof initialFilters,
): AdminPointSearchFilters | null {
  const normalized = {
    userId: filters.userId.trim(),
    email: filters.email.trim(),
    otomoId: filters.otomoId.trim(),
    name: filters.name.trim(),
  }
  const payload: AdminPointSearchFilters = {}
  if (normalized.userId) payload.userId = normalized.userId
  if (normalized.email) payload.email = normalized.email
  if (normalized.otomoId) payload.otomoId = normalized.otomoId
  if (normalized.name) payload.name = normalized.name
  return Object.keys(payload).length ? payload : null
}
