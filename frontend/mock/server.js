import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import multer from 'multer'
import { v4 as uuid } from 'uuid'

import {
  now,
  walletBalance,
  walletPlans,
  walletUsage,
  otomoList,
  calls,
  callHistory,
  userProfile,
  userSettings,
  supportResources,
  otomoSelf,
  otomoRewardSummary,
  otomoCallFeed,
  otomoIncomingCall,
  otomoActiveCall,
  otomoLastCallSummary,
  otomoStatsSummaryByRange,
  otomoStatsDaily,
  otomoStatsHourly,
  otomoStatsCalls,
  otomoStatsRepeat,
  otomoSchedule,
  SCHEDULE_WEEKDAYS,
  otomoReviewSummary,
  otomoReviews,
  otomoReviewAlerts,
  legalDocuments,
} from './data/mockData.js'

const app = express()
const PORT = process.env.PORT || 5050
const artificialDelayMs = Number(process.env.MOCK_DELAY_MS || 0)
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_NAME_LENGTH = 20
const MAX_INTRO_LENGTH = 300
const NAME_PROHIBITED_PATTERN = /[<>@#%{}\[\]\\|^~]/u
const ALLOWED_THEMES = new Set(['dark', 'light'])
const STATS_RANGES = ['today', 'week', 'month', 'all']
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES },
})
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const WEEKDAY_LOOKUP = new Map(
  SCHEDULE_WEEKDAYS.map((weekday) => [weekday.day, weekday]),
)

const getActiveIncomingCall = () => {
  const call = otomoIncomingCall.current
  if (!call) return null
  const expiresAtMs = new Date(call.expiresAt).getTime()
  if (Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now()) {
    otomoIncomingCall.current = null
    return null
  }
  return call
}

const getActiveOtomoCall = () => otomoActiveCall.current

const buildActiveCallState = (call) => ({
  callId: call.callId,
  user: call.user,
  startedAt: now(),
  connectionQuality: 'good',
  voiceStatus: '音声品質は良好です',
  transport: 'SFU (mediasoup)',
  remoteMicState: 'on',
  ratePerMinute: call.ratePerMinute ?? 0,
  events: [
    {
      id: `evt-${Date.now()}`,
      level: 'info',
      message: '通話を開始しました',
      occurredAt: now(),
    },
  ],
})

const buildCallSummaryPayload = ({
  call,
  reason,
  endedAt,
  durationSeconds,
}) => {
  const billedMinutes = Math.max(1, Math.ceil(durationSeconds / 60))
  const earnedPoints = billedMinutes * (call.ratePerMinute ?? 0)
  otomoRewardSummary.todayPoints += earnedPoints
  otomoRewardSummary.totalPoints += earnedPoints
  otomoSelf.todayPoints = otomoRewardSummary.todayPoints
  otomoSelf.totalPoints = otomoRewardSummary.totalPoints

  return {
    callId: call.callId,
    user: call.user,
    reason,
    startedAt: call.startedAt,
    endedAt,
    durationSeconds,
    billedMinutes,
    reward: {
      earnedPoints,
      totalPoints: otomoRewardSummary.totalPoints,
      ratePerMinute: call.ratePerMinute ?? 0,
    },
    memo: otomoLastCallSummary.current?.memo ?? '',
  }
}

const buildLatestCallSummary = () => {
  const latest = callHistory[0]
  return latest
    ? {
        callId: latest.callId,
        otomoName: latest.otomo.name,
        durationSec: latest.durationSec,
      }
    : null
}

const buildUserPayload = () => ({
  ...userProfile,
  intro: userProfile.intro ?? '',
  balance: walletBalance.balance,
  latestCall: buildLatestCallSummary(),
})

const buildOtomoPayload = () => ({
  ...otomoSelf,
  rewardSummary: otomoRewardSummary,
  recentCalls: otomoCallFeed.slice(0, 4),
})

const normalizeStatsRange = (value) => {
  const normalized = String(value || 'week').toLowerCase()
  return STATS_RANGES.includes(normalized) ? normalized : 'week'
}

