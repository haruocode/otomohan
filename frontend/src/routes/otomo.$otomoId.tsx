import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlarmClock,
  ArrowLeft,
  BookmarkCheck,
  Clock,
  MessageCircle,
  PhoneCall,
  Quote,
  Sparkles,
  Star,
  Tag,
  Wallet,
} from 'lucide-react'

import type { OtomoDetail } from '@/lib/api'
import { fetchOtomoDetail, fetchWalletBalance } from '@/lib/api'
import { getStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const numberFormatter = new Intl.NumberFormat('ja-JP')
const dateFormatter = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' })

const CTA_STATE: Record<
  OtomoDetail['status'],
  { label: string; subLabel: string; disabled: boolean }
> = {
  online: {
    label: 'このおともはんと通話する',
    subLabel: 'ポイントが消費されます',
    disabled: false,
  },
  busy: {
    label: '現在通話中です',
    subLabel: '終話後に通知します',
    disabled: true,
  },
  away: {
    label: '一時離席中です',
    subLabel: 'オンラインになったら再度お試しください',
    disabled: true,
  },
  offline: {
    label: '現在は不在です',
    subLabel: '稼働時間を確認のうえ発信してください',
    disabled: true,
  },
}

export const Route = createFileRoute('/otomo/$otomoId')({
  component: OtomoDetailScreen,
})

function OtomoDetailScreen() {
  const { otomoId } = Route.useParams()

  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: fetchWalletBalance,
    refetchInterval: 20_000,
    staleTime: 15_000,
  })

  const detailQuery = useQuery({
    queryKey: ['otomo-detail', otomoId],
    queryFn: () => fetchOtomoDetail(otomoId),
    staleTime: 30_000,
  })

  const balance = walletQuery.data ? walletQuery.data.balance : undefined
  const updatedAt = walletQuery.data ? walletQuery.data.updatedAt : undefined

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-500/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-36 pt-8 sm:px-6">
        <DetailHeader balance={balance} updatedAt={updatedAt} />

        {detailQuery.isLoading && <DetailSkeleton />}

        {detailQuery.isError && (
          <DetailError
            message="おともはん情報を取得できませんでした"
            onRetry={() => detailQuery.refetch()}
          />
        )}

        {!detailQuery.isLoading && !detailQuery.isError && detailQuery.data && (
          <>
            <DetailHero profile={detailQuery.data} />
            <DetailSections profile={detailQuery.data} />
            <ReviewSection reviews={detailQuery.data.reviews} />
          </>
        )}
      </main>

      {!detailQuery.isLoading && !detailQuery.isError && detailQuery.data && (
        <CallToAction profile={detailQuery.data} />
      )}
    </div>
  )
}

function DetailHeader({
  balance,
  updatedAt,
}: {
  balance?: number
  updatedAt?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Button
        variant="secondary"
        className="rounded-2xl border border-white/10"
        asChild
      >
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          ホームへ戻る
        </Link>
      </Button>
      <div className="text-center sm:flex sm:flex-col sm:items-center">
        <p className="text-sm text-white/60">画面ID U-02 / おともはん詳細</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          おともはん詳細
        </h1>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        <Button
          variant="ghost"
          className="rounded-2xl border border-white/10 bg-white/5"
          disabled={!balance}
        >
          <Wallet className="h-4 w-4" />
          {balance ? `${numberFormatter.format(balance)} pt` : '残高取得中'}
        </Button>
        {updatedAt && (
          <span className="text-xs text-white/50">
            更新 {dateFormatter.format(new Date(updatedAt))}
          </span>
        )}
      </div>
    </div>
  )
}

