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

export interface OtomoScheduleRange {
  id: string
  start: string
  end: string
}

export interface OtomoScheduleDay {
  day: number
  label: string
  fullLabel?: string
  isDayOff: boolean
  ranges: Array<OtomoScheduleRange>
}

export type OtomoScheduleExceptionType = 'off' | 'partial'

export interface OtomoScheduleException {
  id: string
  date: string
  type: OtomoScheduleExceptionType
  start?: string
  end?: string
  note?: string
}

export interface OtomoSchedulePayload {
  weekly: Array<OtomoScheduleDay>
  exceptions: Array<OtomoScheduleException>
  autoStatusEnabled: boolean
  timezone: string
  lastUpdatedAt: string
}

export interface UpdateOtomoSchedulePayload {
  weekly: Array<{
    day: number
    isDayOff?: boolean
    ranges: Array<{
      id?: string
      start: string
      end: string
    }>
  }>
  exceptions?: Array<{
    id?: string
    date: string
    type?: OtomoScheduleExceptionType
    start?: string
    end?: string
    note?: string
  }>
  autoStatusEnabled?: boolean
  timezone?: string
}

export interface OtomoReviewDistributionEntry {
  rating: number
  percentage: number
  count: number
}

export interface OtomoReviewSummary {
  averageRating: number
  totalReviews: number
  totalCalls: number
  repeatRate?: number
  distribution: Array<OtomoReviewDistributionEntry>
  lastUpdatedAt?: string
}

export interface OtomoReviewEntry {
  id: string
  rating: number
  comment?: string
  createdAt: string
  durationSeconds?: number
  durationMinutes: number
  maskedName: string
  hasComment: boolean
}

export type OtomoReviewFilterComment = 'with' | 'without'

