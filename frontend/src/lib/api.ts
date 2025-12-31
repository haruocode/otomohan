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

export type AdminOtomoStatus = 'underReview' | 'approved' | 'paused' | 'frozen'

export type AdminOtomoPresence = 'online' | 'offline'

export interface AdminOtomoSummary {
  id: string
  displayName: string
  email: string
  status: AdminOtomoStatus
  presence: AdminOtomoPresence
  averageRating: number
  reviewCount: number
  callCount: number
  callMinutes: number
  reportCount: number
  lastLoginAt: string
}

export interface AdminOtomoCallTrendPoint {
  label: string
  calls: number
  minutes: number
}

export interface AdminOtomoPopularSlot {
  label: string
  calls: number
  minutes: number
}

export interface AdminOtomoCallMetrics {
  totalCalls: number
  totalMinutes: number
  averageMinutes: number
  last30Days: Array<AdminOtomoCallTrendPoint>
  popularSlots: Array<AdminOtomoPopularSlot>
}

export interface AdminOtomoRevenueMetrics {
  lifetime: number
  monthly: Array<{ month: string; amount: number }>
  recentTrend: Array<{ label: string; amount: number }>
}

export interface AdminOtomoReviewStats {
  averageRating: number
  reviewCount: number
  distribution: Array<OtomoReviewDistributionEntry>
  highlight?: string
}

export interface AdminOtomoReviewEntry {
  id: string
  rating: number
  comment: string
  createdAt: string
  userId: string
}

export interface AdminOtomoReportEntry {
  id: string
  reporterId: string
  reason: string
  createdAt: string
  status: 'resolved' | 'investigating'
}

export interface AdminOtomoScheduleEntry {
  dayLabel: string
  slots: Array<{ start: string; end: string }>
  isDayOff?: boolean
}

export interface AdminOtomoAttachment {
  id: string
  type: 'document' | 'audio'
  label: string
  url: string
  note?: string
  confidential?: boolean
}

export interface AdminOtomoAuditLogEntry {
  id: string
  status: AdminOtomoStatus
  reason: string
  changedBy: string
  changedAt: string
}

export interface AdminOtomoDetail extends AdminOtomoSummary {
  legalName: string
  avatarUrl: string
  profileTitle?: string
  profileBio: string
  tags: Array<string>
  registeredAt: string
  callMetrics: AdminOtomoCallMetrics
  revenue: AdminOtomoRevenueMetrics
  reviewStats: AdminOtomoReviewStats
  recentReviews: Array<AdminOtomoReviewEntry>
  reports: Array<AdminOtomoReportEntry>
  schedule: Array<AdminOtomoScheduleEntry>
  attachments: Array<AdminOtomoAttachment>
  auditLog: Array<AdminOtomoAuditLogEntry>
}

export interface AdminOtomoListFilters {
  otomoId?: string
  name?: string
  email?: string
  status?: AdminOtomoStatus
  minRating?: number
  reportFilter?: AdminReportFilter
  presence?: AdminOtomoPresence
  callVolume?: 'low' | 'mid' | 'high'
  sortBy?: 'calls' | 'rating' | 'lastLogin'
  sortOrder?: 'asc' | 'desc'
}

const ADMIN_OTOMO_DELAY_MS = 520