const pickDailyStatsByRange = (range) => {
  switch (range) {
    case 'today':
      return otomoStatsDaily.slice(-1)
    case 'week':
      return otomoStatsDaily.slice(-7)
    case 'month':
      return otomoStatsDaily
    case 'all':
    default:
      return otomoStatsDaily
  }
}

const toMinutes = (time) => {
  if (typeof time !== 'string' || !TIME_PATTERN.test(time)) {
    return null
  }
  const [hours, minutes] = time.split(':').map((value) => Number(value))
  return hours * 60 + minutes
}

const ensureRangeId = (day, providedId) => {
  if (typeof providedId === 'string' && providedId.trim().length > 0) {
    return providedId.trim()
  }
  return `range-${day}-${uuid()}`
}

const normalizeScheduleRanges = (day, ranges = []) => {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return []
  }

  const normalized = ranges.map((range, index) => {
    if (!range || typeof range !== 'object') {
      throw new Error('時間帯の形式が不正です。')
    }
    const startMinutes = toMinutes(range.start)
    const endMinutes = toMinutes(range.end)
    if (startMinutes === null) {
      throw new Error('開始時間は HH:MM 形式で入力してください。')
    }
    if (endMinutes === null) {
      throw new Error('終了時間は HH:MM 形式で入力してください。')
    }
    if (endMinutes <= startMinutes) {
      throw new Error('終了時間は開始時間より後に設定してください。')
    }

    return {
      id: ensureRangeId(day, range.id ?? `range-${day}-${index}`),
      start: range.start,
      end: range.end,
      _startMinutes: startMinutes,
      _endMinutes: endMinutes,
    }
  })

  const sorted = normalized.sort((a, b) => a._startMinutes - b._startMinutes)
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const current = sorted[i]
    if (current._startMinutes < prev._endMinutes) {
      throw new Error('同じ曜日で時間帯が重複しています。')
    }
  }

  return sorted.map(({ _startMinutes, _endMinutes, ...rest }) => rest)
}

const normalizeScheduleWeekly = (weeklyInput = []) => {
  if (!Array.isArray(weeklyInput)) {
    throw new Error('週次スケジュールを配列で指定してください。')
  }
  const normalizedMap = new Map()

  weeklyInput.forEach((entry) => {
    const dayNumber = Number(entry?.day)
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 7) {
      throw new Error('曜日の指定が不正です。')
    }
    const meta = WEEKDAY_LOOKUP.get(dayNumber)
    const ranges = normalizeScheduleRanges(dayNumber, entry.ranges)
    const isDayOff = Boolean(entry?.isDayOff) || ranges.length === 0

    normalizedMap.set(dayNumber, {
      day: dayNumber,
      label: meta?.label ?? '日',
      fullLabel: meta?.fullLabel ?? '日曜日',
      isDayOff,
      ranges: isDayOff ? [] : ranges,
    })
  })

  return SCHEDULE_WEEKDAYS.map(
    (weekday) =>
      normalizedMap.get(weekday.day) ?? {
        day: weekday.day,
        label: weekday.label,
        fullLabel: weekday.fullLabel,
        isDayOff: true,
        ranges: [],
      },
  )
}

const normalizeScheduleExceptions = (exceptionsInput = []) => {
  if (!Array.isArray(exceptionsInput) || exceptionsInput.length === 0) {
    return otomoSchedule.exceptions ?? []
  }

  return exceptionsInput.slice(0, 20).map((item) => {
    const date = String(item?.date ?? '').trim()
    if (!DATE_PATTERN.test(date)) {
      throw new Error('例外設定の日付は YYYY-MM-DD 形式で指定してください。')
    }
    const type = item?.type === 'partial' ? 'partial' : 'off'
    let start
    let end
    if (type === 'partial') {
      const startMinutes = toMinutes(item?.start)
      const endMinutes = toMinutes(item?.end)
      if (startMinutes === null || endMinutes === null) {
        throw new Error('例外設定の時間は HH:MM 形式で指定してください。')
      }
      if (endMinutes <= startMinutes) {
        throw new Error(
          '例外設定の終了時間は開始時間より後に設定してください。',
        )
      }
      start = item.start
      end = item.end
    }

    return {
      id:
        typeof item?.id === 'string' && item.id.trim().length > 0
          ? item.id.trim()
          : `exc-${date}-${uuid()}`,
      date,
      type,
      start,
      end,
      note: typeof item?.note === 'string' ? item.note : '',
    }
  })
}

