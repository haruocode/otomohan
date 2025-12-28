import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  BookOpenText,
  Filter,
  Loader2,
  MessageCircle,
  Star,
} from 'lucide-react'

import type {
  FetchOtomoReviewsParams,
  OtomoReviewAlert,
  OtomoReviewEntry,
  OtomoReviewSummary,
} from '@/lib/api'
import {
  fetchOtomoReviewAlerts,
  fetchOtomoReviewSummary,
  fetchOtomoReviews,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/otomo-reviews')({
  component: OtomoReviewsScreen,
})

type RatingFilter = 'all' | '5' | '4' | '3_or_less'
type CommentFilter = 'all' | 'with'

const ratingFilterMap: Record<
  RatingFilter,
  FetchOtomoReviewsParams['ratings']
> = {
  all: undefined,
  '5': 5,
  '4': 4,
  '3_or_less': [1, 2, 3],
}

function OtomoReviewsScreen() {
  const router = useRouter()
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [commentFilter, setCommentFilter] = useState<CommentFilter>('all')

  const reviewParams = useMemo<FetchOtomoReviewsParams>(() => {
    const params: FetchOtomoReviewsParams = {
      ratings: ratingFilterMap[ratingFilter],
      sort: 'latest',
    }
    if (commentFilter === 'with') {
      params.comment = 'with'
    }
    return params
  }, [ratingFilter, commentFilter])

  const summaryQuery = useQuery({
    queryKey: ['otomo-review-summary'],
    queryFn: fetchOtomoReviewSummary,
  })

  const reviewsQuery = useQuery({
    queryKey: ['otomo-reviews', reviewParams],
    queryFn: () => fetchOtomoReviews(reviewParams),
  })

  const alertsQuery = useQuery({
    queryKey: ['otomo-alerts'],
    queryFn: fetchOtomoReviewAlerts,
  })

  if (summaryQuery.isLoading && reviewsQuery.isLoading) {
    return <ReviewLoading />
  }

  if (summaryQuery.isError || reviewsQuery.isError) {
    return (
      <ErrorState
        message="レビュー情報の取得に失敗しました"
        onRetry={() => {
          summaryQuery.refetch()
          reviewsQuery.refetch()
          alertsQuery.refetch()
        }}
      />
    )
  }

  const summary = summaryQuery.data
  const reviews = reviewsQuery.data ?? []
  const alerts = alertsQuery.data ?? []

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-rose-500/20 blur-[160px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sky-500/20 blur-[160px]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-32 pt-8 sm:px-6">
        <Header onBack={() => router.navigate({ to: '/otomo-home' })} />
        {summary ? <SummaryPanel summary={summary} /> : null}
        <FilterBar
          ratingFilter={ratingFilter}
          onChangeRating={setRatingFilter}
          commentFilter={commentFilter}
          onChangeComment={setCommentFilter}
        />
        {alerts.length ? <AlertPanel alerts={alerts} /> : null}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">最新レビュー</h2>
            <Badge className="rounded-full bg-white/10 text-white/70">
              {reviews.length} 件表示中
            </Badge>
          </div>
          {reviews.length === 0 ? (
            <EmptyState />
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </section>
      </main>
    </div>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        className="rounded-2xl border border-white/10 text-white"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>
      <div className="text-center">
        <p className="text-sm text-white/60">画面ID O-07 / レビュー</p>
        <h1 className="text-2xl font-semibold text-white">
          評価・レビュー確認
        </h1>
      </div>
      <span className="w-20" aria-hidden />
    </header>
  )
}

function SummaryPanel({ summary }: { summary: OtomoReviewSummary }) {
  const total = summary.distribution.reduce((acc, item) => acc + item.count, 0)

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-4xl font-bold">
            ★ {summary.averageRating.toFixed(1)}
            <span className="ml-2 text-base text-white/70">/ 5.0</span>
          </CardTitle>
          <CardDescription className="text-white/70">
            {summary.totalReviews.toLocaleString('ja-JP')} 件の評価
          </CardDescription>
        </div>
        <div className="text-right text-sm text-white/80">
          <p>通話総数 {summary.totalCalls.toLocaleString('ja-JP')} 件</p>
          {typeof summary.repeatRate === 'number' ? (
            <p>リピート率 {(summary.repeatRate * 100).toFixed(0)}%</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {summary.distribution.map((bucket) => (
            <RatingBar
              key={bucket.rating}
              rating={bucket.rating}
              percentage={bucket.percentage}
              count={bucket.count}
            />
          ))}
        </div>
        <p className="text-right text-xs text-white/50">
          最終更新:{' '}
          {summary.lastUpdatedAt
            ? new Date(summary.lastUpdatedAt).toLocaleString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--'}
        </p>
        <p className="text-sm text-white/70">
          合計 {total.toLocaleString('ja-JP')}{' '}
          件のレビュー、星5が最も多くを占めています。
        </p>
      </CardContent>
    </Card>
  )
}

function RatingBar({
  rating,
  percentage,
  count,
}: {
  rating: number
  percentage: number
  count: number
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-white/70">
        <span className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-rose-400 text-rose-400" />
          {rating}
        </span>
        <span>
          {(percentage * 100).toFixed(0)}% / {count.toLocaleString('ja-JP')} 件
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-sky-400"
          style={{ width: `${Math.min(100, percentage * 100)}%` }}
        />
      </div>
    </div>
  )
}

function FilterBar({
  ratingFilter,
  onChangeRating,
  commentFilter,
  onChangeComment,
}: {
  ratingFilter: RatingFilter
  onChangeRating: (value: RatingFilter) => void
  commentFilter: CommentFilter
  onChangeComment: (value: CommentFilter) => void
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-wrap items-center gap-3 text-sm text-white/70">
        <Filter className="h-4 w-4" />
        フィルター
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'すべて' },
              { id: '5', label: '★5' },
              { id: '4', label: '★4' },
              { id: '3_or_less', label: '★3以下' },
            ] as Array<{ id: RatingFilter; label: string }>
          ).map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={ratingFilter === option.id ? 'default' : 'outline'}
              className={cn(
                'rounded-2xl border',
                ratingFilter === option.id
                  ? 'border-white bg-white/90 text-slate-900'
                  : 'border-white/20 text-white',
              )}
              onClick={() => onChangeRating(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Button
            type="button"
            variant={commentFilter === 'all' ? 'default' : 'outline'}
            className={cn(
              'rounded-2xl border',
              commentFilter === 'all'
                ? 'border-white bg-white/90 text-slate-900'
                : 'border-white/20 text-white',
            )}
            onClick={() => onChangeComment('all')}
          >
            すべて
          </Button>
          <Button
            type="button"
            variant={commentFilter === 'with' ? 'default' : 'outline'}
            className={cn(
              'rounded-2xl border',
              commentFilter === 'with'
                ? 'border-white bg-white/90 text-slate-900'
                : 'border-white/20 text-white',
            )}
            onClick={() => onChangeComment('with')}
          >
            コメントあり
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertPanel({ alerts }: { alerts: Array<OtomoReviewAlert> }) {
  return (
    <Card className="border-rose-400/30 bg-rose-500/10">
      <CardHeader className="flex items-center gap-2 text-rose-100">
        <AlertCircle className="h-5 w-5" />
        運営からのお知らせ
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-rose-50">
        {alerts.map((alert) => (
          <div key={alert.id}>
            <p>{alert.message}</p>
            <p className="text-xs text-rose-200/80">
              {new Date(alert.issuedAt).toLocaleString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ReviewCard({ review }: { review: OtomoReviewEntry }) {
  const [expanded, setExpanded] = useState(false)
  const duration = `${review.durationMinutes}分`
  const comment = review.comment?.trim() ?? ''
  const shouldClamp = comment.length > 60 && !expanded
  const displayComment = shouldClamp ? `${comment.slice(0, 60)}…` : comment

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <Star className="h-5 w-5 fill-rose-400 text-rose-400" />
          {review.rating}
        </div>
        <div className="text-sm text-white/70">
          {new Date(review.createdAt).toLocaleDateString('ja-JP', {
            month: '2-digit',
            day: '2-digit',
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white/80">
        <p className="text-base font-medium text-white">{review.maskedName}</p>
        {comment ? (
          <p className="leading-relaxed text-white/90">
            {displayComment}{' '}
            {shouldClamp ? (
              <button
                type="button"
                className="text-sm text-sky-300 underline"
                onClick={() => setExpanded(true)}
              >
                続きを読む
              </button>
            ) : null}
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 text-white/60">
            <MessageCircle className="h-4 w-4" />
            コメントはありません
          </p>
        )}
        <p className="text-xs text-white/60">通話時間: {duration}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border-white/10 bg-white/5 text-center">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-white/70">
        <BookOpenText className="h-10 w-10 text-white/40" />
        <p className="text-lg text-white">まだレビューはありません</p>
        <p className="text-sm">
          通話後、ユーザーからの評価がここに表示されます。
        </p>
      </CardContent>
    </Card>
  )
}

function ReviewLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
      <p>レビュー情報を読み込んでいます...</p>
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        再読み込み
      </Button>
    </div>
  )
}
