import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
  Wallet2,
} from 'lucide-react'

import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

import type {
  WalletChargePayload,
  WalletChargeResponse,
  WalletPaymentMethod,
  WalletPlan,
} from '@/lib/api'
import {
  chargeWalletPlan,
  fetchWalletBalance,
  fetchWalletPlans,
} from '@/lib/api'
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
const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
})

const PAYMENT_METHODS: Array<{
  id: WalletPaymentMethod
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    id: 'credit_card',
    label: 'クレジットカード',
    description: 'Visa / Master / Amex',
    icon: CreditCard,
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay / Google Pay',
    description: '端末連携でワンタップ決済',
    icon: Smartphone,
  },
  {
    id: 'paypay',
    label: 'PayPay',
    description: 'アプリで承認してお支払い',
    icon: Wallet2,
  },
]

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export const Route = createFileRoute('/wallet/charge')({
  component: WalletChargeScreen,
  validateSearch: (search: Record<string, unknown>) => ({
    required: isPositiveNumber(search.required) ? search.required : undefined,
  }),
})

function WalletChargeScreen() {
  const { required } = Route.useSearch()
  const queryClient = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] =
    useState<WalletPaymentMethod>('credit_card')
  const [cardInfo, setCardInfo] = useState({
    number: '',
    exp: '',
    cvc: '',
    holder: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<WalletChargeResponse | null>(null)

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: fetchWalletBalance,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const plansQuery = useQuery({
    queryKey: ['wallet-plans'],
    queryFn: fetchWalletPlans,
    staleTime: 60_000,
  })

  const selectedPlan = useMemo(() => {
    if (!plansQuery.data || !selectedPlanId) {
      return undefined
    }
    return plansQuery.data.find((plan) => plan.id === selectedPlanId)
  }, [plansQuery.data, selectedPlanId])

  useEffect(() => {
    if (!selectedPlanId && plansQuery.data && plansQuery.data.length > 0) {
      setSelectedPlanId(plansQuery.data[0].id)
    }
  }, [plansQuery.data, selectedPlanId])

  const chargeMutation = useMutation({
    mutationFn: (payload: WalletChargePayload) => chargeWalletPlan(payload),
    onSuccess: (response) => {
      setFormError(null)
      setSuccess(response)
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      balanceQuery.refetch()
    },
    onError: (error: Error) => {
      setSuccess(null)
      setFormError(error.message)
    },
  })

  const handleSubmit = () => {
    setFormError(null)
    setSuccess(null)
    if (!selectedPlan) {
      setFormError('チャージプランを選択してください。')
      return
    }
    if (paymentMethod === 'credit_card') {
      const sanitized = cardInfo.number.replace(/\s+/g, '')
      if (sanitized.length < 12) {
        setFormError('カード番号を正しく入力してください。')
        return
      }
      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardInfo.exp)) {
        setFormError('有効期限は MM/YY 形式で入力してください。')
        return
      }
      if (cardInfo.cvc.length < 3) {
        setFormError('CVC を確認してください。')
        return
      }
      if (!cardInfo.holder.trim()) {
        setFormError('カード名義人を入力してください。')
        return
      }
    }

    const payload: WalletChargePayload = {
      planId: selectedPlan.id,
      paymentMethod,
      card:
        paymentMethod === 'credit_card'
          ? {
              number: cardInfo.number,
              exp: cardInfo.exp,
              cvc: cardInfo.cvc,
              holder: cardInfo.holder,
            }
          : undefined,
    }
    chargeMutation.mutate(payload)
  }
  const isSubmitting = chargeMutation.isPending

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-rose-500/20 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/4 rounded-full bg-blue-500/20 blur-[150px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-20 pt-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            className="rounded-2xl border border-white/10"
            asChild
          >
            <Link to="/wallet">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ウォレットへ戻る
            </Link>
          </Button>
          <div className="text-right">
            <p className="text-sm text-white/60">
              画面ID U-07 / ポイントチャージ
            </p>
            <h1 className="text-3xl font-semibold">ポイントチャージ</h1>
          </div>
        </header>

        {required && (
          <Card className="border-amber-400/40 bg-amber-400/10">
            <CardContent className="flex items-center gap-4 py-4 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-200" />
              <div>
                <p className="font-semibold text-white">
                  ポイントが不足しています
                </p>
                <p className="text-white/70">
                  通話を継続するには最低 {numberFormatter.format(required)} pt
                  が必要です。
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && <SuccessCard response={success} />}

        {formError && <AlertBanner message={formError} />}

        <BalanceSummaryCard
          balance={balanceQuery.data?.balance}
          isLoading={balanceQuery.isLoading}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">チャージプラン</h2>
              <p className="text-sm text-white/60">
                用途に合わせて選択してください
              </p>
            </div>
            {plansQuery.isFetching && (
              <span className="flex items-center gap-2 text-xs text-white/60">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                更新中
              </span>
            )}
          </div>

          {plansQuery.isLoading && <PlanSkeleton />}
          {plansQuery.isError && (
            <ErrorCard
              title="プランを読み込めませんでした"
              description="ネットワーク状況を確認して再試行してください。"
              onRetry={() => plansQuery.refetch()}
            />
          )}
          {!plansQuery.isLoading && !plansQuery.isError && plansQuery.data && (
            <div className="grid gap-4 md:grid-cols-3">
              {plansQuery.data.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlanId === plan.id}
                  onSelect={() => setSelectedPlanId(plan.id)}
                />
              ))}
            </div>
          )}
        </section>

        <PaymentMethodSection
          paymentMethod={paymentMethod}
          onChange={setPaymentMethod}
        />

        {paymentMethod === 'credit_card' && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>カード情報</CardTitle>
              <CardDescription className="text-white/70">
                暗号化通信で安全に送信されます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField
                label="カード番号"
                placeholder="•••• •••• •••• ••••"
                value={cardInfo.number}
                onChange={(value) =>
                  setCardInfo((prev) => ({ ...prev, number: value }))
                }
                type="password"
                inputMode="numeric"
                autoComplete="off"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <InputField
                  label="有効期限"
                  placeholder="MM/YY"
                  value={cardInfo.exp}
                  onChange={(value) =>
                    setCardInfo((prev) => ({ ...prev, exp: value }))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                />
                <InputField
                  label="CVC"
                  placeholder="123"
                  value={cardInfo.cvc}
                  onChange={(value) =>
                    setCardInfo((prev) => ({ ...prev, cvc: value }))
                  }
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                />
                <InputField
                  label="カード名義人"
                  placeholder="TARO OTOMO"
                  value={cardInfo.holder}
                  onChange={(value) =>
                    setCardInfo((prev) => ({ ...prev, holder: value }))
                  }
                  autoComplete="off"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <SummarySection
          selectedPlan={selectedPlan}
          paymentMethod={paymentMethod}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />

        <SecurityNote />
      </main>
    </div>
  )
}

