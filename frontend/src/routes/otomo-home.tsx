import { useEffect, useMemo } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Headphones,
  History,
  Home,
  Loader2,
  Settings,
  SignalHigh,
  Star,
  Wallet,
  Waves,
} from 'lucide-react'

import type { OtomoDashboardProfile, OtomoRecentCall } from '@/lib/api'
import {
  fetchIncomingCall,
  fetchOtomoActiveCall,
  fetchOtomoSelf,
  updateOtomoStatus,
} from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_OPTIONS: Array<{
  id: OtomoDashboardProfile['status']
  label: string
  helper: string
  dot: string
}> = [
  {
    id: 'online',
    label: '待機中',
    helper: 'リクエスト受付中',
    dot: 'bg-emerald-400',
  },
  {
    id: 'away',
    label: '離席中',
    helper: 'リクエスト停止',
    dot: 'bg-amber-400',
  },
  {
    id: 'busy',
    label: '通話中',
    helper: '自動的に切替',
    dot: 'bg-rose-400',
  },
]

export const Route = createFileRoute('/otomo-home')({
  component: OtomoHomeScreen,
})

function OtomoHomeScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const otomoQuery = useQuery({
    queryKey: ['otomo-self'],
    queryFn: fetchOtomoSelf,
    refetchInterval: 45_000,
  })

  const incomingCallQuery = useQuery({
    queryKey: ['otomo-incoming-call'],
    queryFn: fetchIncomingCall,
    refetchInterval: 5_000,
  })

  const activeCallQuery = useQuery({
    queryKey: ['otomo-active-call'],
    queryFn: fetchOtomoActiveCall,
    refetchInterval: 5_000,
  })

  useEffect(() => {
    if (incomingCallQuery.data?.call) {
      router.navigate({ to: '/otomo-call/incoming' })
    }
  }, [incomingCallQuery.data?.call?.callId, router])

  useEffect(() => {
    if (activeCallQuery.data?.call) {
      router.navigate({ to: '/otomo-call/active' })
    }
  }, [activeCallQuery.data?.call?.callId, router])

  const statusMutation = useMutation({
    mutationFn: updateOtomoStatus,
    onSuccess: (profile) => {
      queryClient.setQueryData(['otomo-self'], profile)
    },
  })

  const profile = otomoQuery.data

  if (otomoQuery.isLoading) {
    return <OtomoHomeSkeleton />
  }

  if (otomoQuery.isError || !profile) {
    return (
      <ErrorState
        message="待機情報の取得に失敗しました"
        onRetry={() => otomoQuery.refetch()}
      />
    )
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-rose-500/20 blur-[160px]" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-sky-500/20 blur-[170px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-32 pt-8 sm:px-6">
        <HeaderSection profile={profile} />
        <StatusSection
          profile={profile}
          isUpdating={statusMutation.isPending}
          onChange={(status) => {
            if (status === profile.status) return
            statusMutation.mutate(status)
          }}
        />
        <StatusHelper status={profile.status} />
        <RewardSection profile={profile} />
        <WaitingVisualizer status={profile.status} />
        <ScheduleShortcut
          onClick={() => router.navigate({ to: '/otomo-schedule' })}
        />
        <ReviewsShortcut
          onClick={() => router.navigate({ to: '/otomo-reviews' })}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border border-dashed border-white/30 bg-white/5 text-white"
          onClick={() => router.navigate({ to: '/otomo-call/incoming' })}
        >
          デモ: 着信画面を開く
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border border-dashed border-white/30 bg-white/5 text-white"
          onClick={() => router.navigate({ to: '/otomo-call/active' })}
        >
          デモ: 通話中画面を開く
        </Button>
        <RecentCallSection recentCalls={profile.recentCalls} />
      </main>

      <BottomNavigation />
    </div>
  )
}