function DetailHero({ profile }: { profile: OtomoDetail }) {
  const status = getStatusMeta(profile.status)

  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="gap-6 p-6 md:flex md:items-center">
        <Avatar className="h-28 w-28 rounded-3xl">
          <AvatarImage src={profile.avatarUrl} alt={profile.name} />
          <AvatarFallback>
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
            <Badge variant={status.badgeVariant}>{status.label}</Badge>
          </div>
          <p className="text-white/70">{profile.intro ?? profile.bio}</p>
          <div className="flex flex-wrap gap-6 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-300" />
              {profile.rating.toFixed(1)}
              {profile.reviewCount !== undefined && (
                <span className="text-xs text-white/60">
                  ({numberFormatter.format(profile.reviewCount)}件)
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-sky-300" />
              {numberFormatter.format(profile.pricePerMinute)} pt/分
            </span>
            {profile.activeHours && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-300" />
                {profile.activeHours}
              </span>
            )}
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
    </Card>
  )
}

function DetailSections({ profile }: { profile: OtomoDetail }) {
  return (
    <div className="grid gap-4">
      <InfoCard
        icon={<MessageCircle className="h-5 w-5" />}
        title="自己紹介"
        description="最大400文字まで"
        body={profile.bio}
      />
      {profile.categories && profile.categories.length > 0 && (
        <InfoCard
          icon={<BookmarkCheck className="h-5 w-5" />}
          title="話しやすいカテゴリ"
          chips={profile.categories}
        />
      )}
      {profile.hobbies && profile.hobbies.length > 0 && (
        <InfoCard
          icon={<Sparkles className="h-5 w-5" />}
          title="趣味 / 得意な話題"
          chips={profile.hobbies}
        />
      )}
      {profile.activeHours && (
        <InfoCard
          icon={<AlarmClock className="h-5 w-5" />}
          title="稼働時間"
          body={`通常は ${profile.activeHours} に稼働しています。`}
        />
      )}
    </div>
  )
}

function InfoCard({
  icon,
  title,
  description,
  chips,
  body,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  chips?: Array<string>
  body?: string
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-row items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
            {icon}
          </div>
        )}
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription className="text-white/70">
              {description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {body && (
          <p className="text-sm leading-relaxed text-white/80">{body}</p>
        )}
        {chips && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Badge
                key={chip}
                variant="outline"
                className="text-xs text-white/80"
              >
                {chip}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ReviewSection({ reviews }: { reviews?: OtomoDetail['reviews'] }) {
  if (!reviews || reviews.length === 0) {
    return null
  }

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5">
      <CardHeader>
        <CardTitle>最新レビュー</CardTitle>
        <CardDescription>直近の利用者からの声</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.slice(0, 3).map((review) => (
          <div
            key={`${review.user}-${review.date}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-rose-200" />
                <span className="font-semibold">{review.user}</span>
              </div>
              <span>{dateFormatter.format(new Date(review.date))}</span>
            </div>
            <p className="mt-2 text-sm text-white/90">{review.comment}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-200">
              <Star className="h-4 w-4" />
              {review.rating.toFixed(1)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function CallToAction({ profile }: { profile: OtomoDetail }) {
  const cta = CTA_STATE[profile.status]

  return (
    <div className="fixed bottom-6 left-1/2 z-20 flex w-[90%] max-w-3xl -translate-x-1/2 flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/90 p-4 text-sm text-white shadow-2xl shadow-rose-900/40 backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/60">料金</p>
          <p className="text-lg font-semibold">
            {numberFormatter.format(profile.pricePerMinute)} pt / 分
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={cta.disabled}
          className={cn(
            'rounded-2xl px-8',
            cta.disabled
              ? 'bg-white/10 text-white hover:bg-white/10'
              : undefined,
          )}
        >
          <PhoneCall className="mr-2 h-4 w-4" />
          {cta.label}
        </Button>
      </div>
      <p className="text-xs text-white/60">{cta.subLabel}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardContent className="flex gap-6">
          <Skeleton className="h-28 w-28 rounded-3xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="border-white/10 bg-white/5">
          <CardHeader>
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DetailError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="border-rose-500/40 bg-rose-500/10 text-white">
      <CardHeader>
        <CardTitle>エラー</CardTitle>
        <CardDescription className="text-rose-100">{message}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="destructive" onClick={onRetry} className="rounded-2xl">
          再読み込み
        </Button>
      </CardFooter>
    </Card>
  )
}
