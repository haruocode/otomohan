import { useMemo, useState } from 'react'
import { Link, createFileRoute, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlarmClock,
  Bell,
  Compass,
  History,
  Home as HomeIcon,
  Loader2,
  PhoneCall,
  RefreshCw,
  Sparkles,
  Star,
  Tag,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { OtomoPresenceStatus, OtomoProfile } from '@/lib/api'
import { fetchOtomoProfiles, fetchWalletBalance } from '@/lib/api'
import { OTOMO_STATUS_META, getStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_FILTER_VALUES = [
  'all',
  'online',
  'busy',
  'away',
  'offline',
] as const
type StatusFilter = (typeof STATUS_FILTER_VALUES)[number]

const STATUS_META = OTOMO_STATUS_META

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'すべて' },
  { id: 'online', label: 'オンライン' },
  { id: 'busy', label: '通話中' },
  { id: 'away', label: '離席' },
  { id: 'offline', label: 'オフライン' },
]

type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  to?: string
  disabled?: boolean
}

const NAV_ITEMS: Array<NavItem> = [
  { id: 'home', label: 'ホーム', icon: HomeIcon, to: '/' },
  { id: 'history', label: '履歴', icon: History, to: '/history' },
  { id: 'wallet', label: 'ウォレット', icon: Wallet, to: '/wallet' },
  { id: 'mypage', label: 'マイページ', icon: UserRound, to: '/mypage' },
]

const numberFormatter = new Intl.NumberFormat('ja-JP')
const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit',
  minute: '2-digit',
})

const isStatusFilter = (value: string): value is StatusFilter =>
  STATUS_FILTER_VALUES.some((candidate) => candidate === value)

const isPresenceStatus = (value: StatusFilter): value is OtomoPresenceStatus =>
  value !== 'all'

export const Route = createFileRoute('/')({
  component: HomeScreen,
})

function HomeScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: fetchWalletBalance,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const otomoQuery = useQuery<Array<OtomoProfile>>({
    queryKey: ['otomo-list', statusFilter],
    queryFn: () =>
      fetchOtomoProfiles(statusFilter === 'all' ? undefined : statusFilter),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const otomoList = useMemo(() => otomoQuery.data ?? [], [otomoQuery.data])
  const isEmpty =
    !otomoQuery.isLoading && !otomoQuery.isError && otomoList.length === 0
  const walletBalance = walletQuery.data ? walletQuery.data.balance : 0
  const walletUpdatedAt = walletQuery.data
    ? walletQuery.data.updatedAt
    : undefined

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -right-48 top-0 hidden h-96 w-96 rounded-full bg-rose-500/20 blur-3xl md:block" />
      <div className="pointer-events-none absolute -left-48 bottom-10 hidden h-96 w-96 rounded-full bg-blue-500/20 blur-3xl md:block" />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-40 pt-12 sm:px-6">
        <HeaderSection
          walletBalance={walletBalance}
          isWalletLoading={walletQuery.isLoading}
          onRefresh={() => otomoQuery.refetch()}
          isRefreshing={otomoQuery.isFetching}
          updatedAt={walletUpdatedAt}
        />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/60">
                U-01 ホーム / おともはん一覧
              </p>
              <h2 className="text-2xl font-semibold text-white">
                今すぐ話せるおともはん
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => otomoQuery.refetch()}
              disabled={otomoQuery.isFetching}
              className="rounded-2xl border border-white/10 bg-white/5"
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
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={(value) => {
              if (isStatusFilter(value)) {
                setStatusFilter(value)
              }
            }}
          >
            <TabsList>
              {STATUS_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.id}
                  value={option.id}
                  className="flex flex-col"
                >
                  <span>{option.label}</span>
                  {isPresenceStatus(option.id) && (
                    <span className="text-[10px] font-normal text-white/70">
                      {getStatusMeta(option.id).helper}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={statusFilter} className="space-y-4">
              {otomoQuery.isLoading && <OtomoSkeletonList />}
              {otomoQuery.isError && (
                <ErrorState
                  message={
                    otomoQuery.error instanceof Error
                      ? otomoQuery.error.message
                      : '一覧を読み込めませんでした'
                  }
                  onRetry={() => otomoQuery.refetch()}
                />
              )}
              {isEmpty && <EmptyState />}
              {!otomoQuery.isLoading && !otomoQuery.isError && !isEmpty && (
                <div className="grid gap-4">
                  {otomoList.map((profile) => (
                    <OtomoCard key={profile.id} profile={profile} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

function HeaderSection({
  walletBalance,
  isWalletLoading,
  onRefresh,
  isRefreshing,
  updatedAt,
}: {
  walletBalance: number
  isWalletLoading: boolean
  onRefresh: () => void
  isRefreshing: boolean
  updatedAt?: string
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Sparkles className="h-4 w-4 text-rose-300" />
            <span>今日もいい通話を。</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">
            おともはん
            <span className="ml-2 text-rose-200">ホーム</span>
          </h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-2xl border border-white/10"
        >
          <Bell className="h-4 w-4" />
          通知センター
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.3fr,0.7fr]">
        <Card className="bg-gradient-to-br from-rose-500/30 via-purple-500/20 to-slate-900">
          <CardHeader>
            <CardDescription>ポイント残高</CardDescription>
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-4xl tracking-tight">
                {isWalletLoading
                  ? '---'
                  : `${numberFormatter.format(walletBalance)} pt`}
              </CardTitle>
              <Badge variant="info" className="text-xs">
                {updatedAt
                  ? `${timeFormatter.format(new Date(updatedAt))} 更新`
                  : '取得中'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm text-white/70">
              <p>目安通話時間</p>
              <p className="text-lg font-semibold text-white">
                {isWalletLoading
                  ? '---'
                  : `${Math.floor(walletBalance / 120)} 分`}
              </p>
            </div>
            <div className="space-y-1 text-sm text-white/70">
              <p>ステータス</p>
              <p className="text-lg font-semibold text-white">チャージ良好</p>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  更新中
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  残高更新
                </>
              )}
            </Button>
            <Button size="sm" className="rounded-2xl" asChild>
              <Link to="/wallet">
                <Wallet className="h-4 w-4" />
                ウォレット
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardDescription>リアルタイムステータス</CardDescription>
            <CardTitle className="text-xl">接続状況</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full shadow-lg',
                      meta.dotColor,
                    )}
                    aria-hidden
                  />
                  <span>{meta.label}</span>
                </div>
                <span className="text-white/60">{meta.helper}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter className="text-xs text-white/60">
            <AlarmClock className="mr-2 h-3.5 w-3.5" />
            WebSocket + 30秒ポーリングで自動更新
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

function OtomoCard({ profile }: { profile: OtomoProfile }) {
  const status = getStatusMeta(profile.status)
  const canRequestCall = profile.status === 'online'

  return (
    <Card className="border-white/5 bg-gradient-to-br from-white/5 via-white/0 to-white/5">
      <CardContent className="gap-4 md:flex md:items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          <AvatarFallback>
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-white">
              {profile.name}
            </h3>
            <Badge variant={status.badgeVariant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-white/70">
            {profile.bio.length > 80
              ? `${profile.bio.slice(0, 80)}…`
              : profile.bio}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-300" />
              {profile.rating.toFixed(1)}
              {profile.reviewCount !== undefined && (
                <span className="text-xs text-white/60">
                  ({numberFormatter.format(profile.reviewCount)})
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-sky-300" />
              {numberFormatter.format(profile.pricePerMinute)} pt/分
            </span>
          </div>
          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs text-white/80"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-2xl"
          asChild
        >
          <Link to="/otomo/$otomoId" params={{ otomoId: profile.id }}>
            <Compass className="h-4 w-4" />
            詳細を見る
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-2xl"
          disabled={!canRequestCall}
        >
          <PhoneCall className="h-4 w-4" />
          通話リクエスト
        </Button>
      </CardFooter>
    </Card>
  )
}

function OtomoSkeletonList() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardContent className="flex gap-4">
            <Skeleton className="h-20 w-20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </CardFooter>
        </Card>
      ))}
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
    <Card className="border-rose-500/40 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-rose-100">
          通信エラーが発生しました
        </CardTitle>
        <CardDescription className="text-rose-200">{message}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="destructive" onClick={onRetry} className="rounded-2xl">
          <RefreshCw className="h-4 w-4" />
          再読み込みする
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border-white/5 bg-white/5 text-center">
      <CardHeader>
        <CardTitle className="text-xl">
          現在利用可能なおともはんがいません
        </CardTitle>
        <CardDescription>
          しばらくしてからもう一度お試しください。ステータス更新を待機しています。
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center">
        <Button variant="secondary" className="rounded-2xl">
          <AlarmClock className="h-4 w-4" />
          更新を待つ
        </Button>
      </CardFooter>
    </Card>
  )
}

function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <nav className="fixed bottom-6 left-1/2 z-20 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-3 text-sm text-white shadow-2xl shadow-black/40 backdrop-blur-2xl">
      {NAV_ITEMS.map((item) => {
        const hasDestination = typeof item.to === 'string'
        const isActive =
          hasDestination && item.to ? pathname.startsWith(item.to) : false
        const classes = cn(
          'flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition-colors',
          isActive
            ? 'bg-white/20 text-white'
            : 'text-white/70 hover:text-white',
        )

        if (hasDestination && !item.disabled) {
          return (
            <Link key={item.id} to={item.to} className={classes}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        }

        return (
          <button
            key={item.id}
            type="button"
            className={cn(classes, 'cursor-not-allowed opacity-60')}
            disabled
            aria-disabled
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