const initialAdminOtomoDetails: Array<AdminOtomoDetail> = [
  {
    id: 'otomo_001',
    displayName: 'さくら',
    legalName: '桜井 美桜',
    email: 'sakura@otomohan.jp',
    status: 'approved',
    presence: 'online',
    averageRating: 4.6,
    reviewCount: 178,
    callCount: 350,
    callMinutes: 890,
    reportCount: 2,
    lastLoginAt: '2025-01-30T09:45:00Z',
    registeredAt: '2024-08-15T03:00:00Z',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    profileTitle: '夜の癒やしカウンセラー',
    profileBio:
      '深夜帯に寄り添う傾聴スタイルが強み。静かなトーンとゆっくりとした相槌で、安心して話せる時間を提供します。',
    tags: ['傾聴', '深夜枠', 'やさしい声'],
    callMetrics: {
      totalCalls: 350,
      totalMinutes: 890,
      averageMinutes: 8.4,
      last30Days: [
        { label: '01/02', calls: 12, minutes: 96 },
        { label: '01/05', calls: 15, minutes: 110 },
        { label: '01/08', calls: 9, minutes: 70 },
        { label: '01/11', calls: 14, minutes: 120 },
        { label: '01/14', calls: 13, minutes: 105 },
        { label: '01/17', calls: 11, minutes: 84 },
        { label: '01/20', calls: 18, minutes: 140 },
        { label: '01/23', calls: 16, minutes: 128 },
        { label: '01/26', calls: 20, minutes: 150 },
        { label: '01/29', calls: 17, minutes: 136 },
      ],
      popularSlots: [
        { label: '20:00-23:00', calls: 128, minutes: 320 },
        { label: '23:00-25:00', calls: 76, minutes: 210 },
        { label: '08:00-10:00', calls: 28, minutes: 90 },
      ],
    },
    revenue: {
      lifetime: 540000,
      monthly: [
        { month: '2024-12', amount: 82000 },
        { month: '2025-01', amount: 91000 },
      ],
      recentTrend: [
        { label: 'Week1', amount: 20000 },
        { label: 'Week2', amount: 18000 },
        { label: 'Week3', amount: 22000 },
        { label: 'Week4', amount: 21000 },
      ],
    },
    reviewStats: {
      averageRating: 4.6,
      reviewCount: 178,
      distribution: [
        { rating: 5, count: 120, percentage: 67 },
        { rating: 4, count: 38, percentage: 21 },
        { rating: 3, count: 12, percentage: 7 },
        { rating: 2, count: 5, percentage: 3 },
        { rating: 1, count: 3, percentage: 2 },
      ],
      highlight: '穏やかなトーンと間の取り方が高評価。',
    },
    recentReviews: [
      {
        id: 'rev_200',
        rating: 5,
        comment: '癒やされました。またお願いしたいです。',
        createdAt: '2025-01-29T12:00:00Z',
        userId: 'user_112',
      },
      {
        id: 'rev_201',
        rating: 4,
        comment: '夜勤明けでしっかり向き合ってもらえた。',
        createdAt: '2025-01-27T15:30:00Z',
        userId: 'user_088',
      },
    ],
    reports: [
      {
        id: 'rep_201',
        reporterId: 'user_112',
        reason: '不適切な言動',
        createdAt: '2025-01-29T09:30:00Z',
        status: 'investigating',
      },
      {
        id: 'rep_202',
        reporterId: 'user_099',
        reason: '長時間無言',
        createdAt: '2025-01-18T14:10:00Z',
        status: 'resolved',
      },
    ],
    schedule: [
      { dayLabel: '月', slots: [{ start: '20:00', end: '23:00' }] },
      { dayLabel: '火', slots: [{ start: '20:00', end: '23:00' }] },
      { dayLabel: '水', slots: [], isDayOff: true },
      { dayLabel: '木', slots: [{ start: '21:00', end: '24:00' }] },
      { dayLabel: '金', slots: [{ start: '20:30', end: '24:30' }] },
      { dayLabel: '土', slots: [{ start: '19:00', end: '22:00' }] },
      { dayLabel: '日', slots: [{ start: '10:00', end: '12:00' }] },
    ],
    attachments: [
      {
        id: 'att_001',
        type: 'document',
        label: '本人確認書類（2024/08/10）',
        url: '#',
        confidential: true,
      },
      {
        id: 'att_002',
        type: 'audio',
        label: '声質チェック音源',
        url: '#',
        note: '48kHz wav',
      },
    ],
    auditLog: [
      {
        id: 'log_001',
        status: 'approved',
        reason: '初期審査通過',
        changedBy: 'admin_001',
        changedAt: '2024-08-18T03:00:00Z',
      },
      {
        id: 'log_002',
        status: 'paused',
        reason: '本人からの短期休暇申請',
        changedBy: 'admin_002',
        changedAt: '2024-12-20T05:00:00Z',
      },
      {
        id: 'log_003',
        status: 'approved',
        reason: '休暇終了を確認して再稼働',
        changedBy: 'admin_002',
        changedAt: '2024-12-24T18:00:00Z',
      },
    ],
  },
  {
    id: 'otomo_017',
    displayName: 'レン',
    legalName: '高杉 蓮',
    email: 'ren@otomohan.jp',
    status: 'underReview',
    presence: 'offline',
    averageRating: 4.2,
    reviewCount: 42,
    callCount: 65,
    callMinutes: 310,
    reportCount: 0,
    lastLoginAt: '2025-01-28T11:20:00Z',
    registeredAt: '2025-01-05T02:00:00Z',
    avatarUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=256&q=80',
    profileTitle: 'ギターと夜ドライブトーク',
    profileBio:
      '音楽やナイトドライブの話題で盛り上げるのが得意。審査用の音声を準備中です。',
    tags: ['音楽', 'ドライブ', '20代'],
    callMetrics: {
      totalCalls: 65,
      totalMinutes: 310,
      averageMinutes: 6.1,
      last30Days: [
        { label: '01/04', calls: 4, minutes: 20 },
        { label: '01/07', calls: 6, minutes: 32 },
        { label: '01/10', calls: 8, minutes: 44 },
        { label: '01/13', calls: 5, minutes: 28 },
        { label: '01/16', calls: 7, minutes: 36 },
        { label: '01/19', calls: 11, minutes: 52 },
        { label: '01/22', calls: 9, minutes: 48 },
        { label: '01/25', calls: 7, minutes: 37 },
        { label: '01/28', calls: 8, minutes: 35 },
      ],
      popularSlots: [
        { label: '21:00-23:00', calls: 32, minutes: 140 },
        { label: '23:00-24:00', calls: 11, minutes: 50 },
      ],
    },
    revenue: {
      lifetime: 78000,
      monthly: [{ month: '2025-01', amount: 78000 }],
      recentTrend: [
        { label: 'Week1', amount: 12000 },
        { label: 'Week2', amount: 18000 },
        { label: 'Week3', amount: 22000 },
        { label: 'Week4', amount: 26000 },
      ],
    },
    reviewStats: {
      averageRating: 4.2,
      reviewCount: 42,
      distribution: [
        { rating: 5, count: 22, percentage: 52 },
        { rating: 4, count: 10, percentage: 24 },
        { rating: 3, count: 7, percentage: 17 },
        { rating: 2, count: 2, percentage: 5 },
        { rating: 1, count: 1, percentage: 2 },
      ],
      highlight: '共感力が高く、男性ユーザーからの支持が高い。',
    },
    recentReviews: [
      {
        id: 'rev_310',
        rating: 5,
        comment: 'ギターの話で盛り上がった！',
        createdAt: '2025-01-27T22:00:00Z',
        userId: 'user_180',
      },
    ],
    reports: [],
    schedule: [
      { dayLabel: '月', slots: [{ start: '21:00', end: '24:00' }] },
      { dayLabel: '火', slots: [{ start: '21:00', end: '24:00' }] },
      { dayLabel: '水', slots: [{ start: '22:00', end: '24:00' }] },
      { dayLabel: '木', slots: [], isDayOff: true },
      { dayLabel: '金', slots: [{ start: '22:00', end: '25:00' }] },
      { dayLabel: '土', slots: [{ start: '19:00', end: '23:00' }] },
      { dayLabel: '日', slots: [{ start: '10:00', end: '12:00' }] },
    ],
    attachments: [
      {
        id: 'att_120',
        type: 'document',
        label: '本人確認書類（2025/01/04）',
        url: '#',
        confidential: true,
      },
    ],
    auditLog: [
      {
        id: 'log_020',
        status: 'underReview',
        reason: '音声チェック待ち',
        changedBy: 'admin_004',
        changedAt: '2025-01-05T05:00:00Z',
      },
    ],
  },
  {
    id: 'otomo_022',
    displayName: 'ミホ',
    legalName: '上原 美帆',
    email: 'miho@otomohan.jp',
    status: 'frozen',
    presence: 'offline',
    averageRating: 3.8,
    reviewCount: 96,
    callCount: 210,
    callMinutes: 620,
    reportCount: 4,
    lastLoginAt: '2025-01-15T03:40:00Z',
    registeredAt: '2024-05-11T04:00:00Z',
    avatarUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80',
    profileTitle: 'テンポの良い雑談',
    profileBio:
      'テンション高めの雑談スタイル。最近通報が続いたため凍結中で、再教育プランを調整。',
    tags: ['盛り上げ', '20分枠', 'テンション高め'],
    callMetrics: {
      totalCalls: 210,
      totalMinutes: 620,
      averageMinutes: 6.5,
      last30Days: [
        { label: '01/01', calls: 8, minutes: 36 },
        { label: '01/04', calls: 10, minutes: 42 },
        { label: '01/07', calls: 7, minutes: 30 },
        { label: '01/10', calls: 6, minutes: 28 },
        { label: '01/13', calls: 5, minutes: 26 },
        { label: '01/16', calls: 3, minutes: 14 },
        { label: '01/19', calls: 2, minutes: 12 },
        { label: '01/22', calls: 1, minutes: 8 },
      ],
      popularSlots: [
        { label: '19:00-21:00', calls: 85, minutes: 250 },
        { label: '21:00-23:00', calls: 92, minutes: 280 },
      ],
    },
    revenue: {
      lifetime: 380000,
      monthly: [
        { month: '2024-12', amount: 66000 },
        { month: '2025-01', amount: 22000 },
      ],
      recentTrend: [
        { label: 'Week1', amount: 18000 },
        { label: 'Week2', amount: 9000 },
        { label: 'Week3', amount: 5000 },
        { label: 'Week4', amount: 0 },
      ],
    },
    reviewStats: {
      averageRating: 3.8,
      reviewCount: 96,
      distribution: [
        { rating: 5, count: 34, percentage: 35 },
        { rating: 4, count: 25, percentage: 26 },
        { rating: 3, count: 18, percentage: 19 },
        { rating: 2, count: 12, percentage: 13 },
        { rating: 1, count: 7, percentage: 7 },
      ],
      highlight: 'テンポの速さが好みを分けている傾向。',
    },
    recentReviews: [
      {
        id: 'rev_510',
        rating: 2,
        comment: 'もう少し落ち着いて話したい',
        createdAt: '2025-01-18T12:00:00Z',
        userId: 'user_052',
      },
    ],
    reports: [
      {
        id: 'rep_320',
        reporterId: 'user_071',
        reason: '通話中の私語',
        createdAt: '2025-01-10T11:00:00Z',
        status: 'resolved',
      },
      {
        id: 'rep_321',
        reporterId: 'user_054',
        reason: '態度が冷たい',
        createdAt: '2025-01-14T09:00:00Z',
        status: 'investigating',
      },
      {
        id: 'rep_322',
        reporterId: 'user_099',
        reason: '長時間無言',
        createdAt: '2025-01-18T09:30:00Z',
        status: 'investigating',
      },
      {
        id: 'rep_323',
        reporterId: 'user_101',
        reason: '個人情報の質問',
        createdAt: '2025-01-19T13:30:00Z',
        status: 'investigating',
      },
    ],
    schedule: [
      { dayLabel: '月', slots: [{ start: '19:00', end: '24:00' }] },
      { dayLabel: '火', slots: [{ start: '20:00', end: '23:30' }] },
      { dayLabel: '水', slots: [{ start: '18:00', end: '22:00' }] },
      { dayLabel: '木', slots: [{ start: '20:00', end: '23:00' }] },
      { dayLabel: '金', slots: [{ start: '19:00', end: '24:00' }] },
      { dayLabel: '土', slots: [{ start: '18:00', end: '25:00' }] },
      { dayLabel: '日', slots: [], isDayOff: true },
    ],
    attachments: [
      {
        id: 'att_220',
        type: 'document',
        label: '再審査アンケート',
        url: '#',
        note: '2025/01/22 アップロード',
      },
    ],
    auditLog: [
      {
        id: 'log_102',
        status: 'paused',
        reason: 'ユーザー通報が急増',
        changedBy: 'admin_003',
        changedAt: '2025-01-15T04:10:00Z',
      },
      {
        id: 'log_103',
        status: 'frozen',
        reason: '再教育プログラムのため凍結',
        changedBy: 'admin_003',
        changedAt: '2025-01-18T06:40:00Z',
      },
    ],
  },
]

