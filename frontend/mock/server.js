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
  otomoSelf,
  otomoRewardSummary,
  otomoCallFeed,
  otomoIncomingCall,
  otomoActiveCall,
} from './data/mockData.js'

const app = express()
const PORT = process.env.PORT || 5050
const artificialDelayMs = Number(process.env.MOCK_DELAY_MS || 0)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})
const MAX_NAME_LENGTH = 32
const MAX_INTRO_LENGTH = 300

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
  events: [
    {
      id: `evt-${Date.now()}`,
      level: 'info',
      message: '通話を開始しました',
      occurredAt: now(),
    },
  ],
})

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
    return res.status(400).json({ error: '名前を入力してください。' })
  }

  const trimmedName = name.trim().slice(0, MAX_NAME_LENGTH)
  userProfile.name = trimmedName

  if (typeof intro === 'string') {
    userProfile.intro = intro.slice(0, MAX_INTRO_LENGTH)
  } else if (intro === null) {
    userProfile.intro = ''
  }

  res.json({ status: 'success', user: buildUserPayload() })
})

app.put('/user/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '画像ファイルが必要です。' })
  }

  const base64 = req.file.buffer.toString('base64')
  userProfile.avatarUrl = `data:${req.file.mimetype};base64,${base64}`

  res.json({ status: 'success', avatarUrl: userProfile.avatarUrl })
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
  res.json({
    status: 'ended',
    callId: call.callId,
    reason,
    endedAt,
    durationSeconds,
  })
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
        ? '画像サイズは5MB以下にしてください。'
        : err.message
    return res.status(400).json({ error: message })
  }

  console.error(err)
  res.status(500).json({ error: 'Unexpected mock server error' })
})

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`)
})
