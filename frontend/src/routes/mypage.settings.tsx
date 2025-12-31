import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  LogOut,
  Moon,
  Shield,
  Trash2,
  UserRound,
  Volume2,
  X,
} from 'lucide-react'

import type {
  UpdateUserSettingsPayload,
  UserNotificationSettings,
  UserSettings,
} from '@/lib/api'
import {
  deleteUserAccount,
  fetchSupportResources,
  fetchUserSettings,
  logoutUser,
  updateUserSettings,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
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

export const Route = createFileRoute('/mypage/settings')({
  component: SettingsScreen,
})

type ToastState = { type: 'success' | 'error'; message: string }

type SettingsToast = ToastState | null

function SettingsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<SettingsToast>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const pendingRedirectRef = useRef<number | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['user-settings'],
    queryFn: fetchUserSettings,
    staleTime: 30_000,
  })

  const supportLinksQuery = useQuery({
    queryKey: ['support-links'],
    queryFn: fetchSupportResources,
    staleTime: 300_000,
  })

  useEffect(() => {
    if (!toast) return
    const handle = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(handle)
  }, [toast])

  useEffect(() => {
    return () => {
      if (pendingRedirectRef.current) {
        window.clearTimeout(pendingRedirectRef.current)
        pendingRedirectRef.current = null
      }
    }
  }, [])

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: UpdateUserSettingsPayload) =>
      updateUserSettings(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['user-settings'] })
      const previous = queryClient.getQueryData<UserSettings>(['user-settings'])
      if (previous) {
        queryClient.setQueryData(
          ['user-settings'],
          mergeSettings(previous, payload),
        )
      }
      return { previous }
    },
    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-settings'], context.previous)
      }
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : '設定の保存に失敗しました。',
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-settings'], data)
      setToast({ type: 'success', message: '設定を保存しました。' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear()
      setToast({ type: 'success', message: 'ログアウトしました。' })
      pendingRedirectRef.current = window.setTimeout(() => {
        router.navigate({ to: '/login' })
        pendingRedirectRef.current = null
      }, 900)
    },
    onError: (error) => {
      setToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'ログアウトに失敗しました。',
      })
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteUserAccount('user_request'),
    onSuccess: () => {
      setDeleteDialogOpen(false)
      queryClient.clear()
      setToast({ type: 'success', message: 'アカウントを削除しました。' })
      pendingRedirectRef.current = window.setTimeout(() => {
        router.navigate({ to: '/signup' })
        pendingRedirectRef.current = null
      }, 900)
    },
    onError: (error) => {
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'アカウント削除に失敗しました。',
      })
    },
  })

  const handleNotificationToggle = (key: keyof UserNotificationSettings) => {
    if (!settingsQuery.data || updateSettingsMutation.isPending) {
      return
    }
    updateSettingsMutation.mutate({
      notifications: {
        [key]: !settingsQuery.data.notifications[key],
      },
    })
  }

  const settings = settingsQuery.data
  const supportLinks = supportLinksQuery.data
  const isLoadingFirstView = settingsQuery.isLoading && !settings

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      {toast && (
        <FloatingToast toast={toast} onDismiss={() => setToast(null)} />
      )}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-500/25 blur-[150px]" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-[160px]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-8 sm:px-6">
        <Header />
        {isLoadingFirstView && <SettingsSkeleton />}
        {settingsQuery.isError && !settings && (
          <ErrorState onRetry={() => settingsQuery.refetch()} />
        )}
        {settings && (
          <div className="space-y-6">
            <SectionCard
              title="アカウント"
              description="プロフィールやパスワードの管理"
            >
              <ActionLink
                to="/mypage/edit"
                icon={<UserRound className="h-4 w-4" />}
                title="プロフィールを編集"
                description="写真・自己紹介・公開情報"
              />
              <ActionLink
                to="/mypage/password"
                icon={<Shield className="h-4 w-4" />}
                title="パスワードを変更"
                description="セキュリティ対策を強化する"
              />
            </SectionCard>

            <SectionCard
              title="通知設定"
              description="重要なお知らせの受け取り方を選択"
            >
              <NotificationToggle
                label="プッシュ通知"
                description="通話リクエストや運営からのお知らせ"
                value={settings.notifications.push}
                disabled={updateSettingsMutation.isPending}
                onToggle={() => handleNotificationToggle('push')}
              />
              <NotificationToggle
                label="メール通知"
                description="残ポイントやキャンペーン情報"
                value={settings.notifications.email}
                disabled={updateSettingsMutation.isPending}
                onToggle={() => handleNotificationToggle('email')}
              />
            </SectionCard>

            <SectionCard
              title="アプリ設定"
              description="アプリ全体の体験に関する設定"
            >
              <StaticSettingRow
                icon={<Moon className="h-4 w-4" />}
                label="テーマ"
                value={
                  settings.app.theme === 'dark'
                    ? 'ダークモード'
                    : 'ライトモード'
                }
                hint="現在はダークモードのみ提供中"
              />
              <StaticSettingRow
                icon={<Volume2 className="h-4 w-4" />}
                label="音声設定"
                value="詳細設定"
                hint="ビープ音やマイクテストは近日公開"
                actionLabel="準備中"
              />
            </SectionCard>

            <SectionCard
              title="サポート"
              description="各種ドキュメント・お問い合わせ"
            >
              <SupportLinkRow
                label="ブロックリスト管理"
                to="/mypage/block-list"
              />
              <SupportLinkRow label="利用規約" to="/mypage/legal/terms" />
              <SupportLinkRow
                label="プライバシーポリシー"
                to="/mypage/legal/privacy"
              />
              <SupportLinkRow
                label="お問い合わせ"
                href={supportLinks?.contactUrl}
              />
              {supportLinks?.faqUrl && (
                <SupportLinkRow label="FAQ" href={supportLinks.faqUrl} />
              )}
            </SectionCard>

            <SectionCard
              title="アカウント操作"
              description="サービスの利用状況を管理"
            >
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between rounded-2xl border-white/30 text-white"
                  onClick={() => logoutMutation.mutate()}
                  disabled={
                    logoutMutation.isPending || deleteAccountMutation.isPending
                  }
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </span>
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-between rounded-2xl"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={
                    logoutMutation.isPending || deleteAccountMutation.isPending
                  }
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    アカウント削除
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </Button>
              </div>
            </SectionCard>
          </div>
        )}
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              <AlertTriangle className="h-5 w-5 text-rose-300" />
              アカウント削除の確認
            </DialogTitle>
            <DialogDescription>
              この操作は元に戻せません。すべての通話履歴やポイントが失われます。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-100">
            削除後に再度ご利用いただく場合は、新しいアカウント登録が必要です。
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl border-white/20"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteAccountMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1 rounded-2xl"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  削除中
                </>
              ) : (
                'アカウントを削除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          className="rounded-2xl border border-white/10 text-white"
        >
          <Link
            to="/mypage"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            マイページへ戻る
          </Link>
        </Button>
        <span className="text-xs uppercase tracking-[0.4em] text-white/60">
          C-04
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm text-white/60">Account &amp; App Settings</p>
        <h1 className="text-3xl font-semibold text-white">設定</h1>
      </div>
    </header>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-white/70">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function ActionLink({
  to,
  title,
  description,
  icon,
}: {
  to: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 transition hover:border-white/40"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-white/10 p-2 text-white/80">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="text-sm text-white/60">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-white/70" />
    </Link>
  )
}

