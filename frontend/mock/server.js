import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { v4 as uuid } from 'uuid'

import {
  now,
  walletBalance,
  walletPlans,
  otomoList,
  calls,
} from './data/mockData.js'

const app = express()
const PORT = process.env.PORT || 5050
const artificialDelayMs = Number(process.env.MOCK_DELAY_MS || 0)

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
  console.error(err)
  res.status(500).json({ error: 'Unexpected mock server error' })
})

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`)
})