const cloneAdminOtomoDetail = (detail: AdminOtomoDetail): AdminOtomoDetail => ({
  ...detail,
  tags: detail.tags.slice(),
  callMetrics: {
    ...detail.callMetrics,
    last30Days: detail.callMetrics.last30Days.map((point) => ({ ...point })),
    popularSlots: detail.callMetrics.popularSlots.map((slot) => ({ ...slot })),
  },
  revenue: {
    ...detail.revenue,
    monthly: detail.revenue.monthly.map((entry) => ({ ...entry })),
    recentTrend: detail.revenue.recentTrend.map((entry) => ({ ...entry })),
  },
  reviewStats: {
    ...detail.reviewStats,
    distribution: detail.reviewStats.distribution.map((entry) => ({
      ...entry,
    })),
  },
  recentReviews: detail.recentReviews.map((review) => ({ ...review })),
  reports: detail.reports.map((report) => ({ ...report })),
  schedule: detail.schedule.map((day) => ({
    dayLabel: day.dayLabel,
    isDayOff: day.isDayOff,
    slots: day.slots.map((slot) => ({ ...slot })),
  })),
  attachments: detail.attachments.map((item) => ({ ...item })),
  auditLog: detail.auditLog.map((entry) => ({ ...entry })),
})

const adminOtomoDatabase: Array<AdminOtomoDetail> =
  initialAdminOtomoDetails.map((detail) => cloneAdminOtomoDetail(detail))

