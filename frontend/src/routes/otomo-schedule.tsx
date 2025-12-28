import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Minus,
  Plus,
  Save,
} from 'lucide-react'

import type {
  OtomoScheduleDay,
  OtomoScheduleException,
  OtomoSchedulePayload,
  OtomoScheduleRange,
} from '@/lib/api'
import { fetchOtomoSchedule, updateOtomoSchedule } from '@/lib/api'
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

export const Route = createFileRoute('/otomo-schedule')({
  component: OtomoScheduleScreen,
})

type BannerState = {
  type: 'success' | 'error'
  message: string
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

type WeeklySetter = (
  updater: (prev: Array<OtomoScheduleDay>) => Array<OtomoScheduleDay>,
) => void

function OtomoScheduleScreen() {
  const router = useRouter()
  const [weekly, setWeekly] = useState<Array<OtomoScheduleDay>>([])
  const [autoStatusEnabled, setAutoStatusEnabled] = useState(true)
  const [timezone, setTimezone] = useState('Asia/Tokyo')
  const [exceptions, setExceptions] = useState<Array<OtomoScheduleException>>(
    [],
  )
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [initialSnapshot, setInitialSnapshot] = useState('')
  const [banner, setBanner] = useState<BannerState | null>(null)

  const scheduleQuery = useQuery({
    queryKey: ['otomo-schedule'],
    queryFn: fetchOtomoSchedule,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!scheduleQuery.data) return
    const normalized = cloneWeekly(scheduleQuery.data)
    setWeekly(normalized)
    setAutoStatusEnabled(scheduleQuery.data.autoStatusEnabled)
    setTimezone(scheduleQuery.data.timezone)
    setExceptions(scheduleQuery.data.exceptions)
    setLastUpdatedAt(scheduleQuery.data.lastUpdatedAt)
    setInitialSnapshot(
      JSON.stringify({
        weekly: normalized,
        autoStatusEnabled: scheduleQuery.data.autoStatusEnabled,
      }),
    )
  }, [scheduleQuery.data])

  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(timer)
  }, [banner])

  const scheduleErrors = useMemo(() => buildScheduleErrors(weekly), [weekly])
  const currentSnapshot = JSON.stringify({ weekly, autoStatusEnabled })
  const isDirty = initialSnapshot && currentSnapshot !== initialSnapshot
  const hasErrors = scheduleErrors.size > 0

  const mutation = useMutation({
    mutationFn: updateOtomoSchedule,
    onSuccess: (payload: OtomoSchedulePayload) => {
      const normalized = cloneWeekly(payload)
      setWeekly(normalized)
      setAutoStatusEnabled(payload.autoStatusEnabled)
      setTimezone(payload.timezone)
      setExceptions(payload.exceptions)
      setLastUpdatedAt(payload.lastUpdatedAt)
      const nextSnapshot = JSON.stringify({
        weekly: normalized,
        autoStatusEnabled: payload.autoStatusEnabled,
      })
      setInitialSnapshot(nextSnapshot)
      setBanner({ type: 'success', message: 'スケジュールを保存しました。' })
      setTimeout(() => {
        router.navigate({ to: '/otomo-home' })
      }, 600)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'スケジュールの保存に失敗しました。'
      setBanner({ type: 'error', message })
    },
  })

  if (scheduleQuery.isLoading && weekly.length === 0) {
    return <ScheduleLoading />
  }

  if (scheduleQuery.isError) {
    return (
      <ErrorState
        message="スケジュールの取得に失敗しました"
        onRetry={() => scheduleQuery.refetch()}
      />
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-rose-500/20 blur-[160px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sky-500/20 blur-[170px]" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-32 pt-8 sm:px-6">
        <ScheduleHeader
          onBack={() => router.navigate({ to: '/otomo-home' })}
          onSave={() =>
            mutation.mutate({
              weekly: weekly.map((day) => ({
                day: day.day,
                isDayOff: day.isDayOff,
                ranges: day.ranges.map((range) => ({
                  id: range.id,
                  start: range.start,
                  end: range.end,
                })),
              })),
              autoStatusEnabled,
              timezone,
            })
          }
          disableSave={!isDirty || hasErrors || mutation.isPending}
          isSaving={mutation.isPending}
        />

        {banner ? <InlineBanner banner={banner} /> : null}

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-xl">通話受付時間の管理</CardTitle>
            <CardDescription className="text-white/70">
              通話リクエストを受け付ける曜日と時間帯を設定できます。稼働時間外は自動的に「離席中」に切り替わります。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <Badge className="rounded-full bg-white/10 text-xs text-white">
              画面ID O-06
            </Badge>
            <span>タイムゾーン: {timezone}</span>
            {lastUpdatedAt ? (
              <span>
                最終更新:{' '}
                {new Date(lastUpdatedAt).toLocaleString('ja-JP', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-4">
          {weekly.map((day) => (
            <ScheduleDayCard
              key={day.day}
              day={day}
              errorMessage={scheduleErrors.get(day.day)}
              onToggleDayOff={(isOff) =>
                toggleDayOff(day.day, isOff, setWeekly)
              }
              onAddRange={() => addRange(day.day, setWeekly)}
              onRemoveRange={(rangeId) =>
                removeRange(day.day, rangeId, setWeekly)
              }
              onChangeRange={(rangeId, field, value) =>
                updateRange(day.day, rangeId, field, value, setWeekly)
              }
            />
          ))}
        </section>

        {hasErrors ? (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            入力内容にエラーがあります。赤字の項目を確認してください。
          </p>
        ) : null}

        <SchedulePreview weekly={weekly} />
        <AutoStatusCard
          enabled={autoStatusEnabled}
          onToggle={() => setAutoStatusEnabled((prev) => !prev)}
        />
        <ExceptionList exceptions={exceptions} />
        <StatusHowTo />
      </main>
    </div>
  )
}

function ScheduleHeader({
  onBack,
  onSave,
  disableSave,
  isSaving,
}: {
  onBack: () => void
  onSave: () => void
  disableSave: boolean
  isSaving: boolean
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Button
        type="button"
        variant="ghost"
        className="w-auto rounded-2xl border border-white/10 text-white"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>
      <div className="text-center">
        <p className="text-sm text-white/60">おとも稼働スケジュール</p>
        <h1 className="text-2xl font-semibold text-white">
          稼働スケジュール設定
        </h1>
      </div>
      <Button
        type="button"
        className="w-auto rounded-2xl bg-white/90 text-slate-900 hover:bg-white"
        disabled={disableSave}
        onClick={onSave}
      >
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        保存
      </Button>
    </header>
  )
}

function InlineBanner({ banner }: { banner: BannerState }) {
  const Icon = banner.type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm',
        banner.type === 'success'
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
          : 'border-rose-400/40 bg-rose-500/10 text-rose-200',
      )}
    >
      <Icon className="h-4 w-4" />
      {banner.message}
    </div>
  )
}

function ScheduleDayCard({
  day,
  errorMessage,
  onToggleDayOff,
  onAddRange,
  onRemoveRange,
  onChangeRange,
}: {
  day: OtomoScheduleDay
  errorMessage?: string
  onToggleDayOff: (next: boolean) => void
  onAddRange: () => void
  onRemoveRange: (rangeId: string) => void
  onChangeRange: (
    rangeId: string,
    field: 'start' | 'end',
    value: string,
  ) => void
}) {
  return (
    <Card
      className={cn(
        'border-white/10 bg-white/5 transition-colors',
        day.isDayOff && 'opacity-70',
      )}
    >
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">
            {day.label}曜日
            <span className="ml-2 text-sm text-white/60">
              {day.fullLabel ?? ''}
            </span>
          </CardTitle>
          <CardDescription className="text-white/70">
            {day.isDayOff
              ? '終日離席（通話リクエストは停止されます）'
              : '開始〜終了時間で複数枠を設定できます'}
          </CardDescription>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-white/30 bg-transparent"
            checked={day.isDayOff}
            onChange={(event) => onToggleDayOff(event.target.checked)}
          />
          稼働しない
        </label>
      </CardHeader>
      <CardContent className="space-y-3">
        {day.isDayOff ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            この日は常に「離席中」として扱われます。
          </p>
        ) : (
          <div className="space-y-3">
            {day.ranges.map((range) => (
              <div
                key={range.id}
                className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[auto,1fr,auto,1fr,auto]"
              >
                <Clock className="hidden h-4 w-4 text-white/70 sm:block" />
                <TimeField
                  label="開始"
                  value={range.start}
                  onChange={(value) => onChangeRange(range.id, 'start', value)}
                />
                <div className="flex items-center justify-center text-white/60">
                  〜
                </div>
                <TimeField
                  label="終了"
                  value={range.end}
                  onChange={(value) => onChangeRange(range.id, 'end', value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-self-end rounded-2xl border border-white/10 text-white"
                  onClick={() => onRemoveRange(range.id)}
                >
                  <Minus className="mr-1 h-4 w-4" />
                  削除
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl border border-dashed border-white/30 text-white"
              onClick={onAddRange}
            >
              <Plus className="mr-2 h-4 w-4" />
              枠を追加
            </Button>
          </div>
        )}
        {errorMessage ? (
          <p className="text-sm text-rose-300">{errorMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-white/60">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-base text-white"
      />
    </label>
  )
}

function SchedulePreview({ weekly }: { weekly: Array<OtomoScheduleDay> }) {
  const preview = useMemo(() => buildPreview(weekly), [weekly])
  const maxMinutes = Math.max(...preview.map((item) => item.minutes), 1)

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle>今週の稼働プレビュー</CardTitle>
        <CardDescription className="text-white/70">
          設定した時間を棒グラフで可視化します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {preview.map((item) => (
          <div key={item.day}>
            <div className="mb-1 flex items-center justify-between text-sm text-white/70">
              <span>{item.label}</span>
              <span>{item.minutes > 0 ? `${item.minutes}分` : '稼働なし'}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-sky-400"
                style={{ width: `${(item.minutes / maxMinutes) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AutoStatusCard({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>自動ステータス切り替え</CardTitle>
          <CardDescription className="text-white/70">
            稼働開始で自動的に「待機中」、終了で「離席中」に切り替えます。
          </CardDescription>
        </div>
        <Button
          type="button"
          variant={enabled ? 'default' : 'outline'}
          className={cn(
            'rounded-2xl',
            enabled
              ? 'bg-white/90 text-slate-900'
              : 'border-white/20 text-white',
          )}
          onClick={onToggle}
        >
          {enabled ? '有効' : '無効'}
        </Button>
      </CardHeader>
      <CardContent className="text-sm text-white/70">
        自動化を ON にすると設定済みの枠にあわせてステータスが切り替わり、
        通話リクエストの受け付け忘れを防げます。
      </CardContent>
    </Card>
  )
}

function ExceptionList({
  exceptions,
}: {
  exceptions: Array<OtomoScheduleException>
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>例外設定（将来機能）</CardTitle>
          <CardDescription className="text-white/70">
            短期の休暇や部分稼働をここで管理する予定です
          </CardDescription>
        </div>
        <Badge className="rounded-full bg-white/10 text-white">準備中</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white/80">
        {exceptions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 px-4 py-3 text-white/60">
            例外設定はまだ登録されていません。
          </p>
        ) : (
          exceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-white/60" />
                <span>{formatDate(exception.date)}</span>
              </div>
              <div className="text-right text-white/70">
                {exception.type === 'off'
                  ? '休み'
                  : `${exception.start ?? '--:--'}〜${exception.end ?? '--:--'}`}
                {exception.note ? ` / ${exception.note}` : ''}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function StatusHowTo() {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-slate-900/40 to-transparent">
      <CardHeader>
        <CardTitle>自動切り替えの仕組み</CardTitle>
        <CardDescription className="text-white/70">
          稼働時間になると待機中、終了後は離席中へ自動で遷移します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white/80">
        <p>稼働開始 → 自動的に「待機中」へ更新</p>
        <p>稼働終了 → 自動的に「離席中」へ更新</p>
        <p className="text-white/60">
          例外設定が有効な日はそちらを優先してステータスを制御します。
        </p>
      </CardContent>
    </Card>
  )
}

function ScheduleLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
      <p>スケジュールを読み込んでいます...</p>
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

function buildScheduleErrors(weekly: Array<OtomoScheduleDay>) {
  const errors = new Map<number, string>()
  weekly.forEach((day) => {
    if (day.isDayOff) return
    if (!day.ranges.length) {
      errors.set(day.day, '少なくとも1つの時間帯を設定してください。')
      return
    }

    const normalized = day.ranges.map((range) => ({
      ...range,
      startMinutes: parseTime(range.start),
      endMinutes: parseTime(range.end),
    }))

    if (
      normalized.some(
        (item) => item.startMinutes === null || item.endMinutes === null,
      )
    ) {
      errors.set(day.day, '時間は HH:MM 形式で入力してください。')
      return
    }

    if (
      normalized.some(
        (item) =>
          typeof item.startMinutes === 'number' &&
          typeof item.endMinutes === 'number' &&
          item.endMinutes <= item.startMinutes,
      )
    ) {
      errors.set(day.day, '終了時間は開始時間より後に設定してください。')
      return
    }

    const sorted = normalized
      .slice()
      .sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0))
    for (let i = 1; i < sorted.length; i += 1) {
      if ((sorted[i].startMinutes ?? 0) < (sorted[i - 1].endMinutes ?? 0)) {
        errors.set(day.day, '同じ曜日で時間帯が重複しています。')
        break
      }
    }
  })

  return errors
}

function buildPreview(weekly: Array<OtomoScheduleDay>) {
  return weekly.map((day) => ({
    day: day.day,
    label: `${day.label}曜`,
    minutes: day.ranges.reduce((total, range) => total + diffMinutes(range), 0),
  }))
}

function diffMinutes(range: OtomoScheduleRange) {
  const start = parseTime(range.start)
  const end = parseTime(range.end)
  if (start === null || end === null || end <= start) return 0
  return end - start
}

function parseTime(value: string | undefined) {
  if (!value || !TIME_PATTERN.test(value)) return null
  const [hours, minutes] = value.split(':').map((v) => Number(v))
  return hours * 60 + minutes
}

function toggleDayOff(
  dayNumber: number,
  isOff: boolean,
  setWeekly: WeeklySetter,
) {
  setWeekly((prev) =>
    prev.map((day) => {
      if (day.day !== dayNumber) return day
      if (isOff) {
        return { ...day, isDayOff: true, ranges: [] }
      }
      const fallback = day.ranges.length
        ? day.ranges
        : [createDefaultRange(dayNumber)]
      return { ...day, isDayOff: false, ranges: [...fallback] }
    }),
  )
}

function addRange(dayNumber: number, setWeekly: WeeklySetter) {
  setWeekly((prev) =>
    prev.map((day) => {
      if (day.day !== dayNumber) return day
      return {
        ...day,
        isDayOff: false,
        ranges: [...day.ranges, createDefaultRange(dayNumber)],
      }
    }),
  )
}

function removeRange(
  dayNumber: number,
  rangeId: string,
  setWeekly: WeeklySetter,
) {
  setWeekly((prev) =>
    prev.map((day) => {
      if (day.day !== dayNumber) return day
      const nextRanges = day.ranges.filter((range) => range.id !== rangeId)
      return {
        ...day,
        ranges: nextRanges,
        isDayOff: nextRanges.length === 0,
      }
    }),
  )
}

function updateRange(
  dayNumber: number,
  rangeId: string,
  field: 'start' | 'end',
  value: string,
  setWeekly: WeeklySetter,
) {
  setWeekly((prev) =>
    prev.map((day) => {
      if (day.day !== dayNumber) return day
      return {
        ...day,
        ranges: day.ranges.map((range) =>
          range.id === rangeId ? { ...range, [field]: value } : range,
        ),
      }
    }),
  )
}

function createDefaultRange(dayNumber: number): OtomoScheduleRange {
  return {
    id: `temp-${dayNumber}-${Math.random().toString(36).slice(2, 8)}`,
    start: '20:00',
    end: '23:00',
  }
}

function cloneWeekly(payload: OtomoSchedulePayload) {
  return payload.weekly.map((day) => ({
    ...day,
    ranges: day.ranges.map((range) => ({ ...range })),
  }))
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
}