const cloneScheduleDay = (day) => ({
  ...day,
  ranges: day.ranges.map((range) => ({ ...range })),
})

const serializeSchedule = () => ({
  weekly: otomoSchedule.weekly.map((day) => cloneScheduleDay(day)),
  exceptions: otomoSchedule.exceptions.map((exception) => ({ ...exception })),
  autoStatusEnabled: otomoSchedule.autoStatusEnabled,
  timezone: otomoSchedule.timezone,
  lastUpdatedAt: otomoSchedule.lastUpdatedAt,
})

const respondWithSchedule = (res, status = 200) =>
  res.status(status).json({ schedule: serializeSchedule() })

const parseRatingFilter = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }
  const ratings = value
    .split(',')
    .map((token) => Number(token.trim()))
    .filter((num) => Number.isInteger(num) && num >= 1 && num <= 5)
  return ratings.length ? ratings : null
}

const normalizeCommentFilter = (value) => {
  if (value === 'with') return 'with'
  if (value === 'without') return 'without'
  return null
}

const buildReviewResponse = (review) => ({
  ...review,
  durationMinutes: Math.max(1, Math.round((review.durationSeconds ?? 0) / 60)),
})

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.use((req, res, next) => {
  if (!artificialDelayMs) return next()
  setTimeout(next, artificialDelayMs)
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: now() })
})

app.get('/wallet/balance', (_req, res) => {
  res.json(walletBalance)
})

app.get('/wallet/plans', (_req, res) => {
  res.json({ plans: walletPlans })
})

app.post('/wallet/charge', (req, res) => {
  const { planId } = req.body || {}
  const plan = walletPlans.find((p) => p.id === planId)
  if (!plan) {
    return res.status(400).json({
      error: 'Invalid planId',
      availablePlanIds: walletPlans.map((p) => p.id),
    })
  }

  walletBalance.balance += plan.amount + plan.bonus
  walletBalance.updatedAt = now()

  res.status(201).json({
    transactionId: uuid(),
    newBalance: walletBalance,
    purchasedPlan: plan,
  })
})

app.get('/wallet/usage', (req, res) => {
  const limit = Number(req.query.limit)
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? limit : undefined
  const items = normalizedLimit
    ? walletUsage.slice(0, normalizedLimit)
    : walletUsage
  res.json({ items, total: walletUsage.length })
})

app.get('/user/me', (_req, res) => {
  res.json(buildUserPayload())
})

app.put('/user/profile', (req, res) => {
  const { name, intro } = req.body || {}
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: '名前を入力してください' })
  }

  const trimmedName = name.trim()
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      error: `名前は${MAX_NAME_LENGTH}文字以内で入力してください`,
    })
  }
  if (NAME_PROHIBITED_PATTERN.test(trimmedName)) {
    return res.status(400).json({
      error: '使用できない文字が含まれています',
    })
  }

  if (typeof intro === 'string') {
    const normalizedIntro = intro.trim()
    if (normalizedIntro.length > MAX_INTRO_LENGTH) {
      return res.status(400).json({ error: '300文字以内で入力してください' })
    }
    userProfile.intro = normalizedIntro
  } else if (intro === null) {
    userProfile.intro = ''
  }

  userProfile.name = trimmedName

  res.json({ status: 'success', user: buildUserPayload() })
})