const toAdminOtomoSummary = (detail: AdminOtomoDetail): AdminOtomoSummary => ({
  id: detail.id,
  displayName: detail.displayName,
  email: detail.email,
  status: detail.status,
  presence: detail.presence,
  averageRating: detail.averageRating,
  reviewCount: detail.reviewCount,
  callCount: detail.callCount,
  callMinutes: detail.callMinutes,
  reportCount: detail.reportCount,
  lastLoginAt: detail.lastLoginAt,
})

const classifyCallVolume = (count: number): 'low' | 'mid' | 'high' => {
  if (count >= 300) return 'high'
  if (count >= 120) return 'mid'
  return 'low'
}

export async function fetchAdminOtomoList(
  filters: AdminOtomoListFilters = {},
): Promise<Array<AdminOtomoSummary>> {
  await waitForMock(ADMIN_OTOMO_DELAY_MS)

  let items = adminOtomoDatabase.slice()

  if (filters.otomoId) {
    const keyword = filters.otomoId.toLowerCase()
    items = items.filter((detail) => detail.id.toLowerCase().includes(keyword))
  }
  if (filters.name) {
    const keyword = filters.name.toLowerCase()
    items = items.filter((detail) =>
      detail.displayName.toLowerCase().includes(keyword),
    )
  }
  if (filters.email) {
    const keyword = filters.email.toLowerCase()
    items = items.filter((detail) =>
      detail.email.toLowerCase().includes(keyword),
    )
  }
  if (filters.status) {
    items = items.filter((detail) => detail.status === filters.status)
  }
  if (typeof filters.minRating === 'number') {
    items = items.filter(
      (detail) => detail.averageRating >= (filters.minRating ?? 0),
    )
  }
  if (filters.reportFilter) {
    items = items.filter((detail) =>
      applyReportFilter(detail.reportCount, filters.reportFilter),
    )
  }
  if (filters.presence) {
    items = items.filter((detail) => detail.presence === filters.presence)
  }
  if (filters.callVolume) {
    items = items.filter(
      (detail) => classifyCallVolume(detail.callCount) === filters.callVolume,
    )
  }

  const sortBy = filters.sortBy ?? 'lastLogin'
  const sortOrder = filters.sortOrder ?? 'desc'

  items.sort((a, b) => {
    let valueA: number
    let valueB: number
    if (sortBy === 'calls') {
      valueA = a.callCount
      valueB = b.callCount
    } else if (sortBy === 'rating') {
      valueA = a.averageRating
      valueB = b.averageRating
    } else {
      valueA = parseDate(a.lastLoginAt)
      valueB = parseDate(b.lastLoginAt)
    }
    return sortOrder === 'desc' ? valueB - valueA : valueA - valueB
  })

  return items.map(toAdminOtomoSummary)
}

