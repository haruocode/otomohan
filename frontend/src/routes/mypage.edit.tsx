import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Save,
  Shield,
  Undo2,
  Upload,
} from 'lucide-react'

import type { FormEvent } from 'react'

import {
  fetchCurrentUser,
  updateUserProfile,
  uploadUserAvatar,
} from '@/lib/api'
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

const MAX_NAME_LENGTH = 32
const MAX_INTRO_LENGTH = 300
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export const Route = createFileRoute('/mypage/edit')({
  component: ProfileEditScreen,
})

function ProfileEditScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const initialSnapshotRef = useRef({
    name: '',
    intro: '',
    avatarUrl: '',
  })
  const hasInitializedRef = useRef(false)

  const [name, setName] = useState('')
  const [intro, setIntro] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
  })

  useEffect(() => {
    if (!userQuery.data || hasInitializedRef.current) {
      return
    }

    const normalizedName = userQuery.data.name
    const normalizedIntro = (userQuery.data.intro ?? '').trim()
    initialSnapshotRef.current = {
      name: normalizedName.trim(),
      intro: normalizedIntro,
      avatarUrl: userQuery.data.avatarUrl,
    }
    setName(normalizedName)
    setIntro(userQuery.data.intro ?? '')
    setAvatarPreview(userQuery.data.avatarUrl)
    hasInitializedRef.current = true
  }, [userQuery.data])

  const trimmedName = useMemo(() => name.trim(), [name])
  const normalizedIntro = useMemo(() => intro.trim(), [intro])

  const nameError = useMemo(() => {
    if (trimmedName.length === 0) {
      return '名前を入力してください。'
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return `${MAX_NAME_LENGTH}文字以内で入力してください。`
    }
    return null
  }, [trimmedName])

  const introError = useMemo(() => {
    if (intro.length > MAX_INTRO_LENGTH) {
      return `自己紹介は${MAX_INTRO_LENGTH}文字以内で入力してください。`
    }
    return null
  }, [intro])

  const snapshot = initialSnapshotRef.current
  const hasChanges =
    trimmedName !== snapshot.name ||
    normalizedIntro !== snapshot.intro ||
    Boolean(avatarFile)

  const disableSave =
    !hasChanges ||
    Boolean(nameError || introError || avatarError) ||
    userQuery.isLoading

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userQuery.data) {
        throw new Error('ユーザー情報の取得に失敗しました。')
      }
      if (nameError || introError || avatarError) {
        throw new Error('入力内容を確認してください。')
      }

      if (avatarFile) {
        await uploadUserAvatar(avatarFile)
      }

      return updateUserProfile({
        name: trimmedName,
        intro: normalizedIntro.length > 0 ? normalizedIntro : null,
      })
    },
    onSuccess: (updatedUser) => {
      initialSnapshotRef.current = {
        name: updatedUser.name.trim(),
        intro: (updatedUser.intro ?? '').trim(),
        avatarUrl: updatedUser.avatarUrl,
      }
      setAvatarFile(null)
      setAvatarPreview(updatedUser.avatarUrl)
      setFormError(null)
      queryClient.setQueryData(['current-user'], updatedUser)
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      window.alert('プロフィールを更新しました')
      router.navigate({ to: '/mypage' })
    },
    onError: (error: unknown) => {
      setFormError(
        error instanceof Error
          ? error.message
          : 'プロフィールの更新に失敗しました。',
      )
    },
  })

  const onAvatarChange = (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError('JPG / PNG / WEBP 形式の画像を選択してください。')
      return
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('画像サイズは5MB以下にしてください。')
      return
    }

    setAvatarError(null)
    setAvatarFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disableSave || mutation.isPending) {
      return
    }
    setFormError(null)
    mutation.mutate()
  }

  if (userQuery.isLoading && !hasInitializedRef.current) {
    return <EditSkeleton />
  }

  if (userQuery.isError) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-500/20 blur-[140px]" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[150px]" />
        </div>
        <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
          <ErrorState onRetry={() => userQuery.refetch()} />
        </main>
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-500/25 blur-[140px]" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[150px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white"
          >
            <Link to="/mypage">
              <ArrowLeft className="mr-2 h-4 w-4" />
              マイページへ戻る
            </Link>
          </Button>
          <div className="flex flex-col items-end gap-2 text-sm text-white/70">
            <p>画面ID U-11 / プロフィール編集</p>
            <Button
              type="submit"
              form="profile-edit-form"
              className="rounded-2xl bg-white text-slate-950 hover:bg-white/90"
              disabled={disableSave || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </div>
        </header>

        <form
          id="profile-edit-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0">
            <CardHeader>
              <CardTitle>アイコン編集</CardTitle>
              <CardDescription className="text-white/70">
                JPG / PNG / WEBP ・ 最大5MB
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border-4 border-white/10">
                <AvatarImage src={avatarPreview ?? undefined} alt={name} />
                <AvatarFallback>{deriveInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.currentTarget.value = ''
                    onAvatarChange(file)
                  }}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/30 text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    画像を変更
                  </Button>
                  {avatarFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-2xl border border-white/10 text-white"
                      onClick={() => {
                        setAvatarFile(null)
                        setAvatarError(null)
                        setAvatarPreview(
                          initialSnapshotRef.current.avatarUrl || null,
                        )
                      }}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      変更を取り消す
                    </Button>
                  )}
                </div>
                <p className="text-sm text-white/60">
                  正方形の画像だと綺麗に表示されます。
                </p>
                {avatarError && (
                  <p className="text-sm text-rose-200">{avatarError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>プロフィール情報</CardTitle>
              <CardDescription className="text-white/70">
                名前は必須、自己紹介は任意入力です
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <label
                    htmlFor="profile-name"
                    className="font-medium text-white"
                  >
                    名前
                  </label>
                  <span>
                    {trimmedName.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-rose-300/60"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby="profile-name-error"
                />
                {nameError && (
                  <p id="profile-name-error" className="text-sm text-rose-200">
                    {nameError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  メールアドレス
                </label>
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white/70">
                  {userQuery.data?.email ?? '---'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <label
                    htmlFor="profile-intro"
                    className="font-medium text-white"
                  >
                    自己紹介（任意）
                  </label>
                  <span>
                    {intro.length}/{MAX_INTRO_LENGTH}
                  </span>
                </div>
                <textarea
                  id="profile-intro"
                  value={intro}
                  maxLength={MAX_INTRO_LENGTH}
                  rows={5}
                  onChange={(event) => setIntro(event.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  aria-invalid={Boolean(introError)}
                  aria-describedby="profile-intro-error"
                />
                {introError && (
                  <p id="profile-intro-error" className="text-sm text-rose-200">
                    {introError}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>アカウントセキュリティ</CardTitle>
              <CardDescription className="text-white/70">
                パスワードの変更は次回リリースで対応予定です
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between rounded-2xl border-white/30 text-white"
                disabled
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  パスワードを変更（準備中）
                </span>
              </Button>
            </CardContent>
          </Card>

          {formError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                エラー
              </div>
              <p className="mt-2 text-rose-100">{formError}</p>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}

function deriveInitials(value: string) {
  const target = value.trim()
  if (!target) return 'YOU'
  return target.slice(0, 2).toUpperCase()
}

function EditSkeleton() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose-500/25 blur-[140px]" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[150px]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </main>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardHeader>
        <CardTitle className="text-white">
          プロフィールを読み込めませんでした
        </CardTitle>
        <CardDescription className="text-rose-100">
          ネットワークを確認して再試行してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" className="rounded-2xl" onClick={onRetry}>
          <Loader2 className="mr-2 h-4 w-4" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}
