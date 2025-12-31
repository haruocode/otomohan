import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Ban, Loader2, ShieldOff } from 'lucide-react'

import type { BlockedUser } from '@/lib/api'
import { fetchBlockedUsers, unblockUser } from '@/lib/api'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/mypage/block-list')({
  component: BlockListScreen,
})

const blockDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type ToastState = { type: 'success' | 'error'; message: string } | null

function BlockListScreen() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<ToastState>(null)
  const [targetUser, setTargetUser] = useState<BlockedUser | null>(null)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const handle = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(handle)
  }, [toast])

  const blockListQuery = useQuery({
    queryKey: ['blocked-users'],
    queryFn: fetchBlockedUsers,
    staleTime: 60_000,
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onMutate: async (userId) => {
      setPendingUserId(userId)
      await queryClient.cancelQueries({ queryKey: ['blocked-users'] })
      const previous = queryClient.getQueryData<Array<BlockedUser>>([
        'blocked-users',
      ])
      if (previous) {
        queryClient.setQueryData(
          ['blocked-users'],
          previous.filter((entry) => entry.userId !== userId),
        )
      }
      return { previous }
    },
    onError: (error, _userId, context) => {
      setPendingUserId(null)
      if (context?.previous) {
        queryClient.setQueryData(['blocked-users'], context.previous)
      }
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'ブロック解除に失敗しました。',
      })
    },
    onSuccess: () => {
      setToast({ type: 'success', message: 'ブロックを解除しました。' })
      setTargetUser(null)
    },
    onSettled: () => {
      setPendingUserId(null)
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
    },
  })

  const blockedUsers = blockListQuery.data ?? []
  const showEmptyState = blockListQuery.isSuccess && blockedUsers.length === 0

  const handleConfirmUnblock = () => {
    if (!targetUser || unblockMutation.isPending) {
      return
    }
    unblockMutation.mutate(targetUser.userId)
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      {toast && (
        <FloatingToast toast={toast} onDismiss={() => setToast(null)} />
      )}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-500/30 blur-[160px]" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-sky-500/25 blur-[150px]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
        <Header />
        <IntroCallout />
        {blockListQuery.isLoading && <BlockListSkeleton />}
        {blockListQuery.isError && (
          <ErrorPanel onRetry={() => blockListQuery.refetch()} />
        )}
        {showEmptyState ? (
          <EmptyState />
        ) : (
          blockedUsers.length > 0 && (
            <BlockList
              items={blockedUsers}
              onUnblock={setTargetUser}
              pendingUserId={pendingUserId}
            />
          )
        )}
      </main>
      <ConfirmUnblockDialog
        user={targetUser}
        isPending={unblockMutation.isPending}
        onCancel={() => setTargetUser(null)}
        onConfirm={handleConfirmUnblock}
      />
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          className="rounded-2xl border border-white/10 text-white"
        >
          <Link to="/mypage/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            設定へ戻る
          </Link>
        </Button>
        <Badge variant="outline" className="rounded-full border-white/30">
          C-07
        </Badge>
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">
          Safety
        </p>
        <h1 className="text-3xl font-semibold text-white">ブロックリスト</h1>
      </div>
    </header>
  )
}

function IntroCallout() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="flex flex-col gap-4 p-5 text-sm text-white/70">
        <div className="flex items-center gap-3 text-white">
          <ShieldOff className="h-5 w-5 text-rose-200" />
          <p className="text-base font-semibold text-white">
            ブロック中のユーザー管理
          </p>
        </div>
        <p>
          ブロックしたユーザーは、あなたに通話リクエストを送ることができません。
        </p>
        <p>解除すると、再び連絡可能になります。</p>
      </CardContent>
    </Card>
  )
}

function BlockList({
  items,
  onUnblock,
  pendingUserId,
}: {
  items: Array<BlockedUser>
  onUnblock: (user: BlockedUser) => void
  pendingUserId: string | null
}) {
  const countLabel = useMemo(() => {
    if (items.length === 0) return '0人'
    return `${items.length}人`
  }, [items.length])

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>ブロック中のユーザー</CardTitle>
        <CardDescription className="text-white/70">
          現在 {countLabel} をブロック中です
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((user) => (
          <BlockListItem
            key={user.userId}
            user={user}
            onUnblock={onUnblock}
            isPending={pendingUserId === user.userId}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function BlockListItem({
  user,
  onUnblock,
  isPending,
}: {
  user: BlockedUser
  onUnblock: (user: BlockedUser) => void
  isPending: boolean
}) {
  const displayRole = user.role === 'otomo' ? 'おとも' : 'ユーザー'
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/15 bg-white/5 p-4">
      <Avatar className="h-14 w-14 border-2 border-white/10">
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-semibold text-white">{user.name}</p>
          <Badge variant="info" className="rounded-full text-xs">
            {displayRole}
          </Badge>
        </div>
        <p className="text-sm text-white/70">
          ブロックした日：{formatBlockDate(user.blockedAt)}
        </p>
        {user.reason && (
          <p className="text-xs text-rose-200">理由：{user.reason}</p>
        )}
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="rounded-2xl"
        onClick={() => onUnblock(user)}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '解除'}
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-white/10 bg-slate-900/60 text-center">
      <CardContent className="space-y-4 p-8 text-white/70">
        <Ban className="mx-auto h-12 w-12 text-white/40" />
        <p className="text-base font-semibold text-white">
          現在ブロックしているユーザーはいません。
        </p>
        <p className="text-sm">
          トラブルがあった場合は各ユーザープロフィールから即時ブロックできます。
        </p>
      </CardContent>
    </Card>
  )
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardContent className="flex flex-col gap-4 p-5 text-sm">
        <div className="flex items-center gap-2 text-rose-100">
          <AlertCircle className="h-5 w-5" />
          <span>リストを取得できませんでした。</span>
        </div>
        <Button onClick={onRetry} variant="destructive" className="rounded-2xl">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function BlockListSkeleton() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4"
          >
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-10 w-16 rounded-2xl" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ConfirmUnblockDialog({
  user,
  isPending,
  onCancel,
  onConfirm,
}: {
  user: BlockedUser | null
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onCancel()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ブロックを解除しますか？</DialogTitle>
          <DialogDescription>
            {user ? `${user.name} さんのブロックを解除します。` : ''}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-white/70">
          今後、通話リクエストやメッセージを受け取る可能性があります。
        </p>
        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-2xl border-white/20"
            onClick={onCancel}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 rounded-2xl"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                解除中
              </>
            ) : (
              '解除する'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FloatingToast({
  toast,
  onDismiss,
}: {
  toast: Exclude<ToastState, null>
  onDismiss: () => void
}) {
  const toneClass =
    toast.type === 'success'
      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-50'
      : 'border-rose-400/60 bg-rose-500/25 text-rose-50'
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur ${toneClass}`}
      >
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          type="button"
          aria-label="通知を閉じる"
          className="rounded-full p-1 text-white/80 transition hover:bg-white/10"
          onClick={onDismiss}
        >
          X
        </button>
      </div>
    </div>
  )
}

function formatBlockDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return blockDateFormatter.format(date)
}