function HeaderSection({ profile }: { profile: OtomoDashboardProfile }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Button
        variant="ghost"
        className="w-auto rounded-2xl border border-white/10 text-white"
      >
        <Settings className="mr-2 h-4 w-4" />
        設定
      </Button>
      <div className="text-center">
        <p className="text-sm text-white/60">画面ID O-01 / おともはんホーム</p>
        <h1 className="text-2xl font-semibold text-white">
          待機中の {profile.name}
        </h1>
      </div>
      <Button
        variant="ghost"
        className="relative rounded-2xl border border-white/10 text-white"
      >
        <Bell className="h-4 w-4" />
        {profile.notifications ? (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold">
            {profile.notifications}
          </span>
        ) : null}
      </Button>
    </header>
  )
}

function StatusSection({
  profile,
  isUpdating,
  onChange,
}: {
  profile: OtomoDashboardProfile
  isUpdating: boolean
  onChange: (status: OtomoDashboardProfile['status']) => void
}) {
  const activeOption = STATUS_OPTIONS.find(
    (option) => option.id === profile.status,
  )

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-white/10">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback>
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            {profile.bio && (
              <CardDescription className="text-white/70">
                {profile.bio}
              </CardDescription>
            )}
            {activeOption && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm text-white">
                <span
                  className={`h-2 w-2 rounded-full ${activeOption.dot}`}
                  aria-hidden
                />
                {activeOption.label}（{activeOption.helper}）
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((option) => {
            const isActive = option.id === profile.status
            return (
              <Button
                key={option.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                className={`rounded-2xl border ${
                  isActive
                    ? 'border-white bg-white/90 text-slate-900'
                    : 'border-white/20 text-white'
                }`}
                disabled={isUpdating}
                onClick={() => onChange(option.id)}
              >
                <span
                  className={`mr-2 h-2 w-2 rounded-full ${option.dot}`}
                  aria-hidden
                />
                {option.label}
              </Button>
            )
          })}
        </div>
        <p className="text-sm text-white/70">
          {profile.availabilityMessage ??
            'ステータスに応じて通話リクエストの受付を切り替えます。'}
        </p>
      </CardContent>
    </Card>
  )
}

function StatusHelper({ status }: { status: OtomoDashboardProfile['status'] }) {
  const meta = useMemo(() => {
    switch (status) {
      case 'online':
        return '「待機中」の間はユーザーからの通話リクエストが届きます。'
      case 'away':
        return '「離席中」にするとリクエストは届きません。再開時に待機中へ戻してください。'
      case 'busy':
        return '通話中は自動的にリクエスト受付が停止します。終了後に待機中へ戻ります。'
      default:
        return ''
    }
  }, [status])

  return (
    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
      {meta}
    </p>
  )
}

function RewardSection({ profile }: { profile: OtomoDashboardProfile }) {
  const reward = profile.rewardSummary

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>報酬サマリー</CardTitle>
          <CardDescription className="text-white/70">
            最新のポイント状況
          </CardDescription>
        </div>
        <Badge className="rounded-full bg-white/90 text-slate-900">
          更新:{' '}
          {reward.lastUpdatedAt
            ? new Date(reward.lastUpdatedAt).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '取得中'}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <RewardStat
          label="本日の報酬"
          value={`${reward.todayPoints.toLocaleString('ja-JP')} pt`}
          icon={Wallet}
        />
        <RewardStat
          label="累計報酬"
          value={`${reward.totalPoints.toLocaleString('ja-JP')} pt`}
          icon={BarChart3}
        />
        <RewardStat
          label="直近7日"
          value={`${(reward.weekPoints ?? 0).toLocaleString('ja-JP')} pt`}
          icon={SignalHigh}
        />
        <RewardStat
          label="承認待ち"
          value={`${(reward.pendingPoints ?? 0).toLocaleString('ja-JP')} pt`}
          icon={Headphones}
        />
        <Button
          variant="ghost"
          className="col-span-full justify-between rounded-2xl border border-white/10 text-white"
        >
          報酬履歴を見る
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

function RewardStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Wallet
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3 text-sm text-white/70">
        <Icon className="h-4 w-4 text-white" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function WaitingVisualizer({
  status,
}: {
  status: OtomoDashboardProfile['status']
}) {
  const statusText =
    status === 'online'
      ? '待機中... ユーザーからの着信を待っています'
      : status === 'away'
        ? '離席中... リクエストは一時停止'
        : '通話中... 自動的に状態が更新されます'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500/20 via-indigo-500/20 to-slate-900 p-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full border border-white/10">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full border border-white/30" />
            <div className="absolute h-36 w-36 animate-ping rounded-full border border-white/20" />
          </div>
        </div>
      </div>
      <div className="relative z-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <Waves className="h-6 w-6" />
        </div>
        <p className="text-lg font-semibold">{statusText}</p>
        <p className="mt-2 text-sm text-white/70">
          ステータスは自動的に同期されます。着信があると O-02
          着信画面へ切り替わります。
        </p>
      </div>
    </div>
  )
}

