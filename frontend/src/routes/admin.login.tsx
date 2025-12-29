import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import type { FormEvent } from 'react'

import type {
  AdminLoginPayload,
  AdminLoginResponse,
  VerifyAdminMfaPayload,
} from '@/lib/api'
import { adminLogin, verifyAdminMfaCode } from '@/lib/api'
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

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginScreen,
})

type LoginStep = 'login' | 'mfa' | 'success'

function AdminLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [mfaCode, setMfaCode] = useState('')
  const [step, setStep] = useState<LoginStep>('login')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const loginMutation = useMutation<
    AdminLoginResponse,
    Error,
    AdminLoginPayload
  >({
    mutationFn: adminLogin,
    onSuccess: (result) => {
      if (result.mfaRequired && result.mfaSessionId) {
        setSessionId(result.mfaSessionId)
        setStep('mfa')
        setMfaCode('')
        return
      }
      setStep('success')
      setSuccessMessage('ログインに成功しました。A-02 への遷移を開始します。')
    },
  })

  const mfaMutation = useMutation<
    AdminLoginResponse,
    Error,
    VerifyAdminMfaPayload
  >({
    mutationFn: verifyAdminMfaCode,
    onSuccess: () => {
      setStep('success')
      setSuccessMessage('多要素認証が完了しました。ダッシュボードを開きます。')
    },
  })

  const isLoginStep = step === 'login'
  const isMfaStep = step === 'mfa'
  const isSuccess = step === 'success'
  const isPending =
    (isLoginStep && loginMutation.isPending) ||
    (isMfaStep && mfaMutation.isPending)

  const activeError = useMemo(() => {
    if (isLoginStep) {
      return loginMutation.error
    }
    if (isMfaStep) {
      return mfaMutation.error
    }
    return null
  }, [isLoginStep, isMfaStep, loginMutation.error, mfaMutation.error])

  const canSubmit = useMemo(() => {
    if (isLoginStep) {
      return Boolean(email.trim() && password.trim())
    }
    if (isMfaStep) {
      return mfaCode.trim().length === 6
    }
    return false
  }, [email, password, mfaCode, isLoginStep, isMfaStep])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoginStep) {
      loginMutation.mutate({ email, password })
      return
    }

    if (isMfaStep && sessionId) {
      mfaMutation.mutate({ sessionId, code: mfaCode })
    }
  }

  const resetFlow = () => {
    setStep('login')
    setSessionId(null)
    setMfaCode('')
    setSuccessMessage('')
    loginMutation.reset()
    mfaMutation.reset()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-rose-500/30 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-sky-500/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-500/20 blur-[140px]" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr,0.9fr]">
        <section className="hidden flex-col justify-between border-r border-white/10 px-10 py-12 lg:flex">
          <div className="space-y-6">
            <Badge className="rounded-full border border-white/20 bg-white/10 text-xs">
              OTOMOHAN OPS
            </Badge>
            <div>
              <p className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-white/60">
                <Sparkles className="h-4 w-4 text-rose-200" />
                Admin Console
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-tight">
                運営の集中司令室
              </h1>
              <p className="mt-4 max-w-lg text-lg text-white/70">
                重要なオペレーションを安全かつ素早く行うための専用ログイン。IP
                制限や MFA にも対応した高セキュリティ環境を想定しています。
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              セッションは全操作ログと紐付けて監査可能
            </div>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-sky-300" />
              Multi-tenant を意識したゼロトラスト構成
            </div>
            <p className="text-xs text-white/50">
              想定 API: POST /admin/auth/login, POST /admin/auth/mfa
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md space-y-6">
            <Card className="border-white/10 bg-slate-900/70 backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-semibold">
                  OTOMOHAN Admin Console
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 text-white/70">
                  <span>管理者のみアクセス可能</span>
                  <span className="text-white/40">/</span>
                  <span>IP 制限 + MFA 対応</span>
                </CardDescription>
                <StepIndicator currentStep={isSuccess ? 'mfa' : step} />
              </CardHeader>

              <CardContent>
                {!isSuccess && (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {isLoginStep && (
                      <>
                        <FieldLabel
                          htmlFor="admin-email"
                          label="メールアドレス"
                        />
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-rose-300">
                          <Mail className="h-4 w-4 text-white/50" />
                          <input
                            id="admin-email"
                            type="email"
                            autoComplete="email"
                            className="w-full bg-transparent text-base outline-none"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                          />
                        </div>

                        <FieldLabel
                          htmlFor="admin-password"
                          label="パスワード"
                        />
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-rose-300">
                          <Lock className="h-4 w-4 text-white/50" />
                          <input
                            id="admin-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            className="w-full bg-transparent text-base outline-none"
                            placeholder="********"
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                            required
                          />
                          <button
                            type="button"
                            className="text-white/60 transition hover:text-white"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={
                              showPassword
                                ? 'パスワードを隠す'
                                : 'パスワードを表示'
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rememberDevice}
                              onChange={(event) =>
                                setRememberDevice(event.target.checked)
                              }
                              className="h-4 w-4 rounded border-white/30 bg-transparent"
                            />
                            この端末を信頼する
                          </label>
                          <button
                            type="button"
                            className="text-rose-200 transition hover:text-rose-100"
                          >
                            パスワードをお忘れですか？
                          </button>
                        </div>
                      </>
                    )}

                    {isMfaStep && (
                      <div className="space-y-4">
                        <div>
                          <FieldLabel
                            htmlFor="admin-mfa"
                            label="多要素認証コード"
                          />
                          <p className="text-sm text-white/60">
                            登録済みデバイスに送信された 6
                            桁コードを入力してください。デモでは
                            <span className="font-semibold text-white">
                              {' '}
                              123456{' '}
                            </span>
                            が有効です。
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <input
                            id="admin-mfa"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            autoComplete="one-time-code"
                            className="w-full bg-transparent text-center text-2xl tracking-[0.5em] outline-none"
                            value={mfaCode}
                            onChange={(event) => {
                              const nextValue = event.target.value
                                .replace(/\D/g, '')
                                .slice(0, 6)
                              setMfaCode(nextValue)
                            }}
                            placeholder="••••••"
                          />
                        </div>
                        <button
                          type="button"
                          className="text-sm text-white/60 underline-offset-4 hover:underline"
                          onClick={resetFlow}
                        >
                          メール・パスワードを修正する
                        </button>
                      </div>
                    )}

                    {activeError && (
                      <div
                        className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
                        role="alert"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <span>{activeError.message}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!canSubmit || isPending}
                      className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-purple-500 to-sky-500 text-base font-semibold shadow-lg shadow-rose-500/30"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          確認中
                        </>
                      ) : isMfaStep ? (
                        'コードを送信'
                      ) : (
                        'ログイン'
                      )}
                    </Button>
                  </form>
                )}

                {isSuccess && (
                  <div className="space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">認証完了</h2>
                      <p className="mt-2 text-sm text-white/70">
                        {successMessage ||
                          '認証が完了しました。A-02 管理ダッシュボードへ遷移する想定です。'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button className="w-full rounded-2xl" asChild>
                        <a href="/">ダッシュボード（仮）へ戻る</a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full rounded-2xl"
                        onClick={resetFlow}
                      >
                        別アカウントでログイン
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <DemoHelper />
          </div>
        </section>
      </div>
    </div>
  )
}

function FieldLabel({ label, htmlFor }: { label: string; htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold uppercase tracking-wide text-white/70"
    >
      {label}
    </label>
  )
}

function StepIndicator({ currentStep }: { currentStep: LoginStep }) {
  const steps: Array<{ id: LoginStep; label: string }> = [
    { id: 'login', label: 'ログイン' },
    { id: 'mfa', label: 'MFA' },
  ]

  return (
    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-white/60">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border text-sm',
              currentStep === step.id
                ? 'border-rose-300 bg-rose-400/10 text-white'
                : 'border-white/20 text-white/50',
            )}
          >
            {index + 1}
          </div>
          <span className="text-white/70">{step.label}</span>
          {index < steps.length - 1 && (
            <span className="block h-px w-10 bg-gradient-to-r from-white/10 to-white/40" />
          )}
        </div>
      ))}
    </div>
  )
}

function DemoHelper() {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/70">
      <h3 className="text-base font-semibold text-white">デモ利用メモ</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          任意のメール + パスワード{' '}
          <span className="font-semibold text-white">otomohan-admin</span>{' '}
          でログインできます。
        </li>
        <li>
          メールに <span className="font-semibold text-white">+mfa</span>{' '}
          を付与すると MFA ステップが発生します。
        </li>
        <li>
          MFA コードは <span className="font-semibold text-white">123456</span>{' '}
          で固定です。
        </li>
      </ul>
    </div>
  )
}