const findAdminOtomoOrThrow = (id: string) => {
  const detail = adminOtomoDatabase.find((candidate) => candidate.id === id)
  if (!detail) {
    throw new Error('おともはんが見つかりません')
  }
  return detail
}

export async function fetchAdminOtomoDetail(
  otomoId: string,
): Promise<AdminOtomoDetail> {
  await waitForMock(ADMIN_OTOMO_DELAY_MS)
  const detail = findAdminOtomoOrThrow(otomoId)
  return cloneAdminOtomoDetail(detail)
}

export interface UpdateAdminOtomoStatusPayload {
  otomoId: string
  nextStatus: AdminOtomoStatus
  reason: string
  changedBy?: string
}

export async function updateAdminOtomoStatus(
  payload: UpdateAdminOtomoStatusPayload,
): Promise<AdminOtomoDetail> {
  await waitForMock(ADMIN_OTOMO_DELAY_MS)
  const trimmedReason = payload.reason.trim()
  if (!trimmedReason) {
    throw new Error('変更理由を入力してください')
  }
  const detail = findAdminOtomoOrThrow(payload.otomoId)
  detail.status = payload.nextStatus
  detail.presence = payload.nextStatus === 'approved' ? 'online' : 'offline'
  detail.auditLog = [
    {
      id: `audit_${Date.now()}`,
      status: payload.nextStatus,
      reason: trimmedReason,
      changedBy: payload.changedBy ?? 'ops-team',
      changedAt: new Date().toISOString(),
    },
    ...detail.auditLog,
  ]
  return cloneAdminOtomoDetail(detail)
}

export type AdminCallStatus =
  | 'normal'
  | 'abnormal'
  | 'notConnected'
  | 'suspected'

export type AdminCallDurationBucket = 'under1' | 'oneToFive' | 'overFive'

export type AdminCallBillingBucket =
  | 'under100'
  | 'oneToFiveHundred'
  | 'overFiveHundred'

export interface AdminCallSummary {
  callId: string
  userId: string
  otomoId: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  billedPoints: number
  status: AdminCallStatus
  endReason: string
  anomalyNote?: string
}

export interface AdminCallListFilters {
  callId?: string
  userId?: string
  otomoId?: string
  startedFrom?: string
  startedTo?: string
  status?: AdminCallStatus
  durationBucket?: AdminCallDurationBucket
  billingBucket?: AdminCallBillingBucket
}

export interface AdminCallStateEvent {
  id: string
  at: string
  state: string
  note?: string
  level?: 'info' | 'warning' | 'danger'
}