function BalanceSummaryCard({
  balance,
  isLoading,
}: {
  balance?: number
  isLoading: boolean
}) {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-emerald-500/20 via-white/5 to-white/0">
      <CardHeader>
        <CardDescription className="text-white/70">現在の残高</CardDescription>
        <CardTitle className="text-4xl">
          {isLoading || balance === undefined
            ? '---'
            : `${numberFormatter.format(balance)} pt`}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-white/70">
        通話中は 1
        分ごとにポイントが消費され、リアルタイムで残高に反映されます。
      </CardContent>
    </Card>
  )
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: WalletPlan
  selected: boolean
  onSelect: () => void
}) {
  const approxMinutes = Math.max(1, Math.round(plan.amount / 100))
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-1 flex-col rounded-3xl border p-4 text-left transition hover:border-white/60',
        selected
          ? 'border-white bg-white/10 shadow-lg shadow-rose-500/20'
          : 'border-white/15 bg-white/5',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">{plan.name}</p>
        {plan.bonus !== undefined && plan.bonus > 0 && (
          <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs text-rose-100">
            +{plan.bonus}pt ボーナス
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-semibold">
        {numberFormatter.format(plan.amount)} pt
      </div>
      <p className="text-sm text-white/70">
        {currencyFormatter.format(plan.price)}
      </p>
      <p className="mt-3 text-xs text-white/60">
        約 {approxMinutes} 分の通話が可能
      </p>
      <div className="mt-4 text-right">
        <span
          className={cn(
            'inline-flex items-center rounded-2xl px-3 py-1 text-xs font-semibold',
            selected ? 'bg-slate-900 text-white' : 'bg-white/10 text-white/80',
          )}
        >
          {selected ? '選択中' : '選択する'}
        </span>
      </div>
    </button>
  )
}

function PlanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="border-white/10 bg-white/5">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PaymentMethodSection({
  paymentMethod,
  onChange,
}: {
  paymentMethod: WalletPaymentMethod
  onChange: (method: WalletPaymentMethod) => void
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">お支払い方法</h2>
        <p className="text-sm text-white/60">
          ご都合の良い決済手段を選択してください
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = paymentMethod === method.id
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border p-4 text-left transition',
                isSelected
                  ? 'border-white bg-white/10'
                  : 'border-white/15 bg-white/5 hover:border-white/30',
              )}
            >
              <method.icon className="h-6 w-6" />
              <div>
                <p className="font-semibold">{method.label}</p>
                <p className="text-xs text-white/60">{method.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
}) {
  return (
    <label className="text-sm">
      <span className="text-white/70">{label}</span>
      <input
        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-base text-white placeholder:text-white/40 focus:border-white focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
    </label>
  )
}