app.put('/user/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '画像ファイルが必要です' })
  }

  if (!ACCEPTED_AVATAR_TYPES.has(req.file.mimetype)) {
    return res.status(400).json({ error: '対応していない画像形式です' })
  }

  if (req.file.size > MAX_AVATAR_BYTES) {
    return res.status(400).json({ error: '画像サイズは5MB以内にしてください' })
  }

  const base64 = req.file.buffer.toString('base64')
  userProfile.avatarUrl = `data:${req.file.mimetype};base64,${base64}`

  res.json({ status: 'success', avatarUrl: userProfile.avatarUrl })
})

app.get('/user/settings', (_req, res) => {
  res.json({ settings: userSettings })
})

app.put('/user/settings', (req, res) => {
  const { notifications, app: appSettings } = req.body || {}

  if (
    notifications !== undefined &&
    (notifications === null || typeof notifications !== 'object')
  ) {
    return res.status(400).json({ error: '通知設定の形式が不正です。' })
  }
  if (
    appSettings !== undefined &&
    (appSettings === null || typeof appSettings !== 'object')
  ) {
    return res.status(400).json({ error: 'アプリ設定の形式が不正です。' })
  }

  const nextNotifications = { ...userSettings.notifications }
  if (notifications) {
    if ('push' in notifications) {
      if (typeof notifications.push !== 'boolean') {
        return res
          .status(400)
          .json({ error: 'プッシュ通知は true / false で指定してください。' })
      }
      nextNotifications.push = notifications.push
    }
    if ('email' in notifications) {
      if (typeof notifications.email !== 'boolean') {
        return res
          .status(400)
          .json({ error: 'メール通知は true / false で指定してください。' })
      }
      nextNotifications.email = notifications.email
    }
  }

  const nextApp = { ...userSettings.app }
  if (appSettings) {
    if ('theme' in appSettings) {
      if (
        typeof appSettings.theme !== 'string' ||
        !ALLOWED_THEMES.has(appSettings.theme)
      ) {
        return res
          .status(400)
          .json({ error: 'サポートされていないテーマです。' })
      }
      nextApp.theme = appSettings.theme
    }
    if ('beepTone' in appSettings) {
      if (typeof appSettings.beepTone !== 'boolean') {
        return res
          .status(400)
          .json({ error: 'ビープ音の設定は true / false で指定してください。' })
      }
      nextApp.beepTone = appSettings.beepTone
    }
  }

  userSettings.notifications = nextNotifications
  userSettings.app = nextApp

  res.json({ status: 'saved', settings: userSettings })
})

app.get('/settings', (_req, res) => {
  res.json({
    links: supportResources,
    app: userSettings.app,
    version: '2025.02.0',
  })
})

app.get('/legal/:slug', (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase()
  if (!['terms', 'privacy'].includes(slug)) {
    return res.status(404).json({ error: 'document_not_found' })
  }
  res.json(legalDocuments[slug])
})

app.post('/analytics/legal-view', (req, res) => {
  const { slug } = req.body || {}
  const normalized = ['terms', 'privacy'].includes(slug) ? slug : 'unknown'
  res.json({ status: 'recorded', slug: normalized, recordedAt: now() })
})

app.post('/auth/logout', (_req, res) => {
  res.json({ status: 'logged_out', loggedOutAt: now() })
})

app.delete('/user/delete', (req, res) => {
  const { reason } = req.body || {}
  res.json({ status: 'deleted', deletedAt: now(), reason: reason ?? null })
})

app.get('/otomo/me', (_req, res) => {
  res.json(buildOtomoPayload())
})

app.put('/otomo/status', (req, res) => {
  const { status } = req.body || {}
  const allowed = ['online', 'away', 'busy']
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: '不正なステータスです。' })
  }
  otomoSelf.status = status
  otomoSelf.statusNote =
    status === 'online' ? '待機中' : status === 'away' ? '離席中' : '通話中'
  res.json({ status: 'success', profile: buildOtomoPayload() })
})