export interface AdminCallRtpSummary {
  userIngress: string
  otomoIngress: string
  userLatencyMs: number
  otomoLatencyMs: number
  packetLossPct: number
  jitterMs: number
  note?: string
}

export interface AdminCallBillingTick {
  id: string
  at: string
  points: number
  missing?: boolean
}

export interface AdminCallQualityLog {
  avgRttMs: number
  disconnectCount: number
  userDevice: string
  otomoDevice: string
  networkNotes?: string
}

export interface AdminCallRecordingInfo {
  available: boolean
  url?: string
  note?: string
}

export interface AdminCallAlertEntry {
  id: string
  severity: 'info' | 'warning' | 'danger'
  message: string
}

export interface AdminCallDetail extends AdminCallSummary {
  pricingPerMinute: number
  stateEvents: Array<AdminCallStateEvent>
  rtpSummary: AdminCallRtpSummary
  billingTicks: Array<AdminCallBillingTick>
  qualityLog: AdminCallQualityLog
  recording: AdminCallRecordingInfo
  alerts: Array<AdminCallAlertEntry>
}

export interface AdminActiveCall {
  callId: string
  userId: string
  otomoId: string
  startedAt: string
  elapsedSeconds: number
  health: 'normal' | 'warning' | 'critical'
  rtpStatus: string
  note?: string
}

const ADMIN_CALLS_DELAY_MS = 480