function SummarySection({
  selectedPlan,
  paymentMethod,
  isSubmitting,
  onSubmit,
}: {
  selectedPlan?: WalletPlan
  paymentMethod: WalletPaymentMethod
  isSubmitting: boolean
  onSubmit: () => void
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>最終確認</CardTitle>
        <CardDescription className="text-white/70">
          プランと支払い方法を確認してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <span>購入ポイント</span>
          <strong className="text-lg text-white">
            {selectedPlan
              ? `${numberFormatter.format(selectedPlan.amount)} pt`
              : 'プラン未選択'}
          </strong>
        </div>
        <div className="flex items-center justify-between">
          <span>支払金額</span>
          <strong className="text-lg text-white">
            {selectedPlan
              ? currencyFormatter.format(selectedPlan.price)
              : '---'}
          </strong>
        </div>
        <div className="flex items-center justify-between">
          <span>お支払い方法</span>
          <strong className="text-white">
            {
              PAYMENT_METHODS.find((method) => method.id === paymentMethod)
                ?.label
            }
          </strong>
        </div>

        <Button
          className="mt-4 w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90"
          disabled={!selectedPlan || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : (
            '購入する'
          )}
        </Button>
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
        <CardDescription className="text-rose-50">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" className="rounded-2xl" onClick={onRetry}>
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function AlertBanner({ message }: { message: string }) {
  return (
    <Card className="border-rose-500/40 bg-rose-500/10">
      <CardContent className="flex items-center gap-3 py-3 text-sm text-rose-50">
        <AlertTriangle className="h-4 w-4" />
        <span>{message}</span>
      </CardContent>
    </Card>
  )
}

function SuccessCard({ response }: { response: WalletChargeResponse }) {
  return (
    <Card className="border-emerald-400/40 bg-emerald-400/10">
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-200" />
          <div>
            <p className="font-semibold text-white">購入が完了しました</p>
            <p className="text-sm text-white/70">
              {numberFormatter.format(response.purchasedPlan.amount)} pt
              を追加しました。
            </p>
          </div>
        </div>
        <p className="text-sm text-white/70">
          新しい残高: {numberFormatter.format(response.newBalance.balance)} pt
        </p>
        <div className="flex gap-3">
          <Button asChild className="rounded-2xl bg-white text-slate-900">
            <Link to="/wallet">ウォレットで確認</Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link to="/">ホームへ戻る</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecurityNote() {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="flex items-center gap-4 py-4 text-sm text-white/80">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p>カード情報は暗号化され、安全に処理されます。</p>
          <p className="text-white/60">
            入力内容は保存されず、PCI DSS
            に準拠した決済ベンダーへ直接送信されます。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
