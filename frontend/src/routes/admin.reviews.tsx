import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Clock3,
  Filter,
  FlagTriangleRight,
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Undo2,
  UserCheck,
  UserRound,
  UserX,
} from 'lucide-react'

import type { FormEvent, ReactNode } from 'react'

import type {
  AdminReviewDetail,
  AdminReviewFlag,
  AdminReviewSummary,
} from '@/lib/api'
import {
  deleteAdminReview,
  fetchAdminReviewDetail,
  fetchAdminReviews,
  flagAdminReview,
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

export const Route = createFileRoute('/admin/reviews')({
  component: AdminReviewsScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const flagLabel: Record<AdminReviewFlag, string> = {
  normal: '通常',
  ai: 'AI検知',
  reported: '通報あり',
}

const flagVariant: Record<AdminReviewFlag, 'outline' | 'warning' | 'danger'> = {
  normal: 'outline',
  ai: 'warning',
  reported: 'danger',
}

const commentStateLabel = {
  with: 'コメントあり',
  without: 'コメントなし',
} as const

type FilterForm = {
  otomoId: string
  userId: string
  ratingMin: '' | '1' | '2' | '3' | '4' | '5'
  ratingMax: '' | '1' | '2' | '3' | '4' | '5'
  commentState: '' | 'with' | 'without'
  flagged: '' | AdminReviewFlag
  keyword: string
  createdFrom: string
  createdTo: string
}

const initialFilterForm: FilterForm = {
  otomoId: '',
  userId: '',
  ratingMin: '',
  ratingMax: '',
  commentState: '',
  flagged: '',
  keyword: '',
  createdFrom: '',
  createdTo: '',
}

type ReviewStats = {
  total: number
  flagged: number
  lowRating: number
  withComment: number
}

function AdminReviewsScreen() {
  const [filterForm, setFilterForm] = useState<FilterForm>(initialFilterForm)
  const [activeFilters, setActiveFilters] =
    useState<FilterForm>(initialFilterForm)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews', activeFilters],
    queryFn: (): Promise<AdminReviewSummary[]> =>
      fetchAdminReviews({
        otomoId: activeFilters.otomoId || undefined,
        userId: activeFilters.userId || undefined,
        ratingMin: activeFilters.ratingMin
          ? Number(activeFilters.ratingMin)
          : undefined,
        ratingMax: activeFilters.ratingMax
          ? Number(activeFilters.ratingMax)
          : undefined,
        commentState: activeFilters.commentState || undefined,
        flagged: activeFilters.flagged || undefined,
        keyword: activeFilters.keyword || undefined,
        createdFrom: activeFilters.createdFrom || undefined,
        createdTo: activeFilters.createdTo || undefined,
      }),
    placeholderData: (previousData): AdminReviewSummary[] | undefined =>
      previousData,
  })

  const reviews: AdminReviewSummary[] = reviewsQuery.data ?? []
  const stats = useMemo<ReviewStats>(() => buildReviewStats(reviews), [reviews])

  const handleFilterChange = (field: keyof FilterForm, value: string) => {
    setFilterForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveFilters(filterForm)
  }

  const handleReset = () => {
    setFilterForm(initialFilterForm)
    setActiveFilters(initialFilterForm)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/40">
              A-09 / REVIEW MODERATION
            </p>
            <h1 className="mt-2 text-4xl font-bold">レビュー管理</h1>
            <p className="text-sm text-white/70">
              低評価やフラグ済みレビューを横断し、レビュアーとおともはん双方へ迅速に対応します。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => reviewsQuery.refetch()}
              disabled={reviewsQuery.isFetching}
            >
              {reviewsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              最新に更新
            </Button>
            <Button asChild variant="secondary" className="rounded-2xl">
              <Link to="/admin/notifications">
                <BellRing className="h-4 w-4" />
                注意通知ダッシュボードへ
              </Link>
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Filter className="h-5 w-5 text-rose-300" />
              レビュー検索フィルター
            </CardTitle>
            <CardDescription>
              おともID・レビュアーID・評価レンジ・フラグ状態で絞り込み、要対応レビューを抽出します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-4">
                <input
                  value={filterForm.otomoId}
                  onChange={(event) =>
                    handleFilterChange('otomoId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="おともID"
                />
                <input
                  value={filterForm.userId}
                  onChange={(event) =>
                    handleFilterChange('userId', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="レビュアーID"
                />
                <select
                  value={filterForm.ratingMin}
                  onChange={(event) =>
                    handleFilterChange(
                      'ratingMin',
                      event.target.value as FilterForm['ratingMin'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">評価下限（制限なし）</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option value={rating} key={`min-${rating}`}>
                      {rating} 以上
                    </option>
                  ))}
                </select>
                <select
                  value={filterForm.ratingMax}
                  onChange={(event) =>
                    handleFilterChange(
                      'ratingMax',
                      event.target.value as FilterForm['ratingMax'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">評価上限（制限なし）</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option value={rating} key={`max-${rating}`}>
                      {rating} 以下
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={filterForm.commentState}
                  onChange={(event) =>
                    handleFilterChange(
                      'commentState',
                      event.target.value as FilterForm['commentState'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">コメント有無（すべて）</option>
                  {Object.entries(commentStateLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterForm.flagged}
                  onChange={(event) =>
                    handleFilterChange(
                      'flagged',
                      event.target.value as FilterForm['flagged'],
                    )
                  }
                  className={inputBaseClass}
                >
                  <option value="">フラグ状態（すべて）</option>
                  {Object.entries(flagLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={filterForm.keyword}
                  onChange={(event) =>
                    handleFilterChange('keyword', event.target.value)
                  }
                  className={inputBaseClass}
                  placeholder="キーワード（本文検索）"
                />
                <input
                  type="datetime-local"
                  value={filterForm.createdFrom}
                  onChange={(event) =>
                    handleFilterChange('createdFrom', event.target.value)
                  }
                  className={inputBaseClass}
                />
                <input
                  type="datetime-local"
                  value={filterForm.createdTo}
                  onChange={(event) =>
                    handleFilterChange('createdTo', event.target.value)
                  }
                  className={inputBaseClass}
                />
              </div>
              <div className="flex items-center gap-3">
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
                  <Undo2 className="h-4 w-4" />
                  リセット
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-4">
          <ReviewStatCard
            icon={<Star className="h-5 w-5" />}
            label="レビュー総数"
            helper="現在の抽出範囲"
            value={`${stats.total.toLocaleString()} 件`}
          />
          <ReviewStatCard
            icon={<FlagTriangleRight className="h-5 w-5" />}
            label="フラグ付き"
            helper="AI or 通報済"
            value={`${stats.flagged.toLocaleString()} 件`}
          />
          <ReviewStatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="低評価 (★1-2)"
            helper="優先度高"
            value={`${stats.lowRating.toLocaleString()} 件`}
          />
          <ReviewStatCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="コメントあり"
            helper="詳細確認可"
            value={`${stats.withComment.toLocaleString()} 件`}
          />
        </section>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">レビュー一覧</CardTitle>
              <CardDescription>
                フラグ状態とスコア順にソートし、詳細ダイアログから削除・注意通知を実施します。
              </CardDescription>
            </div>
            <Badge variant="info" className="text-xs">
              {reviews.length.toLocaleString()} 件
            </Badge>
          </CardHeader>
          <CardContent>
            {reviewsQuery.status === 'pending' && <ReviewTableSkeleton />}
            {reviewsQuery.status === 'error' && (
              <ErrorBanner error={reviewsQuery.error} />
            )}
            {reviewsQuery.status === 'success' && (
              <ReviewTable
                reviews={reviews}
                onSelect={(reviewId) => setSelectedReviewId(reviewId)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ReviewDetailDialog
        reviewId={selectedReviewId}
        onClose={() => setSelectedReviewId(null)}
      />
    </div>
  )
}

function ReviewTable({
  reviews,
  onSelect,
}: {
  reviews: Array<AdminReviewSummary>
  onSelect: (reviewId: string) => void
}) {
  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-sm text-white/60">
        条件に一致するレビューがありません。
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="hidden rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs uppercase tracking-widest text-white/40 md:grid md:grid-cols-[1.2fr,1fr,1fr,1fr,0.7fr,0.5fr]">
        <span>レビュアー</span>
        <span>おとも</span>
        <span>評価</span>
        <span>コメント概要</span>
        <span>状態</span>
        <span>投稿日</span>
      </div>
      <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        {reviews.map((review) => (
          <button
            type="button"
            key={review.id}
            onClick={() => onSelect(review.id)}
            className={cn(
              'flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-white/5 md:grid md:grid-cols-[1.2fr,1fr,1fr,1fr,0.7fr,0.5fr] md:items-center',
            )}
          >
            <div>
              <div className="font-semibold text-white">
                {review.reviewerAlias}
              </div>
              <div className="text-xs text-white/50">ID: {review.userId}</div>
            </div>
            <div className="text-sm text-white/80">
              <div className="font-semibold">{review.otomoName}</div>
              <div className="text-xs text-white/50">{review.otomoId}</div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Badge variant={ratingVariantFromScore(review.rating)}>
                ★ {review.rating}
              </Badge>
              <Badge variant={flagVariant[review.flagged]}>
                {flagLabel[review.flagged]}
              </Badge>
            </div>
            <div className="text-sm text-white/70">
              {review.hasComment ? review.commentSnippet : 'コメントなし'}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="text-xs uppercase tracking-widest text-white/40">
                {review.status === 'active' ? 'OPEN' : 'DELETED'}
              </span>
              <ArrowRight className="h-4 w-4 text-white/40" />
            </div>
            <div className="text-sm text-white/70">
              {formatDateTime(review.createdAt)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewTableSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 md:grid md:grid-cols-6"
        >
          {[0, 1, 2, 3, 4, 5].map((col) => (
            <Skeleton
              key={col}
              className="h-5 w-full rounded-full bg-white/10"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function ErrorBanner({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : 'データの取得に失敗しました'
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertTriangle className="h-4 w-4" />
      {message}
    </div>
  )
}

function ReviewStatCard({
  icon,
  label,
  helper,
  value,
}: {
  icon: React.ReactNode
  label: string
  helper: string
  value: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-4">
      <div className="flex items-center justify-between text-white/60">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
          {icon}
          {label}
        </div>
        <span className="text-xs text-white/40">{helper}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ReviewDetailDialog({
  reviewId,
  onClose,
}: {
  reviewId: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteNotice, setDeleteNotice] = useState('')
  const [moderationNote, setModerationNote] = useState('')
  const [flagNotice, setFlagNotice] = useState('')
  const [reviewerActionMessage, setReviewerActionMessage] = useState('')
  const [otomoNoticeMessage, setOtomoNoticeMessage] = useState('')

  const detailQuery = useQuery<AdminReviewDetail>({
    queryKey: ['admin-review-detail', reviewId],
    queryFn: () => fetchAdminReviewDetail(reviewId ?? ''),
    enabled: Boolean(reviewId),
  })

  useEffect(() => {
    setDeleteReason('')
    setDeleteNotice('')
    setModerationNote('')
    setFlagNotice('')
    setReviewerActionMessage('')
    setOtomoNoticeMessage('')
  }, [reviewId])

  const deleteMutation = useMutation({
    mutationFn: (reason: string) =>
      deleteAdminReview({
        reviewId: reviewId ?? '',
        reason,
        operator: 'admin_console',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.setQueryData(['admin-review-detail', data.id], data)
      setDeleteNotice('レビューを削除しました（モック）')
      setTimeout(() => setDeleteNotice(''), 3600)
      onClose()
    },
    onError: (error: unknown) => {
      setDeleteNotice(
        error instanceof Error ? error.message : '削除に失敗しました',
      )
    },
  })

  const flagMutation = useMutation({
    mutationFn: (flag: AdminReviewFlag) =>
      flagAdminReview({
        reviewId: reviewId ?? '',
        flag,
        operator: 'admin_console',
        note: moderationNote || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.setQueryData(['admin-review-detail', data.id], data)
      setFlagNotice('フラグ状態を更新しました')
      setTimeout(() => setFlagNotice(''), 3600)
      setModerationNote('')
    },
    onError: (error: unknown) => {
      setFlagNotice(
        error instanceof Error ? error.message : '更新に失敗しました',
      )
    },
  })

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  const handleDeleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reviewId) return
    if (!deleteReason.trim()) {
      setDeleteNotice('削除理由を入力してください')
      return
    }
    deleteMutation.mutate(deleteReason.trim())
  }

  const handleFlagChange = (flag: AdminReviewFlag) => {
    if (!reviewId) return
    flagMutation.mutate(flag)
  }

  const handleReviewerAction = (
    action: 'warn' | 'freeze',
    detail: AdminReviewDetail,
  ) => {
    const message =
      action === 'warn'
        ? `${detail.reviewerAlias} に注意喚起を送りました（モック）`
        : `${detail.reviewerAlias} を凍結キューに登録しました（モック）`
    setReviewerActionMessage(message)
    setTimeout(() => setReviewerActionMessage(''), 3600)
  }

  const handleOtomoNotice = (detail: AdminReviewDetail) => {
    setOtomoNoticeMessage(
      `${detail.otomoName} への注意通知ドラフトを通知管理に引き継ぎました`,
    )
    setTimeout(() => setOtomoNoticeMessage(''), 3600)
  }

  let detailDialogContent: ReactNode = null
  if (detailQuery.status === 'success') {
    detailDialogContent = (
      <ReviewDetailContent
        detail={detailQuery.data}
        deleteReason={deleteReason}
        onDeleteReasonChange={setDeleteReason}
        deleteNotice={deleteNotice}
        onDeleteSubmit={handleDeleteSubmit}
        deletePending={deleteMutation.isPending}
        moderationNote={moderationNote}
        onModerationNoteChange={setModerationNote}
        flagNotice={flagNotice}
        onFlagChange={handleFlagChange}
        flagPending={flagMutation.isPending}
        reviewerActionMessage={reviewerActionMessage}
        onReviewerAction={handleReviewerAction}
        otomoNoticeMessage={otomoNoticeMessage}
        onOtomoNotice={handleOtomoNotice}
      />
    )
  }

  return (
    <Dialog open={Boolean(reviewId)} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle>レビュー詳細</DialogTitle>
          <DialogDescription>
            レビュー内容・傾向・履歴を確認し、削除や注意通知を即時に記録します。
          </DialogDescription>
        </DialogHeader>
        {detailQuery.status === 'pending' && <ReviewDetailSkeleton />}
        {detailQuery.status === 'error' && (
          <ErrorBanner error={detailQuery.error} />
        )}
        {detailDialogContent}
      </DialogContent>
    </Dialog>
  )
}

function ReviewDetailContent({
  detail,
  deleteReason,
  onDeleteReasonChange,
  deleteNotice,
  onDeleteSubmit,
  deletePending,
  moderationNote,
  onModerationNoteChange,
  flagNotice,
  onFlagChange,
  flagPending,
  reviewerActionMessage,
  onReviewerAction,
  otomoNoticeMessage,
  onOtomoNotice,
}: {
  detail: AdminReviewDetail
  deleteReason: string
  onDeleteReasonChange: (value: string) => void
  deleteNotice: string
  onDeleteSubmit: (event: FormEvent<HTMLFormElement>) => void
  deletePending: boolean
  moderationNote: string
  onModerationNoteChange: (value: string) => void
  flagNotice: string
  onFlagChange: (flag: AdminReviewFlag) => void
  flagPending: boolean
  reviewerActionMessage: string
  onReviewerAction: (
    action: 'warn' | 'freeze',
    detail: AdminReviewDetail,
  ) => void
  otomoNoticeMessage: string
  onOtomoNotice: (detail: AdminReviewDetail) => void
}) {
  const flagOptions: Array<AdminReviewFlag> = ['reported', 'ai', 'normal']
  const durationMinutes = Math.floor(detail.callDurationSeconds / 60)
  const durationSeconds = detail.callDurationSeconds % 60

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={flagVariant[detail.flagged]}>
            {flagLabel[detail.flagged]}
          </Badge>
          <Badge variant={ratingVariantFromScore(detail.rating)}>
            ★ {detail.rating}
          </Badge>
          <Badge variant="outline">レビューID: {detail.id}</Badge>
        </div>
        <p className="text-sm text-white/70">
          {detail.comment || 'コメントはありません'}
        </p>
        <div className="grid gap-3 text-sm text-white/80 md:grid-cols-2">
          <InfoLine
            icon={<UserRound className="h-4 w-4" />}
            label="レビュアー"
            value={`${detail.reviewerAlias}（${detail.userId}）`}
          />
          <InfoLine
            icon={<Star className="h-4 w-4" />}
            label="おともはん"
            value={`${detail.otomoName} / ${detail.otomoId}`}
          />
          <InfoLine
            icon={<History className="h-4 w-4" />}
            label="投稿日時"
            value={formatDateTime(detail.createdAt)}
          />
          <InfoLine
            icon={<Clock3 className="h-4 w-4" />}
            label="通話長"
            value={`${durationMinutes}分 ${durationSeconds}秒`}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">スコア推移</h3>
          <ReviewTrend trend={detail.ratingTrend} />
          <div className="grid gap-2 text-sm text-white/70">
            <InfoLine
              icon={<TrendingUp className="h-4 w-4" />}
              label="直近7日平均"
              value={`${detail.analytics.avgRating7d.toFixed(1)} ★`}
            />
            <InfoLine
              icon={<AlertTriangle className="h-4 w-4" />}
              label="直近低評価"
              value={`${detail.analytics.lowRatingCount7d} 件`}
            />
            <InfoLine
              icon={<FlagTriangleRight className="h-4 w-4" />}
              label="最近のフラグ"
              value={`${detail.analytics.recentFlags} 件`}
            />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">AI シグナル / キーワード</h3>
          <div className="flex flex-wrap gap-2">
            {detail.flaggedKeywords.map((keyword) => (
              <Badge key={keyword} variant="outline">
                <Sparkles className="mr-1 h-3 w-3" />
                {keyword}
              </Badge>
            ))}
            {!detail.flaggedKeywords.length && (
              <p className="text-sm text-white/50">キーワードなし</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.aiLabels.map((label) => (
              <Badge key={label} variant="warning">
                {label}
              </Badge>
            ))}
            {!detail.aiLabels.length && (
              <p className="text-sm text-white/50">AI シグナルなし</p>
            )}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/60">
            {detail.analytics.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">フラグ操作</h3>
            {flagNotice && (
              <span className="text-xs text-white/60">{flagNotice}</span>
            )}
          </div>
          <input
            value={moderationNote}
            onChange={(event) => onModerationNoteChange(event.target.value)}
            className={inputBaseClass}
            placeholder="メモ（AI再学習・監査向け）"
            disabled={flagPending}
          />
          <div className="flex flex-wrap gap-2">
            {flagOptions.map((flag) => (
              <Button
                key={flag}
                type="button"
                variant={detail.flagged === flag ? 'secondary' : 'outline'}
                className="rounded-2xl"
                disabled={flagPending}
                onClick={() => onFlagChange(flag)}
              >
                {flagPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {flagLabel[flag]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">レビュアー対応</h3>
            {reviewerActionMessage && (
              <span className="text-xs text-white/60">
                {reviewerActionMessage}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => onReviewerAction('warn', detail)}
            >
              <UserCheck className="h-4 w-4" />
              警告を送る
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              onClick={() => onReviewerAction('freeze', detail)}
            >
              <UserX className="h-4 w-4" />
              凍結キューへ
            </Button>
          </div>
          <p className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white/70">
            レビュアーアクションは監査ログに記録され、A-07
            通知管理と連携します。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">おともはん対応</h3>
            {otomoNoticeMessage && (
              <span className="text-xs text-white/60">
                {otomoNoticeMessage}
              </span>
            )}
          </div>
          <p className="text-sm text-white/70">
            低下傾向のおともはんへ注意通知を送り、A-07
            ダッシュボードでフォローアップします。
          </p>
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link
              to="/admin/notifications"
              onClick={() => onOtomoNotice(detail)}
            >
              <BellRing className="h-4 w-4" />
              注意通知を開く
            </Link>
          </Button>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold">レビュー削除</h3>
          <form className="space-y-3" onSubmit={onDeleteSubmit}>
            <textarea
              value={deleteReason}
              onChange={(event) => onDeleteReasonChange(event.target.value)}
              className={cn(
                inputBaseClass,
                'min-h-[110px] resize-none bg-slate-950/20',
              )}
              placeholder="削除理由（本人非公開 / 監査用）"
              disabled={deletePending}
            />
            <Button
              type="submit"
              variant="destructive"
              className="w-full rounded-2xl"
              disabled={deletePending}
            >
              {deletePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              レビューを削除
            </Button>
            {deleteNotice && (
              <p className="text-sm text-white/60">{deleteNotice}</p>
            )}
          </form>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold">モデレーション履歴</h3>
        {detail.history.length === 0 ? (
          <p className="text-sm text-white/60">履歴がまだありません。</p>
        ) : (
          <div className="space-y-2">
            {detail.history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-white/80">
                    {formatDateTime(entry.occurredAt)} / {entry.operator}
                  </p>
                  <p className="text-white/60">{entry.action}</p>
                  {entry.note && (
                    <p className="text-xs text-white/40">{entry.note}</p>
                  )}
                </div>
                <Badge variant="outline">{entry.action}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ReviewTrend({
  trend,
}: {
  trend: Array<{ label: string; value: number }>
}) {
  const maxValue = Math.max(...trend.map((point) => point.value), 5)
  return (
    <div className="flex items-end gap-3">
      {trend.map((point) => (
        <div key={point.label} className="flex flex-col items-center gap-2">
          <div className="text-xs text-white/50">{point.label}</div>
          <div className="flex h-24 w-8 items-end rounded-2xl border border-white/10 bg-slate-950/40 p-1">
            <div
              className="w-full rounded-xl bg-gradient-to-b from-rose-300 to-rose-500"
              style={{ height: `${(point.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="text-sm font-semibold text-white">
            {point.value.toFixed(1)}
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewDetailSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((section) => (
        <div
          key={section}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <Skeleton className="mb-3 h-6 w-40 rounded-full bg-white/10" />
          <Skeleton className="h-4 w-full rounded-full bg-white/10" />
          <Skeleton className="mt-2 h-4 w-3/4 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-white/60">{icon}</div>
      <div className="text-xs uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className="text-white/80">{value}</div>
    </div>
  )
}

function ratingVariantFromScore(
  score: number,
): 'success' | 'warning' | 'danger' {
  if (score >= 4) return 'success'
  if (score >= 3) return 'warning'
  return 'danger'
}

function buildReviewStats(reviews: Array<AdminReviewSummary>): ReviewStats {
  return {
    total: reviews.length,
    flagged: reviews.filter((review) => review.flagged !== 'normal').length,
    lowRating: reviews.filter((review) => review.rating <= 2).length,
    withComment: reviews.filter((review) => review.hasComment).length,
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
