import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronRight,
  Edit,
  History,
  RefreshCw,
  Settings,
  Wallet as WalletIcon,
} from 'lucide-react'

import type { CurrentUserProfile } from '@/lib/api'
import { fetchCurrentUser } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const numberFormatter = new Intl.NumberFormat('ja-JP')

export const Route = createFileRoute('/mypage')({
  component: MyPageScreen,
})

function MyPageScreen() {
  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: 30_000,
  })

  const user = userQuery.data

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-500/20 blur-[140px]" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[150px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div className="text-right text-sm text-white/60">
            <p>画面ID U-10 / マイページ</p>
            <p className="text-xs">アカウントの中枢</p>
          </div>
        </header>

        {userQuery.isLoading && <PageSkeleton />}

        {userQuery.isError && (
          <ErrorState
            message="ユーザー情報の取得に失敗しました"
            onRetry={() => userQuery.refetch()}
          />
        )}

        {user && (
          <>
            <ProfileCard user={user} />
            <WalletSection balance={user.balance} />
            <HistoryPreview latestCall={user.latestCall} />
            <AccountSection />
          </>
        )}
      </main>
    </div>
  )
}

function ProfileCard({ user }: { user: CurrentUserProfile }) {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0">
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-white/10">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
            <a
              href={`mailto:${user.email}`}
              className="text-sm text-white/70 hover:text-white"
            >
              {user.email}
            </a>
          </div>
        </div>
        <Button
          variant="secondary"
          className="rounded-2xl border border-white/20 text-slate-950"
          asChild
        >
          <Link to="/mypage/edit">
            <Edit className="mr-2 h-4 w-4" />
            プロフィールを編集
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function WalletSection({ balance }: { balance: number }) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>ウォレット</CardTitle>
          <CardDescription className="text-white/70">
            現在の残ポイント
          </CardDescription>
        </div>
        <Button
          asChild
          className="rounded-2xl bg-white text-slate-900 hover:bg-white/90"
        >
          <Link to="/wallet">
            <WalletIcon className="mr-2 h-4 w-4" />
            ウォレットを見る
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="text-4xl font-semibold">
        {numberFormatter.format(balance)} pt
      </CardContent>
    </Card>
  )
}

function HistoryPreview({
  latestCall,
}: {
  latestCall?: CurrentUserProfile['latestCall']
}) {
  const latestCallInfo = latestCall ?? null
  const minutes = latestCallInfo
    ? Math.max(1, Math.ceil(latestCallInfo.durationSec / 60))
    : 0

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>通話履歴</CardTitle>
          <CardDescription className="text-white/70">
            最新の通話状況を確認
          </CardDescription>
        </div>
        <Button
          asChild
          variant="ghost"
          className="rounded-2xl border border-white/10"
        >
          <Link to="/history">
            <History className="mr-2 h-4 w-4" />
            通話履歴を見る
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {latestCallInfo ? (
          <div>
            <p className="text-sm text-white/60">直近の通話</p>
            <p className="text-lg font-semibold text-white">
              {latestCallInfo.otomoName} さん（約 {minutes} 分）
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/60">まだ通話履歴がありません</p>
        )}
      </CardContent>
    </Card>
  )
}

function AccountSection() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>アカウント設定</CardTitle>
        <CardDescription className="text-white/70">
          詳細設定やアカウント操作はこちらから
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          asChild
          className="w-full justify-between rounded-2xl bg-white text-slate-950 hover:bg-white/90"
        >
          <Link
            to="/mypage/settings"
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              設定を開く
            </span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-sm text-white/70">
          プロフィール編集・通知設定・ログアウト・退会などの操作は設定ページ（C-04）に集約されています。
        </p>
      </CardContent>
    </Card>
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
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-white">エラー</CardTitle>
        <CardDescription className="text-rose-100">{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry} variant="destructive" className="rounded-2xl">
          <RefreshCw className="mr-2 h-4 w-4" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-48 rounded-2xl" />
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/5">
        <CardContent className="h-24" />
      </Card>
      <Card className="border-white/10 bg-white/5">
        <CardContent className="h-20" />
      </Card>
      <Card className="border-white/10 bg-white/5">
        <CardContent className="h-32" />
      </Card>
    </div>
  )
}
