import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

import type { FormEvent, ReactNode } from 'react'

import { isAppSignupError, signUpWithEmail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/signup')({
  component: SignupScreen,
})

const inputBaseClass =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-white/40 focus:border-rose-200 focus:outline-none'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SignupScreen() {
  const navigate = useNavigate({ from: '/signup' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    passwordConfirm: false,
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const nameError = useMemo(() => {
    if (!touched.name && !formSubmitted) return ''
    const trimmed = name.trim()
    if (!trimmed) return '名前を入力してください'
    if (trimmed.length > 32) return '32文字以内で入力してください'
    return ''
  }, [name, touched.name, formSubmitted])

  const emailError = useMemo(() => {
    if (!touched.email && !formSubmitted) return ''
    const trimmed = email.trim()
    if (!trimmed) return 'メールアドレスを入力してください'
    if (!EMAIL_REGEX.test(trimmed))
      return 'メールアドレスの形式が正しくありません'
    return ''
  }, [email, touched.email, formSubmitted])

  const passwordError = useMemo(() => {
    if (!touched.password && !formSubmitted) return ''
    const trimmed = password.trim()
    if (!trimmed) return 'パスワードを入力してください'
    if (trimmed.length < 8) return '8文字以上で入力してください'
    if (trimmed.length > 64) return '64文字以内で入力してください'
    return ''
  }, [password, touched.password, formSubmitted])

  const passwordConfirmError = useMemo(() => {
    if (!touched.passwordConfirm && !formSubmitted) return ''
    if (!passwordConfirm.trim()) return '確認用パスワードを入力してください'
    if (password !== passwordConfirm) return 'パスワードが一致しません'
    return ''
  }, [password, passwordConfirm, touched.passwordConfirm, formSubmitted])

  const passwordStrength = useMemo(
    () => buildPasswordStrength(password),
    [password],
  )

  const isFormValid =
    !nameError &&
    !emailError &&
    !passwordError &&
    !passwordConfirmError &&
    name.trim() &&
    email.trim() &&
    password &&
    passwordConfirm

  const signupMutation = useMutation({
    mutationFn: signUpWithEmail,
    onSuccess: (response) => {
      localStorage.setItem('otomohan_token', response.token)
      localStorage.setItem('otomohan_role', response.user.role)
      localStorage.setItem('otomohan_user_name', response.user.name)
      setErrorMessage('')
      const next = response.user.role === 'otomo' ? '/otomo-home' : '/'
      navigate({ to: next })
    },
    onError: (error: unknown) => {
      if (isAppSignupError(error)) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('登録に失敗しました。時間をおいて再度お試しください。')
      }
      setPassword('')
      setPasswordConfirm('')
      setTouched((prev) => ({
        ...prev,
        password: false,
        passwordConfirm: false,
      }))
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormSubmitted(true)
    setTouched({
      name: true,
      email: true,
      password: true,
      passwordConfirm: true,
    })
    if (!isFormValid || signupMutation.isPending) {
      if (!isFormValid) {
        setErrorMessage('入力内容を確認してください')
      }
      return
    }
    setErrorMessage('')
    signupMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-sky-500/20 via-fuchsia-500/10 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-[-30%] hidden w-[60%] rounded-full bg-sky-500/10 blur-3xl md:block" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16">
        <Card className="w-full max-w-2xl rounded-[32px] border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-rose-500">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-3xl font-semibold">
              アカウントを作成
            </CardTitle>
            <CardDescription className="text-base text-white/70">
              おともはんの全機能を利用するにはアカウント登録が必要です。必要な情報を入力し、すぐに利用を開始しましょう。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <FieldGroup
                label="名前"
                htmlFor="signup-name"
                icon={<UserRound className="h-4 w-4" />}
                error={nameError}
              >
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  onChange={(event) => setName(event.target.value)}
                  className={inputBaseClass}
                  placeholder="例）おとも太郎"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'signup-name-error' : undefined}
                />
              </FieldGroup>

              <FieldGroup
                label="メールアドレス"
                htmlFor="signup-email"
                icon={<Mail className="h-4 w-4" />}
                error={emailError}
              >
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputBaseClass}
                  placeholder="user@example.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? 'signup-email-error' : undefined
                  }
                />
              </FieldGroup>

              <FieldGroup
                label="パスワード"
                htmlFor="signup-password"
                icon={<Lock className="h-4 w-4" />}
                error={passwordError}
              >
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, password: true }))
                      }
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputBaseClass}
                      placeholder="8文字以上で入力"
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby={
                        passwordError ? 'signup-password-error' : undefined
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
                  <PasswordStrengthBar strength={passwordStrength} />
                </div>
              </FieldGroup>

              <FieldGroup
                label="パスワード（確認）"
                htmlFor="signup-password-confirm"
                icon={<Lock className="h-4 w-4" />}
                error={passwordConfirmError}
              >
                <input
                  id="signup-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, passwordConfirm: true }))
                  }
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className={inputBaseClass}
                  placeholder="確認のためもう一度入力"
                  aria-invalid={Boolean(passwordConfirmError)}
                  aria-describedby={
                    passwordConfirmError
                      ? 'signup-password-confirm-error'
                      : undefined
                  }
                />
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
                disabled={!isFormValid || signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                登録する
              </Button>

              <div className="flex flex-col items-center gap-2 text-sm text-white/70">
                <span>すでにアカウントをお持ちですか？</span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  ログインへ戻る
                </Link>
              </div>
            </form>
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
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  )
}

type PasswordStrength = {
  label: string
  score: number
  tone: 'low' | 'medium' | 'high'
}

function buildPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (!password) {
    return { label: '未入力', score: 0, tone: 'low' }
  }
  if (score <= 2) {
    return { label: '弱い', score, tone: 'low' }
  }
  if (score === 3) {
    return { label: '普通', score, tone: 'medium' }
  }
  return { label: '強い', score, tone: 'high' }
}

function PasswordStrengthBar({ strength }: { strength: PasswordStrength }) {
  const percentage = Math.min((strength.score / 5) * 100, 100)
  const toneClass =
    strength.tone === 'high'
      ? 'from-emerald-400 to-emerald-500'
      : strength.tone === 'medium'
        ? 'from-amber-400 to-amber-500'
        : 'from-rose-400 to-rose-500'
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>パスワード強度</span>
        <span>{strength.label}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