function ScheduleShortcut({ onClick }: { onClick: () => void }) {
  return (
    <Card className="border-2 border-dashed border-white/20 bg-white/5">
      <CardContent className="flex flex-col gap-4 p-6 text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
            <CalendarDays className="h-3.5 w-3.5" />
            O-06 preview
          </div>
          <p className="text-lg font-semibold text-white">
            稼働スケジュールを設定
          </p>
          <p className="text-sm text-white/70">
            1週間分の稼働時間を登録すると、自動で待機/離席の切替が行われます。
          </p>
        </div>
        <Button
          type="button"
          className="w-full rounded-2xl bg-white/90 text-slate-900 hover:bg-white sm:w-auto"
          onClick={onClick}
        >
          予定を編集
        </Button>
      </CardContent>
    </Card>
  )
}

function ReviewsShortcut({ onClick }: { onClick: () => void }) {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-rose-500/10 via-sky-500/5 to-slate-900/40">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
            <Star className="h-3.5 w-3.5" />
            O-07 preview
          </div>
          <p className="text-lg font-semibold text-white">レビューをチェック</p>
          <p className="text-sm text-white/70">
            最新の評価やコメントを確認して、対応品質の改善に役立てましょう。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-2xl border-white/30 text-white hover:bg-white/20 sm:w-auto"
          onClick={onClick}
        >
          レビューを見る
        </Button>
      </CardContent>
    </Card>
  )
}

function RecentCallSection({
  recentCalls,
}: {
  recentCalls: Array<OtomoRecentCall>
}) {
  if (!recentCalls.length) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>最近の通話</CardTitle>
          <CardDescription className="text-white/70">
            通話履歴がありません
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>最近の通話</CardTitle>
          <CardDescription className="text-white/70">
            最新 2 件を表示
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          className="rounded-2xl border border-white/10 text-white"
        >
          通話履歴を見る
          <History className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCalls.slice(0, 2).map((call) => (
          <RecentCallItem key={call.callId} call={call} />
        ))}
      </CardContent>
    </Card>
  )
}

function RecentCallItem({ call }: { call: OtomoRecentCall }) {
  const startedAt = new Date(call.startedAt)
  const timeLabel = startedAt.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateLabel = startedAt.toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm text-white/60">
          {dateLabel} {timeLabel} 開始
        </p>
        <p className="text-lg font-semibold text-white">{call.userName} さん</p>
      </div>
      <div className="text-right text-sm text-white/70">
        約 {call.durationMinutes} 分
      </div>
    </div>
  )
}

function BottomNavigation() {
  const items = [
    { id: 'home', label: 'ホーム', icon: Home, active: true },
    { id: 'history', label: '通話履歴', icon: History },
    { id: 'rewards', label: '報酬', icon: Wallet },
    { id: 'settings', label: '設定', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-6 left-1/2 z-20 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-3 text-sm text-white shadow-2xl shadow-black/40 backdrop-blur-2xl">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs ${
            item.active ? 'bg-white/20 text-white' : 'text-white/70'
          }`}
          disabled={!item.active}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function OtomoHomeSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-20 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-32 w-full rounded-3xl" />
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">
      <AlertCircle className="h-12 w-12 text-rose-400" />
      <p className="text-lg">{message}</p>
      <Button variant="destructive" onClick={onRetry} className="rounded-2xl">
        <Loader2 className="mr-2 h-4 w-4" />
        再読み込み
      </Button>
    </div>
  )
}
