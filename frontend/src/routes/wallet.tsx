import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'

import type { WalletUsageEntry } from '@/lib/api'
import { fetchWalletBalance, fetchWalletUsage } from '@/lib/api'
import { cn } from '@/lib/utils'
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
const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export const Route = createFileRoute('/wallet')({
  component: WalletScreen,
})

function WalletScreen() {
  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: fetchWalletBalance,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const usageQuery = useQuery({
    queryKey: ['wallet-usage', 5],
    queryFn: () => fetchWalletUsage(5),
    staleTime: 20_000,
  })

  const balance = balanceQuery.data?.balance
  const updatedAt = balanceQuery.data?.updatedAt
  const hasBalanceError = balanceQuery.isError
  const balanceIsSuspicious = typeof balance === 'number' && balance < 0

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-10 top-5 h-64 w-64 rounded-full bg-rose-500/20 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-blue-500/20 blur-[130px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            className="rounded-2xl border border-white/10"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div className="text-right">
            <p className="text-sm text-white/60">画面ID U-06 / ウォレット</p>
            <h1 className="text-2xl font-semibold text-white">ウォレット</h1>
          </div>
        </header>

        {hasBalanceError && (
          <ErrorCard
            title="ウォレット情報を取得できませんでした"
            description="通信環境をご確認のうえ、再度読み込んでください。"
            onRetry={() => balanceQuery.refetch()}
          />
        )}

        <BalanceCard
          isLoading={balanceQuery.isLoading}
          isRefreshing={balanceQuery.isFetching}
          balance={balance}
          updatedAt={updatedAt}
          onRefresh={() => balanceQuery.refetch()}
        />

        {balanceIsSuspicious && (
          <AlertCard
            title="残高が正しく表示できません"
            description="サポートまでお問い合わせください。"
          />
        )}

        <ActionsSection />

        <UsageSection usageQuery={usageQuery} />

        <InfoNote />
      </main>
    </div>
  )
}

function BalanceCard({
  isLoading,
  isRefreshing,
  balance,
  updatedAt,
  onRefresh,
}: {
  isLoading: boolean
  isRefreshing: boolean
  balance?: number
  updatedAt?: string
  onRefresh: () => void
}) {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0">
      <CardHeader>
        <CardDescription className="text-white/70">現在の残高</CardDescription>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <CardTitle className="text-4xl font-semibold text-white">
            {isLoading || balance === undefined
              ? '---'
              : `${numberFormatter.format(balance)} pt`}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-2xl border border-white/10"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                最新に更新
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm">
          <p className="text-white/60">最終更新</p>
          <p className="text-lg font-semibold text-white">
            {updatedAt
              ? dateTimeFormatter.format(new Date(updatedAt))
              : '取得中'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm">
          <p className="text-white/60">利用可能目安</p>
          <p className="text-lg font-semibold text-white">
            {balance !== undefined && !isLoading
              ? `${Math.max(0, Math.floor(balance / 120))} 分`
              : '---'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionsSection() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>次のアクション</CardTitle>
        <CardDescription className="text-white/70">
          チャージや履歴の確認はこちらから
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button
          asChild
          className="rounded-2xl bg-white text-slate-950 hover:bg-white/90"
        >
          <Link to="/wallet/charge">
            <CreditCard className="mr-2 h-4 w-4" />
            チャージする
          </Link>
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl border-white/30 text-white hover:bg-white/10"
          disabled
        >
          <History className="mr-2 h-4 w-4" />
          購入履歴（近日公開）
        </Button>
      </CardContent>
    </Card>
  )
}

function UsageSection({
  usageQuery,
}: {
  usageQuery: UseQueryResult<Array<WalletUsageEntry>>
}) {
  if (usageQuery.isLoading) {
    return <UsageSkeleton />
  }

  if (usageQuery.isError) {
    return (
      <ErrorCard
        title="使用履歴を取得できませんでした"
        description="時間をおいて再度お試しください。"
        onRetry={() => usageQuery.refetch()}
      />
    )
  }

  const entries = usageQuery.data ?? []

  if (entries.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 text-center">
        <CardHeader>
          <CardTitle>使用履歴</CardTitle>
          <CardDescription className="text-white/70">
            まだ履歴がありません
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>直近の使用履歴</CardTitle>
          <CardDescription className="text-white/70">
            最新 5 件を表示しています
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-2xl border border-dashed border-white/20 text-white/70"
          disabled
        >
          <History className="mr-2 h-4 w-4" />
          一覧（準備中）
        </Button>
      </CardHeader>
      <CardContent className="divide-y divide-white/5">
        {entries.map((entry) => (
          <UsageRow key={entry.id} entry={entry} />
        ))}
      </CardContent>
    </Card>
  )
}

function UsageRow({ entry }: { entry: WalletUsageEntry }) {
  const isDebit = entry.direction === 'debit'
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl border',
            isDebit
              ? 'border-rose-500/40 bg-rose-500/10'
              : 'border-emerald-400/40 bg-emerald-400/10',
          )}
        >
          {isDebit ? (
            <TrendingDown className="h-5 w-5 text-rose-200" />
          ) : (
            <TrendingUp className="h-5 w-5 text-emerald-200" />
          )}
        </div>
        <div>
          <p className="font-semibold text-white">{entry.title}</p>
          {entry.description && (
            <p className="text-sm text-white/60">{entry.description}</p>
          )}
          <p className="text-xs text-white/50">
            {dateTimeFormatter.format(new Date(entry.occurredAt))}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-lg font-semibold',
            isDebit ? 'text-rose-200' : 'text-emerald-200',
          )}
        >
          {isDebit ? '-' : '+'}
          {numberFormatter.format(entry.amount)} pt
        </p>
      </div>
    </div>
  )
}

function UsageSkeleton() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>直近の使用履歴</CardTitle>
        <CardDescription className="text-white/70">
          読み込み中...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ErrorCard({
  title,
  description,
  onRetry,
}: {
  title: string
  description: string
  onRetry: () => void
}) {
  return (
    <Card className="border-rose-500/40 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-rose-100">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" className="rounded-2xl" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function AlertCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="border-amber-400/40 bg-amber-400/10">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-amber-50">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function InfoNote() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="flex items-center gap-4">
        <div className="rounded-2xl border border-white/20 bg-white/5 p-3">
          <ShieldCheck className="h-5 w-5 text-emerald-200" />
        </div>
        <div className="space-y-1 text-sm text-white/80">
          <p>ポイントは通話時間に応じて自動で消費されます。</p>
          <p className="text-white/60">
            通話開始後は 1 分ごとに課金され、リアルタイムで残高に反映されます。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
