import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calculator,
  ChevronRight,
  ClipboardList,
  Coins,
  CreditCard,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type {
  AdminUserPointAdminLogEntry,
  AdminUserPointHistoryResponse,
  AdminUserPointPurchaseEntry,
  AdminUserPointSnapshots,
  AdminUserPointUsageEntry,
  UpdateAdminUserPointsPayload,
} from '@/lib/api'
import {
  fetchAdminUserPointHistory,
  fetchAdminUserPoints,
  updateAdminUserPoints,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

type HistoryTab = 'purchases' | 'usage' | 'adminLogs'

export const Route = createFileRoute('/admin/points')({
  component: AdminPointsScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const presetUsers: Array<{ id: string; label: string }> = [
  { id: 'user_001', label: '直近で入金あり' },
  { id: 'user_002', label: '監査フラグあり' },
  { id: 'user_003', label: '大量保有ユーザー' },
]

function AdminPointsScreen() {
  const [searchInput, setSearchInput] = useState('user_001')
  const [activeUserId, setActiveUserId] = useState('user_001')
  const [searchNotice, setSearchNotice] = useState('')
  const [historyTab, setHistoryTab] = useState<HistoryTab>('purchases')
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>('add')
  const [adjustPoints, setAdjustPoints] = useState('100')
  const [adjustReason, setAdjustReason] = useState('問い合わせ補填')
  const [adjustNotice, setAdjustNotice] = useState('')

  const queryClient = useQueryClient()

  const snapshotQuery = useQuery<AdminUserPointSnapshots>({
    queryKey: ['admin-user-points', activeUserId],
    queryFn: () => fetchAdminUserPoints(activeUserId),
    enabled: Boolean(activeUserId),
  })

  const historyQuery = useQuery<AdminUserPointHistoryResponse>({
    queryKey: ['admin-user-point-history', activeUserId],
    queryFn: () => fetchAdminUserPointHistory(activeUserId),
    enabled: Boolean(activeUserId),
  })

  const adjustMutation = useMutation({
    mutationFn: (payload: UpdateAdminUserPointsPayload) =>
      updateAdminUserPoints(payload),
    onSuccess: (_data, variables) => {
      setAdjustNotice('ポイント残高を更新しました')
      queryClient.invalidateQueries({
        queryKey: ['admin-user-points', variables.userId],
      })
      queryClient.invalidateQueries({
        queryKey: ['admin-user-point-history', variables.userId],
      })
      setAdjustPoints('100')
    },
    onError: (error: unknown) => {
      setAdjustNotice(
        error instanceof Error ? error.message : 'ポイント更新に失敗しました',
      )
    },
  })

  const snapshot = snapshotQuery.data
  const history = historyQuery.data

  const riskSignals = useMemo(() => {
    if (!snapshot) {
      return []
    }
    const signals: Array<string> = []
    if (snapshot.suspicious) {
      signals.push('システムによって不正検知フラグが設定されています')
    }
    if (snapshot.currentBalance < 200) {
      signals.push('残ポイントが 200pt を下回っています')
    }
    if (history?.adminLogs.length) {
      const latest = history.adminLogs[0]
      signals.push(
        `直近の手動調整: ${formatTimestamp(latest.occurredAt)} / ${latest.operator}`,
      )
    }
    if (!signals.length && snapshot.notes) {
      signals.push(snapshot.notes)
    }
    return signals
  }, [snapshot, history])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchNotice('')
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setSearchNotice('ユーザーIDを入力してください')
      return
    }
    setActiveUserId(trimmed)
    setHistoryTab('purchases')
  }

  const handleQuickSelect = (userId: string) => {
    setSearchInput(userId)
    setActiveUserId(userId)
    setHistoryTab('purchases')
    setSearchNotice('')
  }

  const handleAdjustSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdjustNotice('')
    const numeric = Number(adjustPoints)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setAdjustNotice('調整ポイントは 1 以上の数値で入力してください')
      return
    }
    if (!adjustReason.trim()) {
      setAdjustNotice('理由を入力してください')
      return
    }
    if (!activeUserId) {
      setAdjustNotice('対象ユーザーが選択されていません')
      return
    }
    const delta = adjustMode === 'add' ? numeric : -numeric
    adjustMutation.mutate({
      userId: activeUserId,
      delta,
      reason: adjustReason.trim(),
      operator: 'admin_console',
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-05 / POINT MANAGEMENT
            </p>
            <h1 className="mt-2 text-4xl font-bold">ポイント管理</h1>
            <p className="text-sm text-white/70">
              入金・消費・手動補填を横断的に監査し、不正兆候を即座にブロックします。
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              snapshotQuery.refetch()
              historyQuery.refetch()
            }}
            disabled={snapshotQuery.isFetching || historyQuery.isFetching}
          >
            {snapshotQuery.isFetching || historyQuery.isFetching ? (
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
              <Search className="h-5 w-5 text-rose-300" />
              ユーザー検索
            </CardTitle>
            <CardDescription>
              ユーザーIDを指定して残高/履歴を参照し、疑わしい挙動を素早く追跡します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearchSubmit}>
              <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                <input
                  value={searchInput}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="ユーザーID (user_xxx)"
                />
                <Button type="submit" className="rounded-2xl">
                  <Search className="h-4 w-4" />
                  残高を取得
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {presetUsers.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={
                      preset.id === activeUserId ? 'secondary' : 'outline'
                    }
                    className="rounded-2xl"
                    onClick={() => handleQuickSelect(preset.id)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    {preset.label}
                    <span className="text-white/60">({preset.id})</span>
                  </Button>
                ))}
              </div>
              {searchNotice && (
                <div className="flex items-center gap-2 text-sm text-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  {searchNotice}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {snapshotQuery.status === 'pending' ? (
            <PointStatSkeleton />
          ) : snapshot ? (
            <>
              <PointStatCard
                title="現在の残高"
                helper="リアルタイム反映"
                value={`${snapshot.currentBalance.toLocaleString()} pt`}
                icon={<Coins className="h-5 w-5" />}
              />
              <PointStatCard
                title="累計購入ポイント"
                helper="課金処理ベース"
                value={`${snapshot.totalPurchased.toLocaleString()} pt`}
                icon={<CreditCard className="h-5 w-5" />}
              />
              <PointStatCard
                title="累計消費ポイント"
                helper="通話課金ベース"
                value={`${snapshot.totalUsed.toLocaleString()} pt`}
                icon={<Activity className="h-5 w-5" />}
              />
            </>
          ) : (
            <PointErrorState message="ポイント情報を取得できませんでした" />
          )}
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-2xl">残高スナップショット</CardTitle>
              <CardDescription>
                システムフラグやメモを参照して、補填判断の前提情報を整理します。
              </CardDescription>
            </div>
            {snapshot?.lastUpdatedAt && (
              <Badge variant="info" className="text-xs">
                <History className="mr-1 h-3.5 w-3.5" />
                {formatTimestamp(snapshot.lastUpdatedAt)} 反映
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshotQuery.status === 'pending' && <SnapshotSkeleton />}
            {snapshotQuery.status === 'error' && (
              <ErrorBanner error={snapshotQuery.error} />
            )}
            {snapshot && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {snapshot.suspicious && (
                    <Badge variant="warning">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      システム監査フラグ中
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    ユーザーID: {activeUserId}
                  </Badge>
                </div>
                {snapshot.notes && (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                    {snapshot.notes}
                  </p>
                )}
                {!!riskSignals.length && (
                  <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-50">
                    <div className="flex items-center gap-2 text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      リスク検知サマリー
                    </div>
                    <ul className="list-disc space-y-1 pl-5">
                      {riskSignals.map((signal) => (
                        <li key={signal}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">履歴タイムライン</CardTitle>
              <CardDescription>
                課金購入・消費・手動調整をタブで切り替えて、一貫した監査証跡を残します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyQuery.status === 'pending' && <HistorySkeleton />}
              {historyQuery.status === 'error' && (
                <ErrorBanner error={historyQuery.error} />
              )}
              {history && (
                <Tabs
                  value={historyTab}
                  onValueChange={(value) => setHistoryTab(value as HistoryTab)}
                >
                  <TabsList>
                    <TabsTrigger value="purchases">入金履歴</TabsTrigger>
                    <TabsTrigger value="usage">消費履歴</TabsTrigger>
                    <TabsTrigger value="adminLogs">手動調整ログ</TabsTrigger>
                  </TabsList>
                  <TabsContent value="purchases">
                    <PurchaseHistory entries={history.purchases} />
                  </TabsContent>
                  <TabsContent value="usage">
                    <UsageHistory entries={history.usage} />
                  </TabsContent>
                  <TabsContent value="adminLogs">
                    <AdminLogHistory entries={history.adminLogs} />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">ポイント調整</CardTitle>
              <CardDescription>
                不足補填や過剰利用の差し引きを記録付きで実施します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAdjustSubmit}>
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    方向
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={adjustMode === 'add' ? 'secondary' : 'outline'}
                      className="rounded-2xl"
                      onClick={() => setAdjustMode('add')}
                    >
                      <Sparkles className="h-4 w-4" />
                      加算
                    </Button>
                    <Button
                      type="button"
                      variant={
                        adjustMode === 'subtract' ? 'secondary' : 'outline'
                      }
                      className="rounded-2xl"
                      onClick={() => setAdjustMode('subtract')}
                    >
                      <Calculator className="h-4 w-4" />
                      減算
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    調整ポイント
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={10}
                    value={adjustPoints}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setAdjustPoints(event.target.value)
                    }
                    className={inputBaseClass}
                    placeholder="例) 100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    理由 / メモ
                  </label>
                  <textarea
                    value={adjustReason}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setAdjustReason(event.target.value)
                    }
                    className={cn(
                      inputBaseClass,
                      'min-h-[96px] resize-none bg-white/0',
                    )}
                    placeholder="利用不具合の補填 など"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-2xl"
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      調整中
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      記録して調整
                    </>
                  )}
                </Button>
                {adjustNotice && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <AlertCircle className="h-4 w-4" />
                    {adjustNotice}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PointStatCard({
  title,
  helper,
  value,
  icon,
}: {
  title: string
  helper: string
  value: string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            {helper}
          </p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className="text-sm text-white/60">{title}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-rose-200">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function PointStatSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-3 w-24 rounded-full bg-white/10" />
        <Skeleton className="h-8 w-36 rounded-full bg-white/10" />
        <Skeleton className="h-3 w-32 rounded-full bg-white/10" />
      </CardContent>
    </Card>
  )
}

function PointErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6 text-sm text-rose-200">
        <AlertCircle className="h-4 w-4" />
        {message}
      </CardContent>
    </Card>
  )
}

function SnapshotSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-72 rounded-full bg-white/10" />
      <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded-2xl bg-white/5" />
      <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
    </div>
  )
}

function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertCircle className="h-4 w-4" />
      {error instanceof Error
        ? error.message
        : 'データの取得中にエラーが発生しました'}
    </div>
  )
}

function PurchaseHistory({
  entries,
}: {
  entries: Array<AdminUserPointPurchaseEntry>
}) {
  if (!entries.length) {
    return <EmptyHistory message="入金履歴がありません" />
  }

  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">ポイント</th>
            <th className="px-4 py-3 font-medium">金額</th>
            <th className="px-4 py-3 font-medium">決済手段</th>
            <th className="px-4 py-3 font-medium">取引ID</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-white/5">
              <td className="px-4 py-3 text-white/80">
                {formatTimestamp(entry.occurredAt)}
              </td>
              <td className="px-4 py-3 text-white">
                {entry.points.toLocaleString()} pt
              </td>
              <td className="px-4 py-3 text-white/80">
                ¥{entry.amountYen.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-white/80">{entry.method}</td>
              <td className="px-4 py-3 text-white/60">{entry.transactionId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsageHistory({
  entries,
}: {
  entries: Array<AdminUserPointUsageEntry>
}) {
  if (!entries.length) {
    return <EmptyHistory message="ポイント消費履歴がありません" />
  }

  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">消費ポイント</th>
            <th className="px-4 py-3 font-medium">通話ID</th>
            <th className="px-4 py-3 font-medium">おともはんID</th>
            <th className="px-4 py-3 font-medium">通話時間</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-white/5">
              <td className="px-4 py-3 text-white/80">
                {formatTimestamp(entry.occurredAt)}
              </td>
              <td className="px-4 py-3 text-white">
                {entry.points.toLocaleString()} pt
              </td>
              <td className="px-4 py-3 text-white/80">{entry.callId}</td>
              <td className="px-4 py-3 text-white/80">{entry.otomoId}</td>
              <td className="px-4 py-3 text-white/80">
                {(entry.durationSec / 60).toFixed(1)} 分
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminLogHistory({
  entries,
}: {
  entries: Array<AdminUserPointAdminLogEntry>
}) {
  if (!entries.length) {
    return <EmptyHistory message="手動調整ログがありません" />
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <History className="h-4 w-4" />
              {formatTimestamp(entry.occurredAt)}
            </div>
            <Badge variant={entry.delta >= 0 ? 'success' : 'danger'}>
              {entry.delta >= 0 ? '+' : '-'}
              {Math.abs(entry.delta).toLocaleString()} pt
            </Badge>
          </div>
          <div className="mt-2 text-sm text-white/80">{entry.reason}</div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">
            Operator: {entry.operator}
          </p>
        </div>
      ))}
    </div>
  )
}

function EmptyHistory({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/60">
      {message}
    </div>
  )
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour12: false,
  })
}
