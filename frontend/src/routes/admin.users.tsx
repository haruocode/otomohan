import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Ban,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from 'lucide-react'

import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type {
  AdminReportFilter,
  AdminUserCallHistoryEntry,
  AdminUserDetail,
  AdminUserListFilters,
  AdminUserStatus,
  AdminUserSummary,
} from '@/lib/api'
import {
  fetchAdminUserDetail,
  fetchAdminUsers,
  retireAdminUser,
  suspendAdminUser,
  unsuspendAdminUser,
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

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  active: 'アクティブ',
  suspended: '凍結',
  retired: '退会済み',
}

const statusOptions: Array<{ id: AdminUserStatus | 'all'; label: string }> = [
  { id: 'all', label: 'すべて' },
  { id: 'active', label: STATUS_LABEL.active },
  { id: 'suspended', label: STATUS_LABEL.suspended },
  { id: 'retired', label: STATUS_LABEL.retired },
]

const reportOptions: Array<{ id: AdminReportFilter | 'all'; label: string }> = [
  { id: 'all', label: '通報フィルターなし' },
  { id: 'none', label: '通報 0 件' },
  { id: 'onePlus', label: '1 件以上' },
  { id: 'many', label: '複数（3件〜）' },
]

type SortKey = 'registeredAt' | 'lastLoginAt' | 'points'
type SortOrder = 'asc' | 'desc'

type FormFilters = {
  userId: string
  email: string
  name: string
  status: AdminUserStatus | 'all'
  reportFilter: AdminReportFilter | 'all'
  registeredFrom: string
  registeredTo: string
  sortBy: SortKey
  sortOrder: SortOrder
}

const initialFormFilters: FormFilters = {
  userId: '',
  email: '',
  name: '',
  status: 'all',
  reportFilter: 'all',
  registeredFrom: '',
  registeredTo: '',
  sortBy: 'registeredAt',
  sortOrder: 'desc',
}