function NotificationToggle({
  label,
  description,
  value,
  disabled,
  onToggle,
}: {
  label: string
  description: string
  value: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <button
        type="button"
        className={`relative h-8 w-14 rounded-full border ${value ? 'border-emerald-300 bg-emerald-400/30' : 'border-white/20 bg-white/10'} ${disabled ? 'opacity-60' : ''}`}
        aria-pressed={value}
        aria-label={`${label}を${value ? 'オフ' : 'オン'}にする`}
        onClick={onToggle}
        disabled={disabled}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${value ? 'right-1' : 'left-1'}`}
        />
      </button>
    </div>
  )
}

function StaticSettingRow({
  icon,
  label,
  value,
  hint,
  actionLabel,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  actionLabel?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-white/10 p-2 text-white/80">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-white">{label}</p>
          <p className="text-sm text-white/60">{hint ?? value}</p>
        </div>
      </div>
      <div className="text-right text-sm text-white/80">
        <p>{value}</p>
        {actionLabel && <p className="text-xs text-white/50">{actionLabel}</p>}
      </div>
    </div>
  )
}

function SupportLinkRow({
  label,
  href,
  to,
}: {
  label: string
  href?: string
  to?: string
}) {
  const commonClasses =
    'flex items-center justify-between rounded-2xl px-4 py-3 transition'

  if (!href && !to) {
    return (
      <div
        className={`${commonClasses} border border-white/10 bg-white/5 text-white/40`}
      >
        <span>{label}</span>
        <AlertCircle className="h-4 w-4" />
      </div>
    )
  }

  if (to) {
    return (
      <Link
        to={to}
        className={`${commonClasses} border border-white/15 bg-white/5 text-white hover:border-white/40`}
      >
        <span>{label}</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${commonClasses} border border-white/15 bg-white/5 text-white hover:border-white/40`}
    >
      <span>{label}</span>
      <ExternalLink className="h-4 w-4" />
    </a>
  )
}

function FloatingToast({
  toast,
  onDismiss,
}: {
  toast: ToastState
  onDismiss: () => void
}) {
  const isSuccess = toast.type === 'success'
  const toneClass = isSuccess
    ? 'border-emerald-300/60 bg-emerald-400/20 text-emerald-50'
    : 'border-rose-400/60 bg-rose-500/25 text-rose-50'
  const Icon = isSuccess ? CheckCircle2 : AlertCircle

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${toneClass}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm">{toast.message}</p>
        <button
          type="button"
          aria-label="通知を閉じる"
          className="rounded-full p-1 text-white/80 transition hover:bg-white/10"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-52 w-full rounded-3xl" />
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-white">設定を読み込めませんでした</CardTitle>
        <CardDescription className="text-rose-100">
          ネットワーク状態を確認してから再度お試しください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" className="rounded-2xl" onClick={onRetry}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function mergeSettings(
  base: UserSettings,
  patch: UpdateUserSettingsPayload,
): UserSettings {
  // Merge nested settings to keep unspecified values untouched.
  const notifications = {
    ...base.notifications,
    ...(patch.notifications ?? {}),
  }
  const app = {
    ...base.app,
    ...(patch.app ?? {}),
  }
  return { notifications, app }
}
