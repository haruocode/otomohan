type RawOtomoStatus = 'available' | 'on_call' | 'away' | 'offline'
export type OtomoPresenceStatus = 'online' | 'busy' | 'away' | 'offline'

export interface OtomoProfile {
  id: string
  name: string
  avatarUrl: string
  status: OtomoPresenceStatus
  rating: number
  reviewCount?: number
  bio: string
  tags?: Array<string>
  pricePerMinute: number
}

export interface OtomoReview {
  user: string
  rating: number
  comment: string
  date: string
}

export interface OtomoDetail extends OtomoProfile {
  intro?: string
  categories?: Array<string>
  activeHours?: string
  hobbies?: Array<string>
  reviews?: Array<OtomoReview>
}

export interface WalletBalance {
  balance: number
  currency: string
  updatedAt: string
}

export interface WalletPlan {
  id: string
  name: string
  amount: number
  price: number
  bonus?: number
}

export type WalletPaymentMethod = 'credit_card' | 'apple_pay' | 'paypay'

export interface WalletCardPayload {
  number: string
  exp: string
  cvc: string
  holder?: string
}

export interface WalletChargePayload {
  planId: string
  paymentMethod: WalletPaymentMethod
  card?: WalletCardPayload
}

export interface WalletChargeResponse {
  transactionId: string
  newBalance: WalletBalance
  purchasedPlan: WalletPlan
}

export interface WalletUsageEntry {
  id: string
  title: string
  description?: string
  direction: 'credit' | 'debit'
  amount: number
  occurredAt: string
  type?: string
}

export type CallStatus = 'connecting' | 'in_call' | 'finishing' | 'ended'
export type CallEndReason =
  | 'user_end'
  | 'otomo_end'
  | 'no_point'
  | 'network_lost'
  | 'timeout'
  | 'system_error'

export interface CallBillingUnit {
  unitIndex: number
  charged: number
  timestamp?: string
}

export interface CallPartner {
  id: string
  name: string
  avatarUrl: string
}

export interface CallSession {
  id: string
  status: CallStatus
  partner: CallPartner
  pricePerMinute: number
  startedAt: string
  lastBilledAt?: string
  nextBillingAt?: string
  balance: number
  endedAt?: string
  totalSeconds?: number
  totalCharged?: number
  unitCount?: number
  reason?: CallEndReason
  billingUnits?: Array<CallBillingUnit>
}

export interface CallHistoryEntry {
  callId: string
  otomo: CallPartner
  startedAt: number
  endedAt?: number
  durationSec: number
  totalCharged: number
}

interface RawOtomoResponseItem {
  id: string
  displayName: string
  rating: number
  reviewCount?: number
  pricePerMinute: number
  tags?: Array<string>
  status: RawOtomoStatus
  bio: string
  avatarUrl: string
}

interface RawOtomoResponse {
  items: Array<RawOtomoResponseItem>
  total: number
}

interface RawOtomoReview {
  user: string
  rating: number
  comment: string
  date: string
}

interface RawOtomoDetail extends RawOtomoResponseItem {
  intro?: string
  categories?: Array<string>
  activeHours?: string
  hobbies?: Array<string>
  reviews?: Array<RawOtomoReview>
  pricePerMin?: number
}

interface WalletBalanceResponse extends WalletBalance {}
interface WalletPlansResponse {
  plans: Array<WalletPlan>
}
interface WalletUsageResponse {
  items: Array<WalletUsageEntry>
  total: number
}
interface RawCallSession extends CallSession {}

const RAW_TO_PRESENT_STATUS: Record<RawOtomoStatus, OtomoPresenceStatus> = {
  available: 'online',
  on_call: 'busy',
  away: 'away',
  offline: 'offline',
}

const PRESENT_TO_RAW_STATUS: Partial<
  Record<OtomoPresenceStatus, RawOtomoStatus>
> = {
  online: 'available',
  busy: 'on_call',
  away: 'away',
  offline: 'offline',
}

const DEFAULT_API_PORT = 5050

function computeApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const current = new URL(window.location.origin)
    current.port = String(DEFAULT_API_PORT)
    return current.origin
  }

  return `http://localhost:${DEFAULT_API_PORT}`
}

const API_BASE_URL = computeApiBaseUrl()

const normalizePrice = (item: {
  pricePerMinute?: number
  pricePerMin?: number
}) => item.pricePerMinute ?? item.pricePerMin ?? 0

const mapRawOtomo = (item: RawOtomoResponseItem): OtomoProfile => ({
  id: item.id,
  name: item.displayName,
  avatarUrl: item.avatarUrl,
  status: RAW_TO_PRESENT_STATUS[item.status],
  rating: item.rating,
  reviewCount: item.reviewCount,
  bio: item.bio,
  tags: item.tags,
  pricePerMinute: normalizePrice(item),
})

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `API error ${response.status}: ${response.statusText} - ${errorBody}`,
    )
  }

  return response.json() as Promise<T>
}

export async function fetchOtomoProfiles(
  filter?: OtomoPresenceStatus,
): Promise<Array<OtomoProfile>> {
  const searchParams = new URLSearchParams()
  if (filter) {
    const raw = PRESENT_TO_RAW_STATUS[filter]
    if (raw) {
      searchParams.append('status', raw)
    }
  }

  const query = searchParams.toString()
  const data = await http<RawOtomoResponse>(`/otomo${query ? `?${query}` : ''}`)

  return data.items.map((item) => mapRawOtomo(item))
}

export async function fetchWalletBalance(): Promise<WalletBalanceResponse> {
  return http<WalletBalanceResponse>('/wallet/balance')
}

export async function fetchWalletPlans(): Promise<Array<WalletPlan>> {
  const data = await http<WalletPlansResponse>('/wallet/plans')
  return data.plans
}

export async function fetchWalletUsage(
  limit?: number,
): Promise<Array<WalletUsageEntry>> {
  const searchParams = new URLSearchParams()
  if (limit && Number.isFinite(limit)) {
    searchParams.append('limit', `${limit}`)
  }
  const query = searchParams.toString()
  const endpoint = `/wallet/usage${query ? `?${query}` : ''}`
  const data = await http<WalletUsageResponse>(endpoint)
  return data.items
}

export async function chargeWalletPlan(
  payload: WalletChargePayload,
): Promise<WalletChargeResponse> {
  return http<WalletChargeResponse>('/wallet/charge', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchOtomoDetail(otomoId: string): Promise<OtomoDetail> {
  const data = await http<RawOtomoDetail>(`/otomo/${otomoId}`)
  const base = mapRawOtomo(data)

  return {
    ...base,
    intro: data.intro ?? data.bio,
    categories: data.categories,
    activeHours: data.activeHours,
    hobbies: data.hobbies,
    reviews: data.reviews?.map((review) => ({
      user: review.user,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
    })),
  }
}

export async function fetchCallSession(callId: string): Promise<CallSession> {
  return http<RawCallSession>(`/calls/${callId}`)
}

export async function fetchCallHistory(): Promise<Array<CallHistoryEntry>> {
  return http<Array<CallHistoryEntry>>('/calls/history')
}
