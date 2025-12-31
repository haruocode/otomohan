import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import type { FormEvent, ReactNode } from 'react'

import { isAppLoginError, loginWithEmail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/login')({
  component: LoginScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-white/40 focus:border-rose-300 focus:outline-none'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginScreen() {
  const navigate = useNavigate({ from: '/login' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const emailError = useMemo(() => {
    if (!emailTouched && !formSubmitted) return ''
    const trimmed = email.trim()
    if (!trimmed) return 'メールアドレスを入力してください'
    if (!EMAIL_REGEX.test(trimmed))
      return 'メールアドレスの形式が正しくありません'
    return ''
  }, [email, emailTouched, formSubmitted])

  const passwordError = useMemo(() => {
    if (!passwordTouched && !formSubmitted) return ''
    const trimmed = password.trim()
    if (!trimmed) return 'パスワードを入力してください'
    if (trimmed.length < 8) return '8文字以上で入力してください'
    if (trimmed.length > 64) return '64文字以内で入力してください'
    return ''
  }, [password, passwordTouched, formSubmitted])

  const isFormValid = !emailError && !passwordError && email && password

  const loginMutation = useMutation({
    mutationFn: loginWithEmail,
    onSuccess: (response) => {
      localStorage.setItem('otomohan_token', response.token)
      localStorage.setItem('otomohan_role', response.user.role)
      localStorage.setItem('otomohan_user_name', response.user.name)
      setErrorMessage('')
      const next = response.user.role === 'otomo' ? '/otomo-home' : '/'
      navigate({ to: next })
    },
    onError: (error: unknown) => {
      if (isAppLoginError(error)) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(
          'ログインに失敗しました。時間をおいて再度お試しください。',
        )
      }
      setPassword('')
      setPasswordTouched(false)
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormSubmitted(true)
    setEmailTouched(true)
    setPasswordTouched(true)
    if (!isFormValid || loginMutation.isPending) {
      if (!isFormValid) {
        setErrorMessage('入力内容を確認してください')
      }
      return
    }
    setErrorMessage('')
    loginMutation.mutate({
      email: email.trim(),
      password,
    })
  }

  const handlePlaceholderLink = (message: string) => {
    setErrorMessage(message)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-rose-500/30 via-purple-500/10 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-[-30%] hidden w-[60%] rounded-full bg-fuchsia-500/10 blur-3xl md:block" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg rounded-[32px] border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-500">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-3xl font-semibold">
              おともはんにログイン
            </CardTitle>
            <CardDescription className="text-base text-white/70">
              登録済みのメールアドレスとパスワードを入力し、ユーザー /
              おともはん共通のコンソールへアクセスします。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <FieldGroup
                label="メールアドレス"
                htmlFor="login-email"
                icon={<Mail className="h-4 w-4" />}
                error={emailError}
              >
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onBlur={() => setEmailTouched(true)}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputBaseClass}
                  placeholder="user@example.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? 'login-email-error' : undefined
                  }
                />
              </FieldGroup>

              <FieldGroup
                label="パスワード"
                htmlFor="login-password"
                icon={<Lock className="h-4 w-4" />}
                error={passwordError}
              >
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onBlur={() => setPasswordTouched(true)}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputBaseClass}
                    placeholder="8文字以上で入力"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError ? 'login-password-error' : undefined
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center rounded-full px-3 text-white/60 transition hover:text-white"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? 'パスワードを隠す' : 'パスワードを表示'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FieldGroup>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                >
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-2xl"
                disabled={!isFormValid || loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                ログイン
              </Button>

              <div className="flex flex-col items-center gap-2 text-sm text-white/70">
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-white"
                  onClick={() =>
                    handlePlaceholderLink('新規登録フローは現在準備中です')
                  }
                >
                  新規登録はこちら
                </button>
                <button
                  type="button"
                  className="underline underline-offset-4 hover:text-white"
                  onClick={() =>
                    handlePlaceholderLink(
                      'パスワード再設定はサポート窓口で対応中です',
                    )
                  }
                >
                  パスワードをお忘れですか？
                </button>
                <p className="text-xs text-white/40">
                  ログイン後はロールに応じて自動でホームに遷移します。
                </p>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-white/60">
              <Link
                to="/"
                className="underline underline-offset-4 hover:text-white"
              >
                ホームへ戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function FieldGroup({
  label,
  htmlFor,
  icon,
  children,
  error,
}: {
  label: string
  htmlFor: string
  icon: ReactNode
  children: ReactNode
  error?: string
}) {
  const inputId = htmlFor
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  )
}