const initialAdminCallDetails: Array<AdminCallDetail> = [
  {
    callId: 'call_3001',
    userId: 'user_001',
    otomoId: 'otomo_005',
    startedAt: '2025-02-01T03:01:00Z',
    endedAt: '2025-02-01T03:14:00Z',
    durationSeconds: 780,
    billedPoints: 300,
    status: 'normal',
    endReason: '正常終了',
    pricingPerMinute: 25,
    stateEvents: [
      { id: 'evt_1', at: '2025-02-01T03:01:05Z', state: 'REQUESTING' },
      { id: 'evt_2', at: '2025-02-01T03:01:07Z', state: 'RINGING' },
      { id: 'evt_3', at: '2025-02-01T03:01:14Z', state: 'CONNECTING' },
      { id: 'evt_4', at: '2025-02-01T03:01:15Z', state: 'CONNECTED' },
      { id: 'evt_5', at: '2025-02-01T03:14:22Z', state: 'ENDING' },
      { id: 'evt_6', at: '2025-02-01T03:14:23Z', state: 'ENDED' },
    ],
    rtpSummary: {
      userIngress: '正常（平均32ms）',
      otomoIngress: '正常（平均28ms）',
      userLatencyMs: 32,
      otomoLatencyMs: 28,
      packetLossPct: 1.2,
      jitterMs: 10,
    },
    billingTicks: Array.from({ length: 13 }).map((_, index) => ({
      id: `tick_${index + 1}`,
      at: new Date(2025, 1, 1, 12, 2 + index).toISOString(),
      points: 25,
    })),
    qualityLog: {
      avgRttMs: 88,
      disconnectCount: 0,
      userDevice: 'iOS / Safari 17',
      otomoDevice: 'Android / Chrome 121',
      networkNotes: '問題なし',
    },
    recording: {
      available: false,
      note: '録音は無効です',
    },
    alerts: [],
  },
  {
    callId: 'call_3002',
    userId: 'user_088',
    otomoId: 'otomo_001',
    startedAt: '2025-02-01T03:07:00Z',
    endedAt: '2025-02-01T03:08:10Z',
    durationSeconds: 70,
    billedPoints: 25,
    status: 'abnormal',
    endReason: '異常切断（おともはん側）',
    anomalyNote: 'RTP 停止を検知',
    pricingPerMinute: 25,
    stateEvents: [
      { id: 'evt_7', at: '2025-02-01T03:07:02Z', state: 'REQUESTING' },
      { id: 'evt_8', at: '2025-02-01T03:07:04Z', state: 'RINGING' },
      { id: 'evt_9', at: '2025-02-01T03:07:09Z', state: 'CONNECTING' },
      {
        id: 'evt_10',
        at: '2025-02-01T03:07:10Z',
        state: 'CONNECTED',
      },
      {
        id: 'evt_11',
        at: '2025-02-01T03:08:05Z',
        state: 'RTP_STOP',
        note: 'おともはん→SFU 0秒以降パケットなし',
        level: 'danger',
      },
      {
        id: 'evt_12',
        at: '2025-02-01T03:08:08Z',
        state: 'FORCE_ENDING',
        level: 'warning',
      },
      { id: 'evt_13', at: '2025-02-01T03:08:10Z', state: 'ENDED' },
    ],
    rtpSummary: {
      userIngress: '正常（平均40ms）',
      otomoIngress: '停止 60秒以降',
      userLatencyMs: 40,
      otomoLatencyMs: 0,
      packetLossPct: 12,
      jitterMs: 35,
      note: 'おともはん側の送信停止',
    },
    billingTicks: [
      { id: 'tick_200', at: '2025-02-01T03:07:30Z', points: 25 },
      { id: 'tick_201', at: '2025-02-01T03:08:00Z', points: 0, missing: true },
    ],
    qualityLog: {
      avgRttMs: 220,
      disconnectCount: 1,
      userDevice: 'iOS / App',
      otomoDevice: 'Desktop / Chrome',
      networkNotes: 'おともはん Wi-Fi 切断の疑い',
    },
    recording: {
      available: true,
      url: '#',
      note: '権限を持つ管理者のみ再生可能',
    },
    alerts: [
      {
        id: 'alert_1',
        severity: 'danger',
        message: 'おともはん RTP が 60 秒間停止しました',
      },
      {
        id: 'alert_2',
        severity: 'warning',
        message: '課金 tick が欠損しています',
      },
    ],
  },
  {
    callId: 'call_3003',
    userId: 'user_099',
    otomoId: 'otomo_022',
    startedAt: '2025-01-31T14:21:00Z',
    endedAt: '2025-01-31T14:25:30Z',
    durationSeconds: 270,
    billedPoints: 125,
    status: 'suspected',
    endReason: 'ポイント異常消費（疑い）',
    anomalyNote: '開始直後に大量課金',
    pricingPerMinute: 25,
    stateEvents: [
      { id: 'evt_14', at: '2025-01-31T14:21:03Z', state: 'REQUESTING' },
      { id: 'evt_15', at: '2025-01-31T14:21:05Z', state: 'RINGING' },
      { id: 'evt_16', at: '2025-01-31T14:21:08Z', state: 'CONNECTING' },
      { id: 'evt_17', at: '2025-01-31T14:21:10Z', state: 'CONNECTED' },
      {
        id: 'evt_18',
        at: '2025-01-31T14:21:40Z',
        state: 'BILLING_SPIKE',
        note: 'Tick で 50pt×2 を検知',
        level: 'warning',
      },
      { id: 'evt_19', at: '2025-01-31T14:25:20Z', state: 'ENDING' },
      { id: 'evt_20', at: '2025-01-31T14:25:30Z', state: 'ENDED' },
    ],
    rtpSummary: {
      userIngress: '安定（平均38ms）',
      otomoIngress: '安定（平均35ms）',
      userLatencyMs: 38,
      otomoLatencyMs: 35,
      packetLossPct: 0.8,
      jitterMs: 8,
      note: '通信面の問題なし',
    },
    billingTicks: [
      { id: 'tick_300', at: '2025-01-31T14:21:40Z', points: 50 },
      { id: 'tick_301', at: '2025-01-31T14:22:10Z', points: 50 },
      { id: 'tick_302', at: '2025-01-31T14:23:10Z', points: 25 },
    ],
    qualityLog: {
      avgRttMs: 92,
      disconnectCount: 0,
      userDevice: 'Android / Chrome',
      otomoDevice: 'Mac / Chrome',
      networkNotes: '課金ロジックのみ確認対象',
    },
    recording: {
      available: false,
    },
    alerts: [
      {
        id: 'alert_3',
        severity: 'warning',
        message: '通話開始 30 秒で 100pt 消費',
      },
    ],
  },
  {
    callId: 'call_3004',
    userId: 'user_120',
    otomoId: 'otomo_017',
    startedAt: '2025-01-30T11:10:00Z',
    endedAt: '2025-01-30T11:10:40Z',
    durationSeconds: 40,
    billedPoints: 0,
    status: 'notConnected',
    endReason: '未接続 (ユーザー応答なし)',
    pricingPerMinute: 25,
    stateEvents: [
      { id: 'evt_30', at: '2025-01-30T11:10:01Z', state: 'REQUESTING' },
      {
        id: 'evt_31',
        at: '2025-01-30T11:10:40Z',
        state: 'TIMEOUT',
        note: 'ユーザー無応答',
        level: 'info',
      },
    ],
    rtpSummary: {
      userIngress: '未接続',
      otomoIngress: '待機',
      userLatencyMs: 0,
      otomoLatencyMs: 0,
      packetLossPct: 0,
      jitterMs: 0,
      note: 'RTP通信なし',
    },
    billingTicks: [],
    qualityLog: {
      avgRttMs: 0,
      disconnectCount: 0,
      userDevice: '不明',
      otomoDevice: 'iOS / App',
      networkNotes: '応答なし',
    },
    recording: {
      available: false,
    },
    alerts: [],
  },
]