export interface OtomoReviewAlert {
  id: string
  level: 'info' | 'warning'
  message: string
  issuedAt: string
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

interface OtomoScheduleResponse {
  schedule: OtomoSchedulePayload
}

interface UpdateOtomoScheduleResponse {
  status: string
  schedule: OtomoSchedulePayload
}

type OtomoReviewSummaryResponse = OtomoReviewSummary

interface OtomoReviewsResponse {
  items: Array<OtomoReviewEntry>
  total: number
}

interface OtomoAlertsResponse {
  items: Array<OtomoReviewAlert>
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

export async function fetchOtomoSchedule(): Promise<OtomoSchedulePayload> {
  const response = await http<OtomoScheduleResponse>('/otomo/schedule')
  return response.schedule
}

export async function updateOtomoSchedule(
  payload: UpdateOtomoSchedulePayload,
): Promise<OtomoSchedulePayload> {
  const response = await http<UpdateOtomoScheduleResponse>('/otomo/schedule', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return response.schedule
}

export async function fetchOtomoReviewSummary(): Promise<OtomoReviewSummary> {
  return http<OtomoReviewSummaryResponse>('/otomo/reviews/summary')
}

export interface FetchOtomoReviewsParams {
  ratings?: Array<number> | number
  comment?: OtomoReviewFilterComment
  limit?: number
  sort?: 'latest' | 'duration_desc'
}

export async function fetchOtomoReviews(
  params: FetchOtomoReviewsParams = {},
): Promise<Array<OtomoReviewEntry>> {
  const searchParams = new URLSearchParams()
  if (typeof params.ratings === 'number') {
    searchParams.set('rating', `${params.ratings}`)
  } else if (Array.isArray(params.ratings) && params.ratings.length) {
    searchParams.set('rating', params.ratings.join(','))
  }
  if (params.comment) {
    searchParams.set('comment', params.comment)
  }
  if (params.limit && Number.isFinite(params.limit)) {
    searchParams.set('limit', `${params.limit}`)
  }
  if (params.sort === 'duration_desc') {
    searchParams.set('sort', 'duration_desc')
  }
  const query = searchParams.toString()
  const endpoint = `/otomo/reviews${query ? `?${query}` : ''}`
  const response = await http<OtomoReviewsResponse>(endpoint)
  return response.items
}

export async function fetchOtomoReviewAlerts(): Promise<
  Array<OtomoReviewAlert>
> {
  const response = await http<OtomoAlertsResponse>('/otomo/alerts')
  return response.items
}

export interface AdminLoginPayload {
  email: string
  password: string
}

export interface AdminLoginResponse {
  token: string
  mfaRequired: boolean
  mfaSessionId?: string
}

export interface VerifyAdminMfaPayload {
  sessionId: string
  code: string
}

const ADMIN_LOGIN_DELAY_MS = 750
const ADMIN_MFA_DELAY_MS = 550
const ADMIN_DEMO_PASSWORD = 'otomohan-admin'
const ADMIN_DEMO_TOKEN = 'mock-admin-token'
const ADMIN_DEMO_MFA_CODE = '123456'

const waitForMock = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

export async function adminLogin(
  payload: AdminLoginPayload,
): Promise<AdminLoginResponse> {
  await waitForMock(ADMIN_LOGIN_DELAY_MS)

  const email = payload.email.trim().toLowerCase()
  const password = payload.password.trim()

  if (!email || !password || !email.includes('@')) {
    throw new Error('メールアドレスまたはパスワードが違います')
  }

  if (password !== ADMIN_DEMO_PASSWORD) {
    throw new Error('メールアドレスまたはパスワードが違います')
  }

  const requiresMfa = email.includes('+mfa')

  return {
    token: ADMIN_DEMO_TOKEN,
    mfaRequired: requiresMfa,
    mfaSessionId: requiresMfa
      ? `mfa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : undefined,
  }
}

export async function verifyAdminMfaCode(
  payload: VerifyAdminMfaPayload,
): Promise<AdminLoginResponse> {
  await waitForMock(ADMIN_MFA_DELAY_MS)

  if (!payload.sessionId) {
    throw new Error('MFAセッションが無効です。再度ログインしてください')
  }

  if (payload.code.trim() !== ADMIN_DEMO_MFA_CODE) {
    throw new Error('認証コードが違います')
  }

  return {
    token: ADMIN_DEMO_TOKEN,
    mfaRequired: false,
  }
}

export type AdminUserStatus = 'active' | 'suspended' | 'retired'

export type AdminReportFilter = 'none' | 'onePlus' | 'many'

export interface AdminUserSummary {
  id: string
  name: string
  email: string
  registeredAt: string
  status: AdminUserStatus
  reportCount: number
  points: number
  lastLoginAt: string
}

export interface AdminUserPointSummary {
  balance: number
  purchased: number
  used: number
}

export interface AdminUserCallHistoryEntry {
  callId: string
  durationMinutes: number
  otomoName: string
  occurredAt: string
}

export interface AdminUserReviewEntry {
  id: string
  rating: number
  comment: string
  createdAt: string
}

export interface AdminUserReportEntry {
  id: string
  otomoId: string
  message: string
  createdAt: string
}

export interface AdminUserDetail {
  id: string
  name: string
  email: string
  status: AdminUserStatus
  registeredAt: string
  lastLoginAt: string
  phone?: string
  device?: string
  reportCount: number
  pointSummary: AdminUserPointSummary
  callHistory: Array<AdminUserCallHistoryEntry>
  reviewHistory: Array<AdminUserReviewEntry>
  reportHistory: Array<AdminUserReportEntry>
}

export interface AdminUserListFilters {
  userId?: string
  email?: string
  name?: string
  status?: AdminUserStatus
  registeredFrom?: string
  registeredTo?: string
  reportFilter?: AdminReportFilter
  sortBy?: 'registeredAt' | 'lastLoginAt' | 'points'
  sortOrder?: 'asc' | 'desc'
}

const ADMIN_USERS_DELAY_MS = 420

const initialAdminUsers: Array<AdminUserDetail> = [
  {
    id: 'user_001',
    name: '佐藤 太郎',
    email: 'taro@example.com',
    phone: '080-1234-5678',
    device: 'iOS / Safari',
    status: 'active',
    registeredAt: '2024-12-10T03:00:00Z',
    lastLoginAt: '2025-01-29T10:45:00Z',
    reportCount: 0,
    pointSummary: {
      balance: 720,
      purchased: 4800,
      used: 4100,
    },
    callHistory: [
      {
        callId: 'call_123',
        durationMinutes: 12,
        otomoName: 'さくら',
        occurredAt: '2025-01-30T12:00:00Z',
      },
      {
        callId: 'call_118',
        durationMinutes: 7,
        otomoName: 'あやか',
        occurredAt: '2025-01-28T09:00:00Z',
      },
    ],
    reviewHistory: [
      {
        id: 'rev_901',
        rating: 5,
        comment: 'とても話しやすかったです！',
        createdAt: '2025-01-20T08:00:00Z',
      },
    ],
    reportHistory: [],
  },
  {
    id: 'user_002',
    name: '山田 花子',
    email: 'hanako@example.com',
    phone: '080-2345-6789',
    device: 'Android / Chrome',
    status: 'suspended',
    registeredAt: '2024-11-01T05:00:00Z',
    lastLoginAt: '2025-01-15T15:20:00Z',
    reportCount: 3,
    pointSummary: {
      balance: 120,
      purchased: 5200,
      used: 5080,
    },
    callHistory: [
      {
        callId: 'call_099',
        durationMinutes: 20,
        otomoName: 'ミホ',
        occurredAt: '2025-01-10T14:00:00Z',
      },
    ],
    reviewHistory: [
      {
        id: 'rev_845',
        rating: 3,
        comment: '普通でした',
        createdAt: '2025-01-08T05:00:00Z',
      },
    ],
    reportHistory: [
      {
        id: 'rep_500',
        otomoId: 'otomo_05',
        message: '不適切な言動',
        createdAt: '2025-01-12T09:30:00Z',
      },
      {
        id: 'rep_501',
        otomoId: 'otomo_08',
        message: '無断通話終了',
        createdAt: '2025-01-18T11:45:00Z',
      },
    ],
  },
  {
    id: 'user_003',
    name: '李 美咲',
    email: 'misaki@example.com',
    phone: '070-1111-9999',
    device: 'iOS / App',
    status: 'active',
    registeredAt: '2025-01-05T01:00:00Z',
    lastLoginAt: '2025-01-30T02:15:00Z',
    reportCount: 1,
    pointSummary: {
      balance: 1650,
      purchased: 6000,
      used: 4350,
    },
    callHistory: [
      {
        callId: 'call_130',
        durationMinutes: 30,
        otomoName: 'レン',
        occurredAt: '2025-01-29T13:00:00Z',
      },
      {
        callId: 'call_125',
        durationMinutes: 18,
        otomoName: 'きよみ',
        occurredAt: '2025-01-27T21:00:00Z',
      },
    ],
    reviewHistory: [
      {
        id: 'rev_870',
        rating: 4,
        comment: '丁寧で安心しました',
        createdAt: '2025-01-25T07:30:00Z',
      },
      {
        id: 'rev_871',
        rating: 5,
        comment: 'また指名したいです',
        createdAt: '2025-01-27T08:40:00Z',
      },
    ],
    reportHistory: [
      {
        id: 'rep_600',
        otomoId: 'otomo_02',
        message: '態度が冷たい',
        createdAt: '2025-01-26T18:00:00Z',
      },
    ],
  },
  {
    id: 'user_004',
    name: '田中 聡',
    email: 'satoshi@example.com',
    phone: '090-8888-7777',
    device: 'Desktop / Chrome',
    status: 'retired',
    registeredAt: '2024-09-18T04:00:00Z',
    lastLoginAt: '2024-12-30T19:00:00Z',
    reportCount: 0,
    pointSummary: {
      balance: 0,
      purchased: 3000,
      used: 3000,
    },
    callHistory: [
      {
        callId: 'call_080',
        durationMinutes: 9,
        otomoName: 'ルリ',
        occurredAt: '2024-12-25T20:00:00Z',
      },
    ],
    reviewHistory: [],
    reportHistory: [],
  },
  {
    id: 'user_005',
    name: 'Alex Chen',
    email: 'alex@example.com',
    phone: '080-7654-2222',
    device: 'Android / Chrome',
    status: 'active',
    registeredAt: '2025-01-15T06:00:00Z',
    lastLoginAt: '2025-01-30T05:30:00Z',
    reportCount: 2,
    pointSummary: {
      balance: 540,
      purchased: 4200,
      used: 3660,
    },
    callHistory: [
      {
        callId: 'call_140',
        durationMinutes: 14,
        otomoName: 'なぎさ',
        occurredAt: '2025-01-29T16:30:00Z',
      },
    ],
    reviewHistory: [
      {
        id: 'rev_900',
        rating: 2,
        comment: 'もう少し盛り上げてほしかった',
        createdAt: '2025-01-28T10:00:00Z',
      },
    ],
    reportHistory: [
      {
        id: 'rep_610',
        otomoId: 'otomo_07',
        message: '過度な個人情報の要求',
        createdAt: '2025-01-28T19:10:00Z',
      },
      {
        id: 'rep_611',
        otomoId: 'otomo_09',
        message: '録音の疑いあり',
        createdAt: '2025-01-29T11:05:00Z',
      },
    ],
  },
]
const cloneAdminUserDetail = (detail: AdminUserDetail): AdminUserDetail => ({
  ...detail,
  pointSummary: { ...detail.pointSummary },
  callHistory: detail.callHistory.map((entry) => ({ ...entry })),
  reviewHistory: detail.reviewHistory.map((entry) => ({ ...entry })),
  reportHistory: detail.reportHistory.map((entry) => ({ ...entry })),
})

const adminUsersDatabase: Array<AdminUserDetail> = initialAdminUsers.map(
  (user) => cloneAdminUserDetail(user),
)

const toAdminUserSummary = (user: AdminUserDetail): AdminUserSummary => ({
  id: user.id,
  name: user.name,
  email: user.email,
  registeredAt: user.registeredAt,
  status: user.status,
  reportCount: user.reportCount,
  points: user.pointSummary.balance,
  lastLoginAt: user.lastLoginAt,
})

const parseDate = (value: string) => new Date(value).getTime()

const matchesDateRange = (dateValue: string, from?: string, to?: string) => {
  const target = parseDate(dateValue)
  if (from) {
    const fromTime = parseDate(from)
    if (target < fromTime) return false
  }
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    if (target > toDate.getTime()) return false
  }
  return true
}

const applyReportFilter = (count: number, filter?: AdminReportFilter) => {
  if (!filter) return true
  if (filter === 'none') return count === 0
  if (filter === 'onePlus') return count >= 1
  return count >= 3
}

export async function fetchAdminUsers(
  filters: AdminUserListFilters = {},
): Promise<Array<AdminUserSummary>> {
  await waitForMock(ADMIN_USERS_DELAY_MS)

  let items = adminUsersDatabase.slice()

  if (filters.userId) {
    const keyword = filters.userId.toLowerCase()
    items = items.filter((user) => user.id.toLowerCase().includes(keyword))
  }
  if (filters.email) {
    const keyword = filters.email.toLowerCase()
    items = items.filter((user) => user.email.toLowerCase().includes(keyword))
  }
  if (filters.name) {
    const keyword = filters.name.toLowerCase()
    items = items.filter((user) => user.name.toLowerCase().includes(keyword))
  }
  if (filters.status) {
    items = items.filter((user) => user.status === filters.status)
  }
  if (filters.reportFilter) {
    items = items.filter((user) =>
      applyReportFilter(user.reportCount, filters.reportFilter),
    )
  }
  if (filters.registeredFrom || filters.registeredTo) {
    items = items.filter((user) =>
      matchesDateRange(
        user.registeredAt,
        filters.registeredFrom,
        filters.registeredTo,
      ),
    )
  }

  const sortBy = filters.sortBy ?? 'registeredAt'
  const sortOrder = filters.sortOrder ?? 'desc'

  items.sort((a, b) => {
    let valueA: number
    let valueB: number
    if (sortBy === 'points') {
      valueA = a.pointSummary.balance
      valueB = b.pointSummary.balance
    } else if (sortBy === 'lastLoginAt') {
      valueA = parseDate(a.lastLoginAt)
      valueB = parseDate(b.lastLoginAt)
    } else {
      valueA = parseDate(a.registeredAt)
      valueB = parseDate(b.registeredAt)
    }
    return sortOrder === 'desc' ? valueB - valueA : valueA - valueB
  })

  return items.map(toAdminUserSummary)
}

export async function fetchAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail> {
  await waitForMock(ADMIN_USERS_DELAY_MS)
  const user = adminUsersDatabase.find((candidate) => candidate.id === userId)
  if (!user) {
    throw new Error('ユーザーが見つかりません')
  }
  return cloneAdminUserDetail(user)
}

const findAdminUserOrThrow = (userId: string) => {
  const user = adminUsersDatabase.find((candidate) => candidate.id === userId)
  if (!user) {
    throw new Error('ユーザーが見つかりません')
  }
  return user
}

export async function suspendAdminUser(
  userId: string,
  reason: string,
): Promise<AdminUserDetail> {
  await waitForMock(ADMIN_USERS_DELAY_MS)
  const trimmedReason = reason.trim()
  if (!trimmedReason) {
    throw new Error('凍結理由を入力してください')
  }
  const user = findAdminUserOrThrow(userId)
  if (user.status === 'retired') {
    throw new Error('退会済みユーザーには操作できません')
  }
  user.status = 'suspended'
  user.reportHistory = [
    {
      id: `ops_${Date.now()}`,
      otomoId: 'ops-team',
      message: `【運営】${trimmedReason}`,
      createdAt: new Date().toISOString(),
    },
    ...user.reportHistory,
  ]
  return cloneAdminUserDetail(user)
}

export async function unsuspendAdminUser(
  userId: string,
): Promise<AdminUserDetail> {
  await waitForMock(ADMIN_USERS_DELAY_MS)
  const user = findAdminUserOrThrow(userId)
  if (user.status !== 'suspended') {
    return cloneAdminUserDetail(user)
  }
  user.status = 'active'
  return cloneAdminUserDetail(user)
}

export async function retireAdminUser(
  userId: string,
  note?: string,
): Promise<AdminUserDetail> {
  await waitForMock(ADMIN_USERS_DELAY_MS)
  const user = findAdminUserOrThrow(userId)
  user.status = 'retired'
  user.pointSummary = {
    ...user.pointSummary,
    balance: 0,
  }
  if (note && note.trim().length > 0) {
    user.reportHistory = [
      {
        id: `retire_${Date.now()}`,
        otomoId: 'ops-team',
        message: `【退会処理】${note.trim()}`,
        createdAt: new Date().toISOString(),
      },
      ...user.reportHistory,
    ]
  }
  return cloneAdminUserDetail(user)
}
