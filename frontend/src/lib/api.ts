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

export interface IncomingCallUser {
  id: string
  name: string
  avatarUrl: string
  profileLink?: string
}

export interface IncomingCall {
  callId: string
  user: IncomingCallUser
  ratePerMinute: number
  requestedAt: string
  expiresAt: string
  note?: string
  badges?: Array<string>
}

export type OtomoConnectionQuality =
  | 'excellent'
  | 'good'
  | 'unstable'
  | 'critical'

export type OtomoRemoteMicState = 'on' | 'muted'

export type OtomoCallEventLevel = 'info' | 'warning' | 'error'

export interface OtomoCallEvent {
  id: string
  level: OtomoCallEventLevel
  message: string
  occurredAt: string
}

export interface OtomoActiveCall {
  callId: string
  user: IncomingCallUser
  startedAt: string
  connectionQuality: OtomoConnectionQuality
  voiceStatus: string
  transport: string
  remoteMicState: OtomoRemoteMicState
  latencyMs?: number
  bitrateKbps?: number
  events?: Array<OtomoCallEvent>
  ratePerMinute?: number
}

export interface OtomoCallRewardSummary {
  earnedPoints: number
  totalPoints: number
  ratePerMinute: number
}

export interface OtomoCallSummary {
  callId: string
  user: IncomingCallUser
  reason: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  billedMinutes: number
  reward: OtomoCallRewardSummary
  memo?: string
}

export type OtomoStatsRange = 'today' | 'week' | 'month' | 'all'

export interface OtomoStatsSummaryTrend {
  revenue: number
  minutes: number
  repeatRate: number
}

export interface OtomoStatsSummaryPayload {
  totalRevenue: number
  totalMinutes: number
  averageMinutes: number
  repeatRate: number
  totalCalls: number
  trend: OtomoStatsSummaryTrend
}

export interface OtomoStatsSummaryResult {
  range: OtomoStatsRange
  summary: OtomoStatsSummaryPayload
}

export interface OtomoStatsDailyPoint {
  date: string
  points: number
  minutes: number
  callCount: number
}

export interface OtomoStatsHourlyPoint {
  hour: number
  callCount: number
}

export interface OtomoStatsCallEntry {
  callId: string
  userName: string
  durationMinutes: number
  earnedPoints: number
  startedAt: string
}

export interface OtomoStatsRepeatStats {
  repeatUsers: number
  newUsers: number
  topUser: {
    name: string
    totalMinutes: number
    totalCalls: number
  }
}

export interface OtomoRecentCall {
  callId: string
  userName: string
  startedAt: string
  durationMinutes: number
}

export interface OtomoRewardSummary {
  todayPoints: number
  totalPoints: number
  weekPoints?: number
  pendingPoints?: number
  lastUpdatedAt?: string
}

export interface OtomoDashboardProfile {
  id: string
  name: string
  avatarUrl: string
  status: OtomoPresenceStatus
  bio?: string
  specialties?: Array<string>
  rating?: number
  reviewCount?: number
  streakDays?: number
  availabilityMessage?: string
  statusNote?: string
  notifications?: number
  todayPoints: number
  totalPoints: number
  rewardSummary: OtomoRewardSummary
  recentCalls: Array<OtomoRecentCall>
}

export interface CurrentUserProfile {
  id: string
  name: string
  email: string
  avatarUrl: string
  intro?: string | null
  balance: number
  latestCall?: {
    callId: string
    otomoName: string
    durationSec: number
  } | null
}

export interface UpdateUserProfilePayload {
  name: string
  intro?: string | null
}

interface UpdateUserProfileResponse {
  status: string
  user: CurrentUserProfile
}

interface UpdateUserAvatarResponse {
  status: string
  avatarUrl: string
}

interface UpdateOtomoStatusResponse {
  status: string
  profile: OtomoDashboardProfile
}

interface IncomingCallResponse {
  call: IncomingCall | null
  status: 'ringing' | 'idle'
}

interface OtomoActiveCallResponse {
  call: OtomoActiveCall | null
  status: 'in_call' | 'idle'
}

interface EndOtomoCallResponse {
  status: string
  callId: string
  reason: string
  endedAt: string
  durationSeconds: number
  summary: OtomoCallSummary
}

interface OtomoCallSummaryResponse {
  summary: OtomoCallSummary | null
}

interface SaveOtomoCallMemoResponse {
  status: string
  summary: OtomoCallSummary
}

interface OtomoStatsSummaryResponse extends OtomoStatsSummaryResult {}

interface OtomoStatsDailyResponse {
  range: OtomoStatsRange
  items: Array<OtomoStatsDailyPoint>
}

interface OtomoStatsHourlyResponse {
  range: OtomoStatsRange
  items: Array<OtomoStatsHourlyPoint>
}

interface OtomoStatsCallsResponse {
  range: OtomoStatsRange
  items: Array<OtomoStatsCallEntry>
}