const cloneAdminCallDetail = (detail: AdminCallDetail): AdminCallDetail => ({
  ...detail,
  stateEvents: detail.stateEvents.map((event) => ({ ...event })),
  rtpSummary: { ...detail.rtpSummary },
  billingTicks: detail.billingTicks.map((tick) => ({ ...tick })),
  qualityLog: { ...detail.qualityLog },
  recording: { ...detail.recording },
  alerts: detail.alerts.map((alert) => ({ ...alert })),
})

const adminCallDatabase: Array<AdminCallDetail> = initialAdminCallDetails.map(
  (detail) => cloneAdminCallDetail(detail),
)

const toAdminCallSummary = (detail: AdminCallDetail): AdminCallSummary => ({
  callId: detail.callId,
  userId: detail.userId,
  otomoId: detail.otomoId,
  startedAt: detail.startedAt,
  endedAt: detail.endedAt,
  durationSeconds: detail.durationSeconds,
  billedPoints: detail.billedPoints,
  status: detail.status,
  endReason: detail.endReason,
  anomalyNote: detail.anomalyNote,
})

const matchesDurationBucket = (
  seconds: number,
  bucket?: AdminCallDurationBucket,
) => {
  if (!bucket) return true
  const minutes = seconds / 60
  if (bucket === 'under1') return minutes < 1
  if (bucket === 'oneToFive') return minutes >= 1 && minutes < 5
  return minutes >= 5
}

const matchesBillingBucket = (
  points: number,
  bucket?: AdminCallBillingBucket,
) => {
  if (!bucket) return true
  if (bucket === 'under100') return points < 100
  if (bucket === 'oneToFiveHundred') return points >= 100 && points < 500
  return points >= 500
}

export async function fetchAdminCallLogs(
  filters: AdminCallListFilters = {},
): Promise<Array<AdminCallSummary>> {
  await waitForMock(ADMIN_CALLS_DELAY_MS)

  let items = adminCallDatabase.slice()

  if (filters.callId) {
    const keyword = filters.callId.toLowerCase()
    items = items.filter((item) => item.callId.toLowerCase().includes(keyword))
  }
  if (filters.userId) {
    const keyword = filters.userId.toLowerCase()
    items = items.filter((item) => item.userId.toLowerCase().includes(keyword))
  }
  if (filters.otomoId) {
    const keyword = filters.otomoId.toLowerCase()
    items = items.filter((item) => item.otomoId.toLowerCase().includes(keyword))
  }
  if (filters.status) {
    items = items.filter((item) => item.status === filters.status)
  }
  if (filters.startedFrom || filters.startedTo) {
    items = items.filter((item) =>
      matchesDateRange(item.startedAt, filters.startedFrom, filters.startedTo),
    )
  }
  if (filters.durationBucket) {
    items = items.filter((item) =>
      matchesDurationBucket(item.durationSeconds, filters.durationBucket),
    )
  }
  if (filters.billingBucket) {
    items = items.filter((item) =>
      matchesBillingBucket(item.billedPoints, filters.billingBucket),
    )
  }

  items.sort((a, b) => parseDate(b.startedAt) - parseDate(a.startedAt))

  return items.map(toAdminCallSummary)
}

export async function fetchAdminCallDetail(
  callId: string,
): Promise<AdminCallDetail> {
  await waitForMock(ADMIN_CALLS_DELAY_MS)
  const detail = adminCallDatabase.find(
    (candidate) => candidate.callId === callId,
  )
  if (!detail) {
    throw new Error('通話ログが見つかりません')
  }
  return cloneAdminCallDetail(detail)
}

const adminActiveCalls: Array<AdminActiveCall> = [
  {
    callId: 'call_live_900',
    userId: 'user_218',
    otomoId: 'otomo_012',
    startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    elapsedSeconds: 180,
    health: 'normal',
    rtpStatus: '正常（平均30ms）',
  },
  {
    callId: 'call_live_901',
    userId: 'user_088',
    otomoId: 'otomo_001',
    startedAt: new Date(Date.now() - 60 * 1000).toISOString(),
    elapsedSeconds: 60,
    health: 'warning',
    rtpStatus: 'パケットロス 8%',
    note: 'RTP が低下中',
  },
  {
    callId: 'call_live_902',
    userId: 'user_300',
    otomoId: 'otomo_050',
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    elapsedSeconds: 300,
    health: 'critical',
    rtpStatus: 'おともはん側無音検知',
    note: '調査中',
  },
]

export async function fetchAdminActiveCalls(): Promise<Array<AdminActiveCall>> {
  await waitForMock(ADMIN_CALLS_DELAY_MS)
  return adminActiveCalls.map((call) => ({ ...call }))
}
