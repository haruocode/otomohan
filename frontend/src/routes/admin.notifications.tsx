import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Bell,
  ClipboardList,
  Clock4,
  Filter,
  Mail,
  PenLine,
  PhoneCall,
  Plus,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react'

import type { FormEvent, ReactNode } from 'react'

import type {
  AdminNotificationAudience,
  AdminNotificationCategory,
  AdminNotificationDetail,
  AdminNotificationStatus,
  AdminNotificationSummary,
  CreateAdminNotificationPayload,
  SendAdminNotificationPayload,
} from '@/lib/api'
import {
  createAdminNotification,
  fetchAdminNotificationDetail,
  fetchAdminNotifications,
  sendAdminNotification,
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

export const Route = createFileRoute('/admin/notifications')({
  component: AdminNotificationsScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const categoryLabel: Record<AdminNotificationCategory, string> = {
  system: 'システム',
  update: 'アップデート',
  campaign: 'キャンペーン',
  otomo: 'おともはん向け',
  user: 'ユーザー向け',
  critical: '重要',
}

const audienceLabel: Record<AdminNotificationAudience, string> = {
  all: '全体',
  users: 'ユーザー',
  otomo: 'おともはん',
  custom: '個別指定',
}

const statusBadgeVariant: Record<
  AdminNotificationStatus,
  'outline' | 'info' | 'success' | 'danger'
> = {
  draft: 'outline',
  scheduled: 'info',
  sent: 'success',
  failed: 'danger',
}

const statusLabel: Record<AdminNotificationStatus, string> = {
  draft: '下書き',
  scheduled: '予約',
  sent: '配信済み',
  failed: '失敗',
}

const channelLabel = {
  inApp: 'アプリ内',
  push: 'プッシュ',
  email: 'メール',
} as const

const categoryOptions = Object.entries(categoryLabel)
const audienceOptions = Object.entries(audienceLabel)
const statusOptions = Object.entries(statusLabel)

type FilterForm = {
  title: string
  category: '' | AdminNotificationCategory
  audience: '' | AdminNotificationAudience
  status: '' | AdminNotificationStatus
  scheduledFrom: string
  scheduledTo: string
}

const initialFilterForm: FilterForm = {
  title: '',
  category: '',
  audience: '',
  status: '',
  scheduledFrom: '',
  scheduledTo: '',
}

type ComposerForm = {
  title: string
  body: string
  category: AdminNotificationCategory
  audience: AdminNotificationAudience
  channels: Array<keyof typeof channelLabel>
  scheduleMode: 'immediate' | 'scheduled'
  scheduledAt: string
  targetUserIds: string
}

const initialComposerForm: ComposerForm = {
  title: '',
  body: '',
  category: 'system',
  audience: 'all',
  channels: ['inApp'],
  scheduleMode: 'immediate',
  scheduledAt: '',
  targetUserIds: '',
}

type NotificationStats = {
  total: number
  draft: number
  scheduled: number
  sent: number
  failed: number
}

function AdminNotificationsScreen() {
  const [formFilters, setFormFilters] = useState<FilterForm>(initialFilterForm)
  const [activeFilters, setActiveFilters] = useState(initialFilterForm)
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerForm, setComposerForm] =
    useState<ComposerForm>(initialComposerForm)
  const [composerNotice, setComposerNotice] = useState('')

  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications', activeFilters],
    queryFn: (): Promise<AdminNotificationSummary[]> =>
      fetchAdminNotifications({
        title: activeFilters.title || undefined,
        category: activeFilters.category || undefined,
        audience: activeFilters.audience || undefined,
        status: activeFilters.status || undefined,
        scheduledFrom: activeFilters.scheduledFrom || undefined,
        scheduledTo: activeFilters.scheduledTo || undefined,
      }),
    placeholderData: (previousData): AdminNotificationSummary[] | undefined =>
      previousData,
  })

  const createMutation = useMutation<
    AdminNotificationDetail,
    unknown,
    CreateAdminNotificationPayload
  >({
    mutationFn: (payload) => createAdminNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      setComposerNotice('通知を登録しました')
      setComposerForm(initialComposerForm)
      setComposerOpen(false)
    },
    onError: (error: unknown) => {
      setComposerNotice(
        error instanceof Error ? error.message : '通知の作成に失敗しました',
      )
    },
  })

  const sendMutation = useMutation<
    AdminNotificationDetail,
    unknown,
    SendAdminNotificationPayload
  >({
    mutationFn: (payload) => sendAdminNotification(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['admin-notification-detail', variables.notificationId],
      })
    },
  })

  const notifications: AdminNotificationSummary[] =
    notificationsQuery.data ?? []
  const stats = useMemo<NotificationStats>(
    () => buildNotificationStats(notifications),
    [notifications],
  )

  const handleFilterChange = (field: keyof FilterForm, value: string) => {
    setFormFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveFilters(formFilters)
  }

  const handleResetFilters = () => {
    setFormFilters(initialFilterForm)
    setActiveFilters(initialFilterForm)
  }

  const handleComposerInput = (field: keyof ComposerForm, value: string) => {
    setComposerForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleChannel = (channel: keyof typeof channelLabel) => {
    setComposerForm((prev) => {
      const exists = prev.channels.includes(channel)
      if (exists && prev.channels.length === 1) {
        return prev
      }
      return {
        ...prev,
        channels: exists
          ? prev.channels.filter((value) => value !== channel)
          : [...prev.channels, channel],
      }
    })
  }

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setComposerNotice('')
    if (!composerForm.title.trim()) {
      setComposerNotice('タイトルを入力してください')
      return
    }
    if (!composerForm.body.trim()) {
      setComposerNotice('本文を入力してください')
      return
    }
    if (
      composerForm.scheduleMode === 'scheduled' &&
      !composerForm.scheduledAt
    ) {
      setComposerNotice('予約日時を入力してください')
      return
    }
    const payload: CreateAdminNotificationPayload = {
      title: composerForm.title.trim(),
      body: composerForm.body.trim(),
      category: composerForm.category,
      audience: composerForm.audience,
      channels: composerForm.channels.slice(),
      scheduleMode: composerForm.scheduleMode,
      scheduledAt:
        composerForm.scheduleMode === 'scheduled'
          ? new Date(composerForm.scheduledAt).toISOString()
          : undefined,
      targetUserIds:
        composerForm.audience === 'custom' && composerForm.targetUserIds.trim()
          ? composerForm.targetUserIds
              .split(/\s|,|\n/)
              .map((value) => value.trim())
              .filter(Boolean)
          : undefined,
    }
    createMutation.mutate(payload)
  }

  const handleTestSend = () => {
    setComposerNotice('テスト送信（モック）を実行しました')
  }

  const handleSendNow = (notificationId: string) => {
    sendMutation.mutate({ notificationId, mode: 'immediate' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">
              A-07 / NOTIFICATION OPS
            </p>
            <h1 className="mt-2 text-4xl font-bold">通知管理</h1>
            <p className="text-sm text-white/70">
              メンテ告知・キャンペーン・重要警告などの通知を一元管理し、配信状況をトレースします。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                notificationsQuery.refetch()
              }}
              disabled={notificationsQuery.isFetching}
            >
              {notificationsQuery.isFetching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              最新に更新
            </Button>
            <Button
              className="rounded-2xl"
              onClick={() => setComposerOpen((prev) => !prev)}
            >
              <Plus className="h-4 w-4" />
              新規通知
            </Button>
          </div>
        </header>

        {composerOpen && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Bell className="h-5 w-5 text-rose-300" />
                新規通知を作成
              </CardTitle>
              <CardDescription>
                タイトルや本文、配信対象・チャンネルを設定し、即時または予約で配信します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleComposerSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      タイトル
                    </label>
                    <input
                      value={composerForm.title}
                      onChange={(event) =>
                        handleComposerInput('title', event.target.value)
                      }
                      className={inputBaseClass}
                      maxLength={50}
                      placeholder="例) メンテナンスのお知らせ"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      カテゴリ
                    </label>
                    <select
                      value={composerForm.category}
                      onChange={(event) =>
                        handleComposerInput(
                          'category',
                          event.target.value as AdminNotificationCategory,
                        )
                      }
                      className={inputBaseClass}
                    >
                      {categoryOptions.map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    本文
                  </label>
                  <textarea
                    value={composerForm.body}
                    onChange={(event) =>
                      handleComposerInput('body', event.target.value)
                    }
                    className={cn(
                      inputBaseClass,
                      'min-h-[160px] resize-none bg-white/0',
                    )}
                    maxLength={500}
                    placeholder="通知本文を入力してください (500文字まで)"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      対象ユーザー
                    </label>
                    <select
                      value={composerForm.audience}
                      onChange={(event) =>
                        handleComposerInput(
                          'audience',
                          event.target.value as AdminNotificationAudience,
                        )
                      }
                      className={inputBaseClass}
                    >
                      {audienceOptions.map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      配信方式
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { value: 'immediate', label: '今すぐ配信' },
                          { value: 'scheduled', label: '予約配信' },
                        ] as const
                      ).map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            composerForm.scheduleMode === option.value
                              ? 'secondary'
                              : 'outline'
                          }
                          className="rounded-2xl"
                          onClick={() =>
                            handleComposerInput('scheduleMode', option.value)
                          }
                        >
                          <Clock4 className="mr-2 h-4 w-4" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                {composerForm.scheduleMode === 'scheduled' && (
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      予約日時
                    </label>
                    <input
                      type="datetime-local"
                      value={composerForm.scheduledAt}
                      onChange={(event) =>
                        handleComposerInput('scheduledAt', event.target.value)
                      }
                      className={inputBaseClass}
                    />
                  </div>
                )}
                {composerForm.audience === 'custom' && (
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      対象ユーザーID（カンマ / 改行区切り）
                    </label>
                    <textarea
                      value={composerForm.targetUserIds}
                      onChange={(event) =>
                        handleComposerInput('targetUserIds', event.target.value)
                      }
                      className={cn(
                        inputBaseClass,
                        'min-h-[80px] resize-none bg-white/0',
                      )}
                      placeholder="user_001, user_123 ..."
                    />
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    通知チャンネル
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {(
                      Object.keys(channelLabel) as Array<
                        keyof typeof channelLabel
                      >
                    ).map((channel) => (
                      <Button
                        type="button"
                        key={channel}
                        variant={
                          composerForm.channels.includes(channel)
                            ? 'secondary'
                            : 'outline'
                        }
                        className="rounded-2xl"
                        onClick={() => toggleChannel(channel)}
                      >
                        {channel === 'email' ? (
                          <Mail className="mr-2 h-4 w-4" />
                        ) : (
                          <PhoneCall className="mr-2 h-4 w-4" />
                        )}
                        {channelLabel[channel]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    className="rounded-2xl"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    保存 / 配信
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={handleTestSend}
                  >
                    テスト送信
                  </Button>
                  {composerNotice && (
                    <span className="text-sm text-white/70">
                      {composerNotice}
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Filter className="h-5 w-5 text-rose-300" />
              通知検索フィルター
            </CardTitle>
            <CardDescription>
              タイトル・カテゴリ・対象・状態で絞り込み、配信状況を素早く追跡します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={formFilters.title}
                  onChange={(event) =>
                    handleFilterChange('title', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="タイトル"
                />
                <select
                  value={formFilters.category}
                  onChange={(event) =>
                    handleFilterChange('category', event.target.value)
                  }
                  className={inputBaseClass}
                >
                  <option value="">カテゴリ（すべて）</option>
                  {categoryOptions.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={formFilters.audience}
                  onChange={(event) =>
                    handleFilterChange('audience', event.target.value)
                  }
                  className={inputBaseClass}
                >
                  <option value="">対象（すべて）</option>
                  {audienceOptions.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={formFilters.status}
                  onChange={(event) =>
                    handleFilterChange('status', event.target.value)
                  }
                  className={inputBaseClass}
                >
                  <option value="">状態（すべて）</option>
                  {statusOptions.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={formFilters.scheduledFrom}
                  onChange={(event) =>
                    handleFilterChange('scheduledFrom', event.target.value)
                  }
                  className={inputBaseClass}
                />
                <input
                  type="datetime-local"
                  value={formFilters.scheduledTo}
                  onChange={(event) =>
                    handleFilterChange('scheduledTo', event.target.value)
                  }
                  className={inputBaseClass}
                />
                <div className="flex items-center gap-3">
                  <Button type="submit" className="w-full rounded-2xl">
                    検索
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl"
                    onClick={handleResetFilters}
                  >
                    リセット
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="登録済み通知"
            helper="総件数"
            value={`${stats.total.toLocaleString()} 件`}
          />
          <StatCard
            icon={<PenLine className="h-5 w-5" />}
            label="下書き"
            helper="配信待ち"
            value={`${stats.draft.toLocaleString()} 件`}
          />
          <StatCard
            icon={<Clock4 className="h-5 w-5" />}
            label="予約中"
            helper="スケジュール"
            value={`${stats.scheduled.toLocaleString()} 件`}
          />
          <StatCard
            icon={<Send className="h-5 w-5" />}
            label="配信済み"
            helper="成功済"
            value={`${stats.sent.toLocaleString()} 件`}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">通知一覧</CardTitle>
              <CardDescription>
                通知タイトル・カテゴリ・対象・状態を確認し、詳細モーダルや再送を行います。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {notifications.length.toLocaleString()} 件
            </Badge>
          </CardHeader>
          <CardContent>
            {notificationsQuery.status === 'pending' && (
              <NotificationTableSkeleton />
            )}
            {notificationsQuery.status === 'error' && (
              <ErrorBanner error={notificationsQuery.error} />
            )}
            {notificationsQuery.status === 'success' && (
              <NotificationTable
                notifications={notifications}
                onSelect={(notificationId) =>
                  setSelectedNotificationId(notificationId)
                }
                onSend={handleSendNow}
                sendingId={sendMutation.variables?.notificationId}
                isSending={sendMutation.isPending}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <NotificationDetailDialog
        notificationId={selectedNotificationId}
        onClose={() => setSelectedNotificationId(null)}
      />
    </div>
  )
}

function NotificationTable({
  notifications,
  onSelect,
  onSend,
  sendingId,
  isSending,
}: {
  notifications: Array<AdminNotificationSummary>
  onSelect: (notificationId: string) => void
  onSend: (notificationId: string) => void
  sendingId?: string
  isSending: boolean
}) {
  if (!notifications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        条件に一致する通知がありません。
      </div>
    )
  }
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">タイトル</th>
            <th className="px-4 py-3 font-medium">カテゴリ</th>
            <th className="px-4 py-3 font-medium">対象</th>
            <th className="px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium">配信日時</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification) => (
            <tr key={notification.id} className="border-t border-white/10">
              <td className="px-4 py-3 text-white">{notification.title}</td>
              <td className="px-4 py-3">
                <Badge className="text-xs" variant="outline">
                  {categoryLabel[notification.category]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-white/80">
                {audienceLabel[notification.audience]}
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusBadgeVariant[notification.status]}>
                  {statusLabel[notification.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-white/70">
                {notification.scheduledAt
                  ? formatDateTime(notification.scheduledAt)
                  : '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-2xl"
                    onClick={() => onSelect(notification.id)}
                  >
                    詳細
                  </Button>
                  {['draft', 'failed'].includes(notification.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => onSend(notification.id)}
                      disabled={isSending && sendingId === notification.id}
                    >
                      {isSending && sendingId === notification.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      即時配信
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NotificationTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-2xl bg-white/5" />
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

function StatCard({
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

function NotificationDetailDialog({
  notificationId,
  onClose,
}: {
  notificationId: string | null
  onClose: () => void
}) {
  const detailQuery = useQuery<AdminNotificationDetail>({
    queryKey: ['admin-notification-detail', notificationId],
    queryFn: () => fetchAdminNotificationDetail(notificationId ?? ''),
    enabled: Boolean(notificationId),
  })
  const detailData = detailQuery.data

  return (
    <Dialog
      open={Boolean(notificationId)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle>通知詳細</DialogTitle>
          <DialogDescription>
            配信先・結果・プレビューを確認し、失敗理由を分析します。
          </DialogDescription>
        </DialogHeader>
        {detailQuery.status === 'pending' && <NotificationDetailSkeleton />}
        {detailQuery.status === 'error' && (
          <ErrorBanner error={detailQuery.error} />
        )}
        {detailQuery.status === 'success' && detailData ? (
          <NotificationDetailContent detail={detailData} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function NotificationDetailContent({
  detail,
}: {
  detail: AdminNotificationDetail
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{categoryLabel[detail.category]}</Badge>
          <Badge variant="info">{audienceLabel[detail.audience]}</Badge>
          <Badge variant={statusBadgeVariant[detail.status]}>
            {statusLabel[detail.status]}
          </Badge>
        </div>
        <h2 className="text-2xl font-semibold">{detail.title}</h2>
        <p className="text-sm text-white/80">{detail.body}</p>
        <div className="grid gap-3 text-sm text-white/70 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Clock4 className="h-4 w-4" />
            配信日時:{' '}
            {detail.scheduledAt ? formatDateTime(detail.scheduledAt) : '-'}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            対象: {audienceLabel[detail.audience]}
          </div>
        </div>
        <div className="text-xs text-white/50">
          作成: {formatDateTime(detail.createdAt)} / 更新:{' '}
          {formatDateTime(detail.updatedAt)}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">配信結果</h3>
          <p className="mt-1 text-sm text-white/70">
            成功 {detail.delivery.successCount.toLocaleString()} 件 / 失敗{' '}
            {detail.delivery.failureCount.toLocaleString()} 件
          </p>
          {detail.delivery.failureReasons.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {detail.delivery.failureReasons.map((reason) => (
                <li
                  key={reason.code}
                  className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2"
                >
                  <span>{reason.description}</span>
                  <span className="text-rose-200">{reason.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">プレビュー</h3>
          <NotificationPreview
            snippet={detail.previewSnippet}
            title={detail.title}
          />
        </div>
      </section>
      {detail.targetUserIds && detail.targetUserIds.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">対象ユーザー</h3>
          <p className="text-sm text-white/70">
            {detail.targetUserIds.join(', ')}
          </p>
        </section>
      )}
    </div>
  )
}

function NotificationPreview({
  title,
  snippet,
}: {
  title: string
  snippet: string
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          モバイル通知
        </p>
        <h4 className="mt-2 text-lg font-semibold">{title}</h4>
        <p className="text-sm text-white/70">{snippet}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          アプリ内カード
        </p>
        <p className="text-sm text-white/80">{snippet}</p>
      </div>
    </div>
  )
}

function NotificationDetailSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

function buildNotificationStats(
  items: Array<AdminNotificationSummary>,
): NotificationStats {
  return items.reduce<NotificationStats>(
    (acc, item) => {
      acc.total += 1
      if (item.status === 'draft') acc.draft += 1
      else if (item.status === 'scheduled') acc.scheduled += 1
      else if (item.status === 'sent') acc.sent += 1
      else acc.failed += 1
      return acc
    },
    { total: 0, draft: 0, scheduled: 0, sent: 0, failed: 0 },
  )
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour12: false,
  })
}