function AdminUsersScreen() {
  const [formFilters, setFormFilters] =
    useState<FormFilters>(initialFormFilters)
  const [activeFilters, setActiveFilters] = useState<AdminUserListFilters>(
    buildListFilters(initialFormFilters),
  )
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [exportNotice, setExportNotice] = useState<string>('')

  const usersQuery = useQuery({
    queryKey: ['admin-users', activeFilters],
    queryFn: (): Promise<AdminUserSummary[]> => fetchAdminUsers(activeFilters),
    placeholderData: (previousData): AdminUserSummary[] | undefined =>
      previousData,
  })

  const users: AdminUserSummary[] = usersQuery.data ?? []
  const stats = useMemo(() => buildUserStats(users), [users])
  const isLoadingList = usersQuery.status === 'pending'
  const isErrorList = usersQuery.status === 'error'

  const handleInputChange =
    (field: keyof FormFilters, formatter?: (value: string) => string) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const nextValue = formatter
        ? formatter(event.target.value)
        : event.target.value
      setFormFilters((prev) => ({ ...prev, [field]: nextValue }))
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
    if (!users.length) {
      setExportNotice('エクスポート対象のユーザーがありません')
      return
    }
    if (typeof window === 'undefined') {
      setExportNotice('ブラウザからのみエクスポートできます')
      return
    }
    const csv = createCsvFromUsers(users)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `otomohan-users-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExportNotice(`${users.length}件のデータをエクスポートしました`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-02 / USER MANAGEMENT
            </p>
            <h1 className="mt-2 text-4xl font-bold">ユーザー管理</h1>
            <p className="text-sm text-white/70">
              通話ユーザーの監査・凍結・履歴確認をまとめて行う運営コンソール
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            {usersQuery.isFetching ? (
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
              ユーザー検索
            </CardTitle>
            <CardDescription>
              ID・メール・期間・通報数でフィルタし、監査したい対象を素早く抽出します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={formFilters.userId}
                  onChange={handleInputChange('userId')}
                  className={inputBaseClass}
                  placeholder="ユーザーID"
                />
                <input
                  value={formFilters.email}
                  onChange={handleInputChange('email')}
                  className={inputBaseClass}
                  placeholder="メールアドレス"
                />
                <input
                  value={formFilters.name}
                  onChange={handleInputChange('name')}
                  className={inputBaseClass}
                  placeholder="名前（部分一致）"
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
                <input
                  type="date"
                  value={formFilters.registeredFrom}
                  onChange={handleInputChange('registeredFrom')}
                  className={inputBaseClass}
                />
                <input
                  type="date"
                  value={formFilters.registeredTo}
                  onChange={handleInputChange('registeredTo')}
                  className={inputBaseClass}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">並び替え</span>
                  <select
                    value={formFilters.sortBy}
                    onChange={handleInputChange('sortBy')}
                    className={cn(inputBaseClass, 'bg-white/0')}
                  >
                    <option value="registeredAt">登録日</option>
                    <option value="lastLoginAt">最終ログイン</option>
                    <option value="points">残ポイント</option>
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
                  フィルターをリセット
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
                {exportNotice && (
                  <span className="text-sm text-white/60">{exportNotice}</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="検索結果"
            value={`${stats.total.toLocaleString()} 名`}
            helper="現在のフィルター"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="凍結対象"
            value={`${stats.suspended.toLocaleString()} 名`}
            helper="対応が必要"
            icon={<Ban className="h-5 w-5" />}
          />
          <StatCard
            title="通報多発"
            value={`${stats.highReports.toLocaleString()} 名`}
            helper="通報3件以上"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">ユーザー一覧</CardTitle>
              <CardDescription>
                登録状況・残ポイントを俯瞰し、個別の詳細画面から通話/通報履歴を追跡します。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {stats.lastUpdated}
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoadingList && <UserTableSkeleton />}
            {isErrorList && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {usersQuery.error instanceof Error
                    ? usersQuery.error.message
                    : 'ユーザー一覧を取得できませんでした'}
                </span>
              </div>
            )}
            {!isLoadingList && !isErrorList && (
              <UserTable
                users={users}
                onSelect={(userId) => setSelectedUserId(userId)}
              />
            )}
          </CardContent>
        </Card>

        <AdminUserDetailDialog
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    </div>
  )
}

function UserTable({
  users,
  onSelect,
}: {
  users: Array<AdminUserSummary>
  onSelect: (userId: string) => void
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        <p>
          該当するユーザーが見つかりませんでした。検索条件を調整してください。
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-white/50">
          <tr>
            {[
              'ユーザーID',
              '名前',
              'メールアドレス',
              '登録日',
              'ステータス',
              '通報',
              '残ポイント',
              '最終ログイン',
              '操作',
            ].map((heading) => (
              <th key={heading} className="border-b border-white/10 px-4 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-white/5 text-white/80 transition hover:bg-white/5"
            >
              <td className="px-4 py-3 font-medium">{user.id}</td>
              <td className="px-4 py-3">{user.name}</td>
              <td className="px-4 py-3 text-white/60">{user.email}</td>
              <td className="px-4 py-3 text-white/60">
                {formatDate(user.registeredAt)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.reportCount > 0 ? 'warning' : 'outline'}>
                  {user.reportCount} 件
                </Badge>
              </td>
              <td className="px-4 py-3 font-semibold text-white">
                {user.points.toLocaleString()} pt
              </td>
              <td className="px-4 py-3 text-white/60">
                {formatDate(user.lastLoginAt)}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl"
                  onClick={() => onSelect(user.id)}
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

function StatusBadge({ status }: { status: AdminUserStatus }) {
  const variant =
    status === 'active'
      ? 'success'
      : status === 'suspended'
        ? 'danger'
        : 'outline'
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>
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
  icon: ReactNode
}) {
  return (
    <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/0">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardDescription className="text-white/60">{title}</CardDescription>
          <CardTitle className="text-3xl">{value}</CardTitle>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-white/60">{helper}</p>
      </CardContent>
    </Card>
  )
}

function UserTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={`user-skeleton-${index}`}
          className="h-12 w-full rounded-2xl bg-white/5"
        />
      ))}
    </div>
  )
}

function AdminUserDetailDialog({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [suspendReason, setSuspendReason] = useState('')
  const [retireNote, setRetireNote] = useState('')
  const isOpen = Boolean(userId)

  useEffect(() => {
    setSuspendReason('')
    setRetireNote('')
  }, [userId])

  const detailQuery = useQuery<AdminUserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => fetchAdminUserDetail(userId!),
    enabled: isOpen && Boolean(userId),
  })

  const invalidate = (user: AdminUserDetail) => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    queryClient.setQueryData(['admin-user-detail', user.id], user)
  }

  const suspendMutation = useMutation({
    mutationFn: () => suspendAdminUser(userId ?? '', suspendReason),
    onSuccess: (updated) => {
      invalidate(updated)
      setSuspendReason('')
    },
  })

  const unsuspendMutation = useMutation({
    mutationFn: () => unsuspendAdminUser(userId ?? ''),
    onSuccess: (updated) => invalidate(updated),
  })

  const retireMutation = useMutation({
    mutationFn: () => retireAdminUser(userId ?? '', retireNote),
    onSuccess: (updated) => {
      invalidate(updated)
      setRetireNote('')
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl space-y-6">
        <DialogHeader>
          <DialogTitle>ユーザー詳細</DialogTitle>
          <DialogDescription>
            凍結・退会などの操作はすべて管理ログ（A-10）に記録される想定です。
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          </div>
        )}

        {detailQuery.isError && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            <AlertCircle className="h-4 w-4" />
            <span>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : '詳細情報の取得に失敗しました'}
            </span>
          </div>
        )}

        {detailQuery.data && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <InfoBox title="基本情報">
                <InfoItem label="ユーザーID" value={detailQuery.data.id} />
                <InfoItem label="名前" value={detailQuery.data.name} />
                <InfoItem label="メール" value={detailQuery.data.email} />
                {detailQuery.data.phone && (
                  <InfoItem label="電話番号" value={detailQuery.data.phone} />
                )}
                {detailQuery.data.device && (
                  <InfoItem label="デバイス" value={detailQuery.data.device} />
                )}
                <InfoItem
                  label="登録日"
                  value={formatDate(detailQuery.data.registeredAt)}
                />
                <InfoItem
                  label="最終ログイン"
                  value={formatDate(detailQuery.data.lastLoginAt)}
                />
              </InfoBox>

              <InfoBox title="アカウント状態">
                <div className="flex items-center gap-3">
                  <StatusBadge status={detailQuery.data.status} />
                  <span className="text-sm text-white/60">
                    通報 {detailQuery.data.reportCount} 件
                  </span>
                </div>
                {detailQuery.data.status !== 'suspended' && (
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <label className="text-sm text-white/70">
                      凍結理由（管理ログ保存）
                    </label>
                    <textarea
                      value={suspendReason}
                      onChange={(event) => setSuspendReason(event.target.value)}
                      className="min-h-[80px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-rose-300 focus:outline-none"
                      placeholder="不適切発言が確認された など"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-2xl"
                      disabled={
                        suspendMutation.isPending ||
                        suspendReason.trim().length === 0
                      }
                      onClick={() => suspendMutation.mutate()}
                    >
                      {suspendMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          処理中
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4" />
                          凍結する
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {detailQuery.data.status === 'suspended' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-2xl"
                    disabled={unsuspendMutation.isPending}
                    onClick={() => unsuspendMutation.mutate()}
                  >
                    {unsuspendMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        解除中
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        凍結解除
                      </>
                    )}
                  </Button>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-white/70">
                    退会メモ（任意）
                  </label>
                  <textarea
                    value={retireNote}
                    onChange={(event) => setRetireNote(event.target.value)}
                    className="min-h-[70px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-rose-300 focus:outline-none"
                    placeholder="コミュニティガイドライン違反など"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl text-white/80"
                    disabled={retireMutation.isPending}
                    onClick={() => retireMutation.mutate()}
                  >
                    {retireMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        処理中
                      </>
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4" />
                        退会処理
                      </>
                    )}
                  </Button>
                </div>
              </InfoBox>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <InfoBox title="ポイント情報">
                <InfoItem
                  label="残ポイント"
                  value={`${detailQuery.data.pointSummary.balance.toLocaleString()} pt`}
                />
                <InfoItem
                  label="累計購入"
                  value={`${detailQuery.data.pointSummary.purchased.toLocaleString()} pt`}
                />
                <InfoItem
                  label="累計消費"
                  value={`${detailQuery.data.pointSummary.used.toLocaleString()} pt`}
                />
              </InfoBox>
              <InfoBox title="レビュー履歴">
                {detailQuery.data.reviewHistory.length === 0 && (
                  <p className="text-sm text-white/60">
                    レビューはまだありません。
                  </p>
                )}
                {detailQuery.data.reviewHistory.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-white/10 p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-amber-300">
                      <span>★{review.rating}</span>
                      <span className="text-xs text-white/50">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-white/80">{review.comment}</p>
                  </div>
                ))}
              </InfoBox>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <InfoBox title="通話履歴" helper="直近順">
                {detailQuery.data.callHistory.length === 0 && (
                  <p className="text-sm text-white/60">
                    通話履歴はありません。
                  </p>
                )}
                {detailQuery.data.callHistory.map((entry) => (
                  <CallHistoryRow key={entry.callId} entry={entry} />
                ))}
              </InfoBox>
              <InfoBox title="通報状況" helper="A-08 へ遷移想定">
                {detailQuery.data.reportHistory.length === 0 && (
                  <p className="text-sm text-white/60">
                    通報は登録されていません。
                  </p>
                )}
                {detailQuery.data.reportHistory.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm"
                  >
                    <p className="font-semibold text-rose-200">
                      {formatDate(report.createdAt)} / {report.otomoId}
                    </p>
                    <p className="mt-1 text-white/80">{report.message}</p>
                  </div>
                ))}
              </InfoBox>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoBox({
  title,
  helper,
  children,
}: {
  title: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {helper && <span className="text-xs text-white/50">{helper}</span>}
      </div>
      <div className="space-y-2 text-sm text-white/80">{children}</div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}

function CallHistoryRow({ entry }: { entry: AdminUserCallHistoryEntry }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <div className="flex items-center justify-between text-white/80">
        <span className="font-semibold">{entry.callId}</span>
        <span>{entry.durationMinutes} 分</span>
      </div>
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{entry.otomoName}</span>
        <span>{formatDate(entry.occurredAt)}</span>
      </div>
    </div>
  )
}

function buildListFilters(form: FormFilters): AdminUserListFilters {
  const next: AdminUserListFilters = {
    sortBy: form.sortBy,
    sortOrder: form.sortOrder,
  }
  if (form.userId.trim()) next.userId = form.userId.trim()
  if (form.email.trim()) next.email = form.email.trim()
  if (form.name.trim()) next.name = form.name.trim()
  if (form.status !== 'all') next.status = form.status
  if (form.reportFilter !== 'all') next.reportFilter = form.reportFilter
  if (form.registeredFrom) next.registeredFrom = form.registeredFrom
  if (form.registeredTo) next.registeredTo = form.registeredTo
  return next
}

function buildUserStats(users: Array<AdminUserSummary>) {
  const total = users.length
  const suspended = users.filter((user) => user.status === 'suspended').length
  const highReports = users.filter((user) => user.reportCount >= 3).length
  return {
    total,
    suspended,
    highReports,
    lastUpdated: new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()),
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function csvEscape(value: string | number) {
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function createCsvFromUsers(users: Array<AdminUserSummary>) {
  const header = [
    'user_id',
    'name',
    'email',
    'status',
    'reports',
    'points',
    'registered_at',
    'last_login',
  ]
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    STATUS_LABEL[user.status],
    user.reportCount,
    user.points,
    formatDate(user.registeredAt),
    formatDate(user.lastLoginAt),
  ])
  return [header, ...rows]
    .map((columns) => columns.map(csvEscape).join(','))
    .join('\n')
}