interface OtomoStatsRepeatResponse {
  range: OtomoStatsRange
  stats: OtomoStatsRepeatStats
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

const buildRangeQuery = (range?: OtomoStatsRange) => {
  if (!range) return ''
  const params = new URLSearchParams()
  params.set('range', range)
  const query = params.toString()
  return query ? `?${query}` : ''
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

export async function fetchCallHistory(
  limit?: number,
): Promise<Array<CallHistoryEntry>> {
  const searchParams = new URLSearchParams()
  if (limit && Number.isFinite(limit)) {
    searchParams.append('limit', `${limit}`)
  }
  const query = searchParams.toString()
  return http<Array<CallHistoryEntry>>(
    `/calls/history${query ? `?${query}` : ''}`,
  )
}

export async function fetchCurrentUser(): Promise<CurrentUserProfile> {
  return http<CurrentUserProfile>('/user/me')
}

export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
): Promise<CurrentUserProfile> {
  const response = await http<UpdateUserProfileResponse>('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return response.user
}

export async function uploadUserAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(`${API_BASE_URL}/user/avatar`, {
    method: 'PUT',
    body: formData,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Avatar upload failed ${response.status}: ${response.statusText} - ${body}`,
    )
  }

  const data = (await response.json()) as UpdateUserAvatarResponse
  return data.avatarUrl
}

export async function fetchOtomoSelf(): Promise<OtomoDashboardProfile> {
  return http<OtomoDashboardProfile>('/otomo/me')
}

export async function updateOtomoStatus(
  status: OtomoPresenceStatus,
): Promise<OtomoDashboardProfile> {
  const response = await http<UpdateOtomoStatusResponse>('/otomo/status', {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
  return response.profile
}

export async function fetchOtomoCalls(
  limit?: number,
): Promise<Array<OtomoRecentCall>> {
  const searchParams = new URLSearchParams()
  if (limit && Number.isFinite(limit)) {
    searchParams.append('limit', `${limit}`)
  }
  const query = searchParams.toString()
  const endpoint = `/otomo/calls${query ? `?${query}` : ''}`
  const data = await http<{ items: Array<OtomoRecentCall> }>(endpoint)
  return data.items
}

export async function fetchOtomoRewards(): Promise<OtomoRewardSummary> {
  return http<OtomoRewardSummary>('/otomo/rewards')
}

export async function fetchIncomingCall(): Promise<IncomingCallResponse> {
  return http<IncomingCallResponse>('/otomo/incoming-call')
}

export async function acceptIncomingCall(callId: string): Promise<void> {
  await http<{ status: string; callId: string }>(
    '/otomo/incoming-call/accept',
    {
      method: 'POST',
      body: JSON.stringify({ callId }),
    },
  )
}

export async function rejectIncomingCall(
  callId: string,
  reason: string = 'busy',
): Promise<void> {
  await http<{ status: string; callId: string; reason: string }>(
    '/otomo/incoming-call/reject',
    {
      method: 'POST',
      body: JSON.stringify({ callId, reason }),
    },
  )
}

export async function fetchOtomoActiveCall(): Promise<OtomoActiveCallResponse> {
  return http<OtomoActiveCallResponse>('/otomo/active-call')
}

export async function endOtomoActiveCall(
  reason: string = 'otomo_end',
): Promise<EndOtomoCallResponse> {
  return http<EndOtomoCallResponse>('/otomo/active-call/end', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function fetchOtomoCallSummary(): Promise<OtomoCallSummaryResponse> {
  return http<OtomoCallSummaryResponse>('/otomo/call-summary')
}

export async function updateOtomoCallMemo(
  callId: string,
  memo: string,
): Promise<OtomoCallSummary> {
  const response = await http<SaveOtomoCallMemoResponse>(
    '/otomo/call-summary/memo',
    {
      method: 'PUT',
      body: JSON.stringify({ callId, memo }),
    },
  )
  return response.summary
}

export async function fetchOtomoStatsSummary(
  range?: OtomoStatsRange,
): Promise<OtomoStatsSummaryResult> {
  const query = buildRangeQuery(range)
  return http<OtomoStatsSummaryResponse>(`/otomo/stats/summary${query}`)
}

export async function fetchOtomoStatsDaily(
  range?: OtomoStatsRange,
): Promise<Array<OtomoStatsDailyPoint>> {
  const query = buildRangeQuery(range)
  const response = await http<OtomoStatsDailyResponse>(
    `/otomo/stats/daily${query}`,
  )
  return response.items
}

export async function fetchOtomoStatsHourly(
  range?: OtomoStatsRange,
): Promise<Array<OtomoStatsHourlyPoint>> {
  const query = buildRangeQuery(range)
  const response = await http<OtomoStatsHourlyResponse>(
    `/otomo/stats/hourly${query}`,
  )
  return response.items
}

export async function fetchOtomoStatsCalls({
  range,
  limit,
}: {
  range?: OtomoStatsRange
  limit?: number
} = {}): Promise<Array<OtomoStatsCallEntry>> {
  const params = new URLSearchParams()
  if (range) params.set('range', range)
  if (limit && Number.isFinite(limit)) params.set('limit', `${limit}`)
  const query = params.toString()
  const endpoint = `/otomo/stats/calls${query ? `?${query}` : ''}`
  const response = await http<OtomoStatsCallsResponse>(endpoint)
  return response.items
}

export async function fetchOtomoStatsRepeat(
  range?: OtomoStatsRange,
): Promise<OtomoStatsRepeatStats> {
  const query = buildRangeQuery(range)
  const response = await http<OtomoStatsRepeatResponse>(
    `/otomo/stats/repeat${query}`,
  )
  return response.stats
}