app.get('/otomo/calls', (req, res) => {
  const limit = Number(req.query.limit)
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? limit : undefined
  const items = normalizedLimit
    ? otomoCallFeed.slice(0, normalizedLimit)
    : otomoCallFeed
  res.json({ items, total: otomoCallFeed.length })
})

app.get('/otomo/rewards', (_req, res) => {
  res.json(otomoRewardSummary)
})

app.get('/otomo/reviews/summary', (_req, res) => {
  res.json(otomoReviewSummary)
})

app.get('/otomo/reviews', (req, res) => {
  const ratingFilter = parseRatingFilter(req.query.rating)
  const commentFilter = normalizeCommentFilter(req.query.comment)
  const limit = Number(req.query.limit)
  const sort = req.query.sort === 'duration_desc' ? 'duration_desc' : 'latest'

  let items = otomoReviews.map((review) => buildReviewResponse(review))
  if (ratingFilter) {
    items = items.filter((item) => ratingFilter.includes(item.rating))
  }
  if (commentFilter === 'with') {
    items = items.filter((item) => item.hasComment)
  } else if (commentFilter === 'without') {
    items = items.filter((item) => !item.hasComment)
  }

  items = items.sort((a, b) => {
    if (sort === 'duration_desc') {
      return (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? limit : items.length
  res.json({ items: items.slice(0, normalizedLimit), total: items.length })
})

app.get('/otomo/alerts', (_req, res) => {
  res.json({ items: otomoReviewAlerts })
})

app.get('/otomo/schedule', (_req, res) => {
  respondWithSchedule(res)
})

app.put('/otomo/schedule', (req, res) => {
  const { weekly, exceptions, autoStatusEnabled, timezone } = req.body || {}
  if (!Array.isArray(weekly)) {
    return res
      .status(400)
      .json({ error: '週次スケジュールを指定してください。' })
  }

  try {
    otomoSchedule.weekly = normalizeScheduleWeekly(weekly)
    if (Array.isArray(exceptions)) {
      otomoSchedule.exceptions = normalizeScheduleExceptions(exceptions)
    }
    if (typeof autoStatusEnabled === 'boolean') {
      otomoSchedule.autoStatusEnabled = autoStatusEnabled
    }
    if (typeof timezone === 'string' && timezone.trim().length > 0) {
      otomoSchedule.timezone = timezone.trim()
    }
    otomoSchedule.lastUpdatedAt = now()
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.json({ status: 'saved', schedule: serializeSchedule() })
})

app.get('/otomo/stats/summary', (req, res) => {
  const range = normalizeStatsRange(req.query.range)
  res.json({ range, summary: otomoStatsSummaryByRange[range] })
})

app.get('/otomo/stats/daily', (req, res) => {
  const range = normalizeStatsRange(req.query.range)
  res.json({ range, items: pickDailyStatsByRange(range) })
})

app.get('/otomo/stats/hourly', (req, res) => {
  const range = normalizeStatsRange(req.query.range)
  res.json({ range, items: otomoStatsHourly })
})

app.get('/otomo/stats/calls', (req, res) => {
  const limit = Number(req.query.limit)
  const range = normalizeStatsRange(req.query.range)
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? limit : otomoStatsCalls.length
  res.json({ range, items: otomoStatsCalls.slice(0, normalizedLimit) })
})

app.get('/otomo/stats/repeat', (req, res) => {
  const range = normalizeStatsRange(req.query.range)
  res.json({ range, stats: otomoStatsRepeat })
})

app.get('/otomo/incoming-call', (_req, res) => {
  const call = getActiveIncomingCall()
  res.json({ call, status: call ? 'ringing' : 'idle' })
})

app.post('/otomo/incoming-call/accept', (_req, res) => {
  const call = getActiveIncomingCall()
  if (!call) {
    return res
      .status(409)
      .json({ error: '現在着信はありません', reason: 'call_ended' })
  }
  otomoIncomingCall.current = null
  otomoLastCallSummary.current = null
  otomoSelf.status = 'busy'
  otomoSelf.statusNote = '通話中'
  otomoActiveCall.current = buildActiveCallState(call)
  res.json({ status: 'accepted', callId: call.callId })
})

app.post('/otomo/incoming-call/reject', (req, res) => {
  const call = getActiveIncomingCall()
  if (!call) {
    return res
      .status(409)
      .json({ error: '現在着信はありません', reason: 'call_ended' })
  }
  const { reason = 'busy' } = req.body || {}
  otomoIncomingCall.current = null
  otomoSelf.status = 'online'
  otomoSelf.statusNote = '待機中'
  res.json({ status: 'rejected', callId: call.callId, reason })
})

app.get('/otomo/active-call', (_req, res) => {
  const call = getActiveOtomoCall()
  res.json({ call, status: call ? 'in_call' : 'idle' })
})

app.post('/otomo/active-call/end', (req, res) => {
  const call = getActiveOtomoCall()
  if (!call) {
    return res
      .status(409)
      .json({ error: '現在通話中ではありません', reason: 'call_not_found' })
  }
  const { reason = 'otomo_end' } = req.body || {}
  otomoActiveCall.current = null
  otomoSelf.status = 'online'
  otomoSelf.statusNote = '待機中'
  const endedAt = now()
  const startedAtMs = new Date(call.startedAt).getTime()
  const durationSeconds = Number.isFinite(startedAtMs)
    ? Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))
    : 0
  const summary = buildCallSummaryPayload({
    call,
    reason,
    endedAt,
    durationSeconds,
  })
  otomoLastCallSummary.current = summary
  res.json({
    status: 'ended',
    callId: call.callId,
    reason,
    endedAt,
    durationSeconds,
    summary,
  })
})

app.get('/otomo/call-summary', (_req, res) => {
  res.json({ summary: otomoLastCallSummary.current })
})

app.put('/otomo/call-summary/memo', (req, res) => {
  const { callId, memo = '' } = req.body || {}
  const summary = otomoLastCallSummary.current
  if (!summary || summary.callId !== callId) {
    return res.status(404).json({ error: '保存対象の通話が見つかりません。' })
  }
  if (typeof memo !== 'string') {
    return res.status(400).json({ error: 'memo は文字列で指定してください。' })
  }
  summary.memo = memo.slice(0, 2000)
  otomoLastCallSummary.current = summary
  res.json({ status: 'saved', summary })
})

app.get('/otomo', (req, res) => {
  const { status, tag } = req.query
  let filtered = [...otomoList]
  if (status) {
    filtered = filtered.filter((o) => o.status === status)
  }
  if (tag) {
    filtered = filtered.filter((o) => o.tags.includes(tag))
  }
  res.json({ items: filtered, total: filtered.length })
})

app.get('/otomo/:id', (req, res) => {
  const target = otomoList.find((o) => o.id === req.params.id)
  if (!target) {
    return res.status(404).json({ error: 'Otomo not found' })
  }
  res.json(target)
})

app.get('/calls', (_req, res) => {
  res.json({ items: calls, total: calls.length })
})

app.get('/calls/history', (req, res) => {
  const limit = Number(req.query.limit)
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? limit : undefined
  const items = normalizedLimit
    ? callHistory.slice(0, normalizedLimit)
    : callHistory
  res.json(items)
})

app.get('/calls/:id', (req, res) => {
  const target = calls.find((c) => c.id === req.params.id)
  if (!target) {
    return res.status(404).json({ error: 'Call not found' })
  }
  res.json(target)
})

app.post('/calls/debug/end', (req, res) => {
  const { callId, reason = 'manual' } = req.body || {}
  if (!callId) {
    return res.status(400).json({ error: 'callId is required' })
  }

  res.status(202).json({
    message: 'Debug end accepted',
    callId,
    reason,
    acceptedAt: now(),
  })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` })
})

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? '画像サイズは5MB以内にしてください'
        : err.message
    return res.status(400).json({ error: message })
  }

  console.error(err)
  res.status(500).json({ error: 'Unexpected mock server error' })
})

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`)
})
