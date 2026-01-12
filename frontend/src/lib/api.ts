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

export interface UserNotificationSettings {
  push: boolean
  email: boolean
}

export interface UserAppSettings {
  theme: 'dark' | 'light'
  beepTone: boolean
}

export interface UserSettings {
  notifications: UserNotificationSettings
  app: UserAppSettings
}

export interface SupportLinks {
  termsUrl: string
  privacyUrl: string
  contactUrl: string
  faqUrl?: string
}

export type LegalDocumentSlug = 'terms' | 'privacy'

export interface LegalDocumentSection {
  id: string
  heading: string
  description?: string
  paragraphs: Array<string>
  bullets?: Array<string>
}

export interface LegalDocument {
  slug: LegalDocumentSlug
  title: string
  subtitle: string
  summary: string
  lastUpdated: string
  sections: Array<LegalDocumentSection>
}

export type BlockedUserRole = 'otomo' | 'user'

export interface BlockedUser {
  userId: string
  name: string
  avatarUrl: string
  blockedAt: string
  reason?: string | null
  role?: BlockedUserRole
}

export interface UpdateUserSettingsPayload {
  notifications?: Partial<UserNotificationSettings>
  app?: Partial<UserAppSettings>
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

const extractFriendlyError = (rawBody?: string | null) => {
  if (!rawBody) return null
  const trimmed = rawBody.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as
      | string
      | { error?: unknown; message?: unknown }
    if (typeof parsed === 'string') {
      const normalized = parsed.trim()
      return normalized.length > 0 ? normalized : null
    }
    if (typeof parsed === 'object') {
      const errorMessage = (parsed as { error?: unknown }).error
      if (typeof errorMessage === 'string') {
        const normalized = errorMessage.trim()
        if (normalized.length > 0) {
          return normalized
        }
      }
      const message = (parsed as { message?: unknown }).message
      if (typeof message === 'string') {
        const normalized = message.trim()
        if (normalized.length > 0) {
          return normalized
        }
      }
    }
  } catch {
    // Ignore JSON parse failures and fall back to raw text
  }

  if (trimmed.startsWith('<')) {
    return null
  }

  return trimmed
}

const buildApiErrorMessage = (
  status: number,
  statusText: string,
  responseBody: string,
) => {
  const friendly = extractFriendlyError(responseBody)
  if (friendly) {
    return friendly
  }
  const suffix = responseBody.length > 0 ? ` - ${responseBody}` : ''
  return `API error ${status}: ${statusText}${suffix}`
}

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
      buildApiErrorMessage(response.status, response.statusText, errorBody),
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
      buildApiErrorMessage(response.status, response.statusText, body),
    )
  }

  const data = (await response.json()) as UpdateUserAvatarResponse
  return data.avatarUrl
}

export async function fetchUserSettings(): Promise<UserSettings> {
  const response = await http<{ settings: UserSettings }>('/user/settings')
  return response.settings
}

export async function updateUserSettings(
  payload: UpdateUserSettingsPayload,
): Promise<UserSettings> {
  const response = await http<{ status: string; settings: UserSettings }>(
    '/user/settings',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
  return response.settings
}

export async function fetchSupportResources(): Promise<SupportLinks> {
  const response = await http<{ links: SupportLinks }>('/settings')
  return response.links
}

export async function fetchLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument> {
  return http<LegalDocument>(`/legal/${slug}`)
}

export async function trackLegalDocumentView(
  slug: LegalDocumentSlug,
): Promise<void> {
  await http<{ status: string }>('/analytics/legal-view', {
    method: 'POST',
    body: JSON.stringify({ slug }),
  })
}

export async function fetchBlockedUsers(): Promise<Array<BlockedUser>> {
  const response = await http<{ items: Array<BlockedUser> }>('/user/block-list')
  return response.items
}

export async function unblockUser(targetUserId: string): Promise<void> {
  await http<{ status: string }>(`/user/block/${targetUserId}`, {
    method: 'DELETE',
  })
}

export async function logoutUser(): Promise<void> {
  await http<{ status: string }>('/auth/logout', { method: 'POST' })
}

export async function deleteUserAccount(reason?: string): Promise<void> {
  await http<{ status: string }>('/user/delete', {
    method: 'DELETE',
    body: JSON.stringify({ reason: reason ?? null }),
  })
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

export type AppUserRole = 'user' | 'otomo'

export interface AppLoginUser {
  id: string
  role: AppUserRole
  name: string
  avatarUrl?: string
}

export interface AppLoginPayload {
  email: string
  password: string
}

export interface AppLoginResponse {
  token: string
  user: AppLoginUser
}

export type AppLoginErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'DEACTIVATED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'

export interface AppLoginError extends Error {
  code: AppLoginErrorCode
}

const AUTH_ERROR_MESSAGES: Record<AppLoginErrorCode, string> = {
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  USER_NOT_FOUND: 'アカウントが存在しません',
  DEACTIVATED: 'このアカウントは利用停止されています',
  NETWORK_ERROR: 'ネットワークに問題が発生しました',
  SERVER_ERROR: 'サーバーで問題が発生しました',
}

const APP_LOGIN_DELAY_MS = 640
const APP_SIGNUP_DELAY_MS = 820

type MockAppAccount = {
  email: string
  password: string
  id: string
  role: AppUserRole
  name: string
  avatarUrl?: string
  status: 'active' | 'deactivated'
}

const mockAppAccounts: Array<MockAppAccount> = [
  {
    email: 'user@example.com',
    password: 'userpass123',
    id: 'user_001',
    role: 'user',
    name: 'たろう',
    avatarUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=facearea&w=200&h=200&q=80',
    status: 'active',
  },
  {
    email: 'otomo@example.com',
    password: 'otomopass123',
    id: 'otomo_010',
    role: 'otomo',
    name: 'さくら',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=200&h=200&q=80',
    status: 'active',
  },
  {
    email: 'suspended@example.com',
    password: 'suspended123',
    id: 'user_404',
    role: 'user',
    name: '休眠ユーザー',
    status: 'deactivated',
  },
]

const createAppLoginError = (code: AppLoginErrorCode): AppLoginError => {
  const error = new Error(AUTH_ERROR_MESSAGES[code]) as AppLoginError
  error.code = code
  return error
}

export const isAppLoginError = (error: unknown): error is AppLoginError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}

export async function loginWithEmail(
  payload: AppLoginPayload,
): Promise<AppLoginResponse> {
  await waitForMock(APP_LOGIN_DELAY_MS)

  const email = payload.email.trim().toLowerCase()
  const password = payload.password.trim()

  if (!email || !password) {
    throw createAppLoginError('INVALID_CREDENTIALS')
  }

  if (email.includes('+network')) {
    throw createAppLoginError('NETWORK_ERROR')
  }
  if (email.includes('+server')) {
    throw createAppLoginError('SERVER_ERROR')
  }

  const account = mockAppAccounts.find((entry) => entry.email === email)
  if (!account) {
    throw createAppLoginError('USER_NOT_FOUND')
  }
  if (account.status === 'deactivated') {
    throw createAppLoginError('DEACTIVATED')
  }
  if (account.password !== password) {
    throw createAppLoginError('INVALID_CREDENTIALS')
  }

  return {
    token: `mock-user-token-${account.id}`,
    user: {
      id: account.id,
      role: account.role,
      name: account.name,
      avatarUrl: account.avatarUrl,
    },
  }
}

export interface AppSignupPayload {
  name: string
  email: string
  password: string
}

export type AppSignupErrorCode =
  | 'EMAIL_ALREADY_USED'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_NOT_MATCH'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'

export interface AppSignupError extends Error {
  code: AppSignupErrorCode
}

const SIGNUP_ERROR_MESSAGES: Record<AppSignupErrorCode, string> = {
  EMAIL_ALREADY_USED: 'このメールアドレスはすでに登録されています',
  INVALID_EMAIL: '正しいメールアドレスを入力してください',
  WEAK_PASSWORD: 'パスワードが条件を満たしていません',
  PASSWORD_NOT_MATCH: 'パスワードが一致しません',
  SERVER_ERROR: 'サーバーで問題が発生しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
}

const createSignupError = (code: AppSignupErrorCode): AppSignupError => {
  const error = new Error(SIGNUP_ERROR_MESSAGES[code]) as AppSignupError
  error.code = code
  return error
}

export const isAppSignupError = (error: unknown): error is AppSignupError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const generateMockUserId = (role: AppUserRole) =>
  `${role}_${Math.random().toString(36).slice(2, 8)}`

export async function signUpWithEmail(
  payload: AppSignupPayload,
): Promise<AppLoginResponse> {
  await waitForMock(APP_SIGNUP_DELAY_MS)

  const name = payload.name.trim()
  const email = payload.email.trim().toLowerCase()
  const password = payload.password.trim()

  if (!name || name.length > 32) {
    throw createSignupError('SERVER_ERROR')
  }
  if (!EMAIL_REGEX.test(email)) {
    throw createSignupError('INVALID_EMAIL')
  }
  if (password.length < 8 || password.length > 64) {
    throw createSignupError('WEAK_PASSWORD')
  }
  if (email.includes('+network')) {
    throw createSignupError('NETWORK_ERROR')
  }
  if (email.includes('+server')) {
    throw createSignupError('SERVER_ERROR')
  }
  if (mockAppAccounts.some((entry) => entry.email === email)) {
    throw createSignupError('EMAIL_ALREADY_USED')
  }

  const role: AppUserRole = email.includes('+otomo') ? 'otomo' : 'user'
  const newAccount: MockAppAccount = {
    email,
    password,
    id: generateMockUserId(role),
    role,
    name,
    status: 'active',
  }
  mockAppAccounts.push(newAccount)

  return {
    token: `mock-user-token-${newAccount.id}`,
    user: {
      id: newAccount.id,
      role: newAccount.role,
      name: newAccount.name,
      avatarUrl: newAccount.avatarUrl,
    },
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

export interface AdminPointSearchFilters {
  userId?: string
  email?: string
  otomoId?: string
  name?: string
}

export type AdminPointAnomalyCode =
  | 'rapid_consumption'
  | 'consumption_without_purchase'
  | 'bot_suspected'

export interface AdminPointAnomalyFlag {
  code: AdminPointAnomalyCode
  message: string
  severity: 'warning' | 'critical'
  detectedAt: string
}

export interface AdminPointUserSummary {
  userId: string
  userName: string
  email: string
  otomoId?: string | null
  balance: number
  totalPurchased: number
  totalUsed: number
  lastChargeAt?: string | null
  lastUsageAt?: string | null
  suspiciousFlag?: AdminPointAnomalyFlag | null
}

export interface AdminPointPurchaseHistoryEntry {
  id: string
  occurredAt: string
  points: number
  amountYen: number
  method: string
  transactionId: string
}

export interface AdminPointUsageHistoryEntry {
  id: string
  occurredAt: string
  points: number
  callId: string
  partnerName: string
  durationMinutes: number
}

export interface AdminPointAdminLogEntry {
  id: string
  occurredAt: string
  operator: string
  operation: 'add' | 'subtract'
  delta: number
  reason: string
}

export interface AdminPointDashboard {
  summary: AdminPointUserSummary
  purchases: Array<AdminPointPurchaseHistoryEntry>
  usage: Array<AdminPointUsageHistoryEntry>
  adminLogs: Array<AdminPointAdminLogEntry>
  lastUpdatedAt: string
}

export interface AdminPointAdjustmentPayload {
  amount: number
  reason: string
  operator?: string
}

const ADMIN_POINT_LEDGER_DELAY_MS = 620

type AdminPointLedgerRecord = {
  profile: {
    userId: string
    userName: string
    email: string
    otomoId?: string | null
  }
  totals: {
    balance: number
    purchased: number
    used: number
    lastChargeAt?: string | null
    lastUsageAt?: string | null
  }
  suspiciousFlag?: AdminPointAnomalyFlag | null
  purchases: Array<AdminPointPurchaseHistoryEntry>
  usage: Array<AdminPointUsageHistoryEntry>
  adminLogs: Array<AdminPointAdminLogEntry>
  lastUpdatedAt: string
}

const initialAdminPointLedger: Array<AdminPointLedgerRecord> = [
  {
    profile: {
      userId: 'user_123',
      userName: 'たろう',
      email: 'taro@example.com',
      otomoId: 'otomo_021',
    },
    totals: {
      balance: 720,
      purchased: 4800,
      used: 4080,
      lastChargeAt: '2025-01-30T08:12:00Z',
      lastUsageAt: '2025-01-30T09:05:00Z',
    },
    suspiciousFlag: {
      code: 'rapid_consumption',
      message: '1分間で500ptを消費しました',
      severity: 'warning',
      detectedAt: '2025-01-30T09:06:00Z',
    },
    purchases: [
      {
        id: 'purchase_001',
        occurredAt: '2025-01-30T08:12:00Z',
        points: 300,
        amountYen: 360,
        method: 'クレカ',
        transactionId: 'tr_abc123',
      },
      {
        id: 'purchase_002',
        occurredAt: '2025-01-28T21:40:00Z',
        points: 1500,
        amountYen: 1800,
        method: 'Apple Pay',
        transactionId: 'tr_def456',
      },
      {
        id: 'purchase_003',
        occurredAt: '2025-01-25T19:05:00Z',
        points: 3000,
        amountYen: 3600,
        method: 'クレカ',
        transactionId: 'tr_xyz890',
      },
    ],
    usage: [
      {
        id: 'usage_001',
        occurredAt: '2025-01-30T09:05:00Z',
        points: 100,
        callId: 'call_55',
        partnerName: 'さくら',
        durationMinutes: 1,
      },
      {
        id: 'usage_002',
        occurredAt: '2025-01-30T08:58:00Z',
        points: 400,
        callId: 'call_54',
        partnerName: 'ひろ',
        durationMinutes: 4,
      },
      {
        id: 'usage_003',
        occurredAt: '2025-01-29T23:10:00Z',
        points: 680,
        callId: 'call_53',
        partnerName: 'まゆ',
        durationMinutes: 7,
      },
      {
        id: 'usage_004',
        occurredAt: '2025-01-29T12:30:00Z',
        points: 1600,
        callId: 'call_52',
        partnerName: 'レン',
        durationMinutes: 16,
      },
      {
        id: 'usage_005',
        occurredAt: '2025-01-28T18:05:00Z',
        points: 1300,
        callId: 'call_51',
        partnerName: 'なぎさ',
        durationMinutes: 13,
      },
    ],
    adminLogs: [
      {
        id: 'log_001',
        occurredAt: '2025-01-29T18:40:00Z',
        operator: 'admin_ito',
        operation: 'add',
        delta: 100,
        reason: '問い合わせ補填',
      },
      {
        id: 'log_002',
        occurredAt: '2025-01-27T10:12:00Z',
        operator: 'finance_team',
        operation: 'subtract',
        delta: 80,
        reason: '不正利用の疑い',
      },
    ],
    lastUpdatedAt: '2025-01-30T09:10:00Z',
  },
  {
    profile: {
      userId: 'user_987',
      userName: 'みさき',
      email: 'misaki@example.com',
      otomoId: 'otomo_044',
    },
    totals: {
      balance: 3120,
      purchased: 9600,
      used: 6480,
      lastChargeAt: '2025-01-28T20:10:00Z',
      lastUsageAt: '2025-01-29T23:20:00Z',
    },
    purchases: [
      {
        id: 'purchase_010',
        occurredAt: '2025-01-28T20:10:00Z',
        points: 2400,
        amountYen: 2880,
        method: 'クレカ',
        transactionId: 'tr_jkl111',
      },
      {
        id: 'purchase_011',
        occurredAt: '2025-01-25T12:44:00Z',
        points: 3600,
        amountYen: 4320,
        method: '銀行振込',
        transactionId: 'tr_jkl222',
      },
      {
        id: 'purchase_012',
        occurredAt: '2025-01-20T09:28:00Z',
        points: 3600,
        amountYen: 4320,
        method: 'クレカ',
        transactionId: 'tr_jkl333',
      },
    ],
    usage: [
      {
        id: 'usage_020',
        occurredAt: '2025-01-29T23:20:00Z',
        points: 480,
        callId: 'call_80',
        partnerName: 'さくら',
        durationMinutes: 5,
      },
      {
        id: 'usage_021',
        occurredAt: '2025-01-29T21:05:00Z',
        points: 320,
        callId: 'call_79',
        partnerName: 'レン',
        durationMinutes: 3,
      },
      {
        id: 'usage_022',
        occurredAt: '2025-01-27T10:00:00Z',
        points: 960,
        callId: 'call_78',
        partnerName: 'まゆ',
        durationMinutes: 10,
      },
      {
        id: 'usage_023',
        occurredAt: '2025-01-25T22:18:00Z',
        points: 1280,
        callId: 'call_77',
        partnerName: 'なぎさ',
        durationMinutes: 13,
      },
    ],
    adminLogs: [
      {
        id: 'log_010',
        occurredAt: '2025-01-26T09:00:00Z',
        operator: 'finance_team',
        operation: 'add',
        delta: 200,
        reason: '長期利用キャンペーン',
      },
    ],
    lastUpdatedAt: '2025-01-29T23:30:00Z',
  },
  {
    profile: {
      userId: 'user_555',
      userName: 'Alex Chen',
      email: 'alex@example.com',
    },
    totals: {
      balance: 180,
      purchased: 2000,
      used: 1820,
      lastChargeAt: '2025-01-20T11:15:00Z',
      lastUsageAt: '2025-01-30T01:05:00Z',
    },
    suspiciousFlag: {
      code: 'consumption_without_purchase',
      message: '課金なしで消費のみが続いています',
      severity: 'critical',
      detectedAt: '2025-01-30T01:10:00Z',
    },
    purchases: [
      {
        id: 'purchase_020',
        occurredAt: '2025-01-20T11:15:00Z',
        points: 2000,
        amountYen: 2400,
        method: 'PayPay',
        transactionId: 'tr_pay200',
      },
    ],
    usage: [
      {
        id: 'usage_030',
        occurredAt: '2025-01-30T01:05:00Z',
        points: 220,
        callId: 'call_91',
        partnerName: 'りお',
        durationMinutes: 2,
      },
      {
        id: 'usage_031',
        occurredAt: '2025-01-29T23:50:00Z',
        points: 420,
        callId: 'call_90',
        partnerName: 'カナ',
        durationMinutes: 4,
      },
      {
        id: 'usage_032',
        occurredAt: '2025-01-28T17:10:00Z',
        points: 520,
        callId: 'call_89',
        partnerName: 'マコ',
        durationMinutes: 5,
      },
      {
        id: 'usage_033',
        occurredAt: '2025-01-27T08:25:00Z',
        points: 660,
        callId: 'call_88',
        partnerName: 'はる',
        durationMinutes: 7,
      },
    ],
    adminLogs: [
      {
        id: 'log_020',
        occurredAt: '2025-01-29T12:14:00Z',
        operator: 'risk_eye',
        operation: 'subtract',
        delta: 60,
        reason: '通話外請求の補正',
      },
    ],
    lastUpdatedAt: '2025-01-30T01:12:00Z',
  },
]

const cloneAdminPointLedgerRecord = (
  record: AdminPointLedgerRecord,
): AdminPointLedgerRecord => ({
  profile: { ...record.profile },
  totals: { ...record.totals },
  suspiciousFlag: record.suspiciousFlag
    ? { ...record.suspiciousFlag }
    : undefined,
  purchases: record.purchases.map((entry) => ({ ...entry })),
  usage: record.usage.map((entry) => ({ ...entry })),
  adminLogs: record.adminLogs.map((entry) => ({ ...entry })),
  lastUpdatedAt: record.lastUpdatedAt,
})

const adminPointLedger = initialAdminPointLedger.map((record) =>
  cloneAdminPointLedgerRecord(record),
)

const normalizePointFilters = (
  filters: AdminPointSearchFilters,
): AdminPointSearchFilters | null => {
  const normalized: AdminPointSearchFilters = {}
  const pushValue = (key: keyof AdminPointSearchFilters, value?: string) => {
    if (value && value.trim().length > 0) {
      normalized[key] = value.trim()
    }
  }
  pushValue('userId', filters.userId)
  pushValue('email', filters.email)
  pushValue('otomoId', filters.otomoId)
  pushValue('name', filters.name)
  return Object.keys(normalized).length ? normalized : null
}

const matchesPointRecord = (
  record: AdminPointLedgerRecord,
  filters: AdminPointSearchFilters,
) => {
  const userId = filters.userId?.toLowerCase()
  if (userId) {
    if (!record.profile.userId.toLowerCase().includes(userId)) {
      return false
    }
  }
  const email = filters.email?.toLowerCase()
  if (email) {
    if (!record.profile.email.toLowerCase().includes(email)) {
      return false
    }
  }
  const otomoId = filters.otomoId?.toLowerCase()
  if (otomoId) {
    if (!record.profile.otomoId?.toLowerCase().includes(otomoId)) {
      return false
    }
  }
  const name = filters.name?.toLowerCase()
  if (name) {
    if (!record.profile.userName.toLowerCase().includes(name)) {
      return false
    }
  }
  return true
}

const buildPointDashboard = (
  record: AdminPointLedgerRecord,
): AdminPointDashboard => ({
  summary: {
    userId: record.profile.userId,
    userName: record.profile.userName,
    email: record.profile.email,
    otomoId: record.profile.otomoId ?? null,
    balance: record.totals.balance,
    totalPurchased: record.totals.purchased,
    totalUsed: record.totals.used,
    lastChargeAt: record.totals.lastChargeAt ?? null,
    lastUsageAt: record.totals.lastUsageAt ?? null,
    suspiciousFlag: record.suspiciousFlag ?? null,
  },
  purchases: record.purchases.map((entry) => ({ ...entry })),
  usage: record.usage.map((entry) => ({ ...entry })),
  adminLogs: record.adminLogs.map((entry) => ({ ...entry })),
  lastUpdatedAt: record.lastUpdatedAt,
})

export async function fetchAdminPointDashboard(
  filters: AdminPointSearchFilters,
): Promise<AdminPointDashboard> {
  await waitForMock(ADMIN_POINT_LEDGER_DELAY_MS)
  const normalized = normalizePointFilters(filters)
  if (!normalized) {
    throw new Error('検索条件を1つ以上入力してください')
  }
  const record = adminPointLedger.find((entry) =>
    matchesPointRecord(entry, normalized),
  )
  if (!record) {
    throw new Error('該当するユーザーが見つかりませんでした')
  }
  return buildPointDashboard(record)
}

const findPointLedgerOrThrow = (userId: string) => {
  const record = adminPointLedger.find(
    (candidate) => candidate.profile.userId === userId,
  )
  if (!record) {
    throw new Error('対象ユーザーが見つかりません')
  }
  return record
}

const validateAdjustmentInput = (amount: number, reason: string) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('ポイントは1以上の整数を入力してください')
  }
  if (!Number.isInteger(amount)) {
    throw new Error('ポイントは整数で入力してください')
  }
  if (!reason || reason.trim().length < 3) {
    throw new Error('理由は3文字以上で入力してください')
  }
}

const applyAdminPointAdjustment = async (
  userId: string,
  direction: 'add' | 'subtract',
  payload: AdminPointAdjustmentPayload,
): Promise<AdminPointDashboard> => {
  await waitForMock(ADMIN_POINT_LEDGER_DELAY_MS)
  const record = findPointLedgerOrThrow(userId)
  const trimmedReason = payload.reason.trim()
  const amount = Math.floor(payload.amount)
  validateAdjustmentInput(amount, trimmedReason)
  if (direction === 'subtract' && record.totals.balance < amount) {
    throw new Error('残ポイントが不足しています')
  }

  if (direction === 'add') {
    record.totals.balance += amount
    record.totals.lastChargeAt = new Date().toISOString()
  } else {
    record.totals.balance -= amount
    record.totals.used += amount
    record.totals.lastUsageAt = new Date().toISOString()
  }

  record.lastUpdatedAt = new Date().toISOString()
  const operator = payload.operator?.trim() || 'admin_demo'
  record.adminLogs = [
    {
      id: `audit_${Date.now()}`,
      occurredAt: record.lastUpdatedAt,
      operator,
      operation: direction,
      delta: amount,
      reason: trimmedReason,
    },
    ...record.adminLogs,
  ]

  return buildPointDashboard(record)
}

export async function grantAdminPoints(
  userId: string,
  payload: AdminPointAdjustmentPayload,
): Promise<AdminPointDashboard> {
  return applyAdminPointAdjustment(userId, 'add', payload)
}

export async function deductAdminPoints(
  userId: string,
  payload: AdminPointAdjustmentPayload,
): Promise<AdminPointDashboard> {
  return applyAdminPointAdjustment(userId, 'subtract', payload)
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

export interface AdminUserPointSnapshots {
  currentBalance: number
  totalPurchased: number
  totalUsed: number
  lastUpdatedAt: string
  suspicious?: boolean
  notes?: string
}

export interface AdminUserPointPurchaseEntry {
  id: string
  occurredAt: string
  points: number
  amountYen: number
  method: string
  transactionId: string
}

export interface AdminUserPointUsageEntry {
  id: string
  occurredAt: string
  points: number
  callId: string
  otomoId: string
  durationSec: number
}

export interface AdminUserPointAdminLogEntry {
  id: string
  occurredAt: string
  operator: string
  delta: number
  reason: string
}

export interface AdminUserPointHistoryResponse {
  purchases: Array<AdminUserPointPurchaseEntry>
  usage: Array<AdminUserPointUsageEntry>
  adminLogs: Array<AdminUserPointAdminLogEntry>
}

export interface UpdateAdminUserPointsPayload {
  userId: string
  delta: number
  reason: string
  operator?: string
}

const ADMIN_USER_POINTS_DELAY_MS = 360

const adminUserPointSnapshots: Partial<
  Record<string, AdminUserPointSnapshots>
> = {
  user_001: {
    currentBalance: 720,
    totalPurchased: 4800,
    totalUsed: 4100,
    lastUpdatedAt: '2025-01-30T12:00:00Z',
  },
  user_002: {
    currentBalance: 120,
    totalPurchased: 5200,
    totalUsed: 5080,
    lastUpdatedAt: '2025-01-28T11:00:00Z',
    suspicious: true,
    notes: '通報増加に伴いポイント消費を監査中',
  },
  user_003: {
    currentBalance: 1650,
    totalPurchased: 6000,
    totalUsed: 4350,
    lastUpdatedAt: '2025-01-30T07:30:00Z',
  },
}

const adminUserPointHistory: Partial<
  Record<string, AdminUserPointHistoryResponse>
> = {
  user_001: {
    purchases: [
      {
        id: 'pur_100',
        occurredAt: '2025-01-30T06:00:00Z',
        points: 300,
        amountYen: 360,
        method: 'クレジットカード',
        transactionId: 'tr_abc123',
      },
      {
        id: 'pur_101',
        occurredAt: '2025-01-20T03:00:00Z',
        points: 500,
        amountYen: 600,
        method: 'Apple Pay',
        transactionId: 'tr_xyz789',
      },
    ],
    usage: [
      {
        id: 'use_200',
        occurredAt: '2025-01-30T09:00:00Z',
        points: 100,
        callId: 'call_130',
        otomoId: 'otomo_010',
        durationSec: 360,
      },
      {
        id: 'use_201',
        occurredAt: '2025-01-29T15:10:00Z',
        points: 80,
        callId: 'call_128',
        otomoId: 'otomo_006',
        durationSec: 240,
      },
    ],
    adminLogs: [
      {
        id: 'admin_001',
        occurredAt: '2025-01-29T11:00:00Z',
        operator: 'admin_ito',
        delta: 100,
        reason: '問い合わせ補填',
      },
    ],
  },
  user_002: {
    purchases: [
      {
        id: 'pur_150',
        occurredAt: '2025-01-25T05:00:00Z',
        points: 200,
        amountYen: 240,
        method: 'PayPay',
        transactionId: 'tr_pp001',
      },
    ],
    usage: [
      {
        id: 'use_250',
        occurredAt: '2025-01-25T06:00:00Z',
        points: 200,
        callId: 'call_180',
        otomoId: 'otomo_012',
        durationSec: 420,
      },
      {
        id: 'use_251',
        occurredAt: '2025-01-25T06:05:00Z',
        points: 180,
        callId: 'call_181',
        otomoId: 'otomo_017',
        durationSec: 390,
      },
    ],
    adminLogs: [
      {
        id: 'admin_200',
        occurredAt: '2025-01-28T11:30:00Z',
        operator: 'admin_yuki',
        delta: -50,
        reason: '不正疑いのため減算',
      },
    ],
  },
  user_003: {
    purchases: [],
    usage: [],
    adminLogs: [],
  },
}

export async function fetchAdminUserPoints(
  userId: string,
): Promise<AdminUserPointSnapshots> {
  await waitForMock(ADMIN_USER_POINTS_DELAY_MS)
  const snapshot = adminUserPointSnapshots[userId]
  if (!snapshot) {
    throw new Error('該当ユーザーのポイント情報が見つかりません')
  }
  return { ...snapshot }
}

export async function fetchAdminUserPointHistory(
  userId: string,
): Promise<AdminUserPointHistoryResponse> {
  await waitForMock(ADMIN_USER_POINTS_DELAY_MS)
  const history = adminUserPointHistory[userId]
  if (!history) {
    return { purchases: [], usage: [], adminLogs: [] }
  }
  return {
    purchases: history.purchases.map((entry) => ({ ...entry })),
    usage: history.usage.map((entry) => ({ ...entry })),
    adminLogs: history.adminLogs.map((entry) => ({ ...entry })),
  }
}

export async function updateAdminUserPoints(
  payload: UpdateAdminUserPointsPayload,
): Promise<AdminUserPointSnapshots> {
  await waitForMock(ADMIN_USER_POINTS_DELAY_MS)
  const snapshot = adminUserPointSnapshots[payload.userId]
  if (!snapshot) {
    throw new Error('ユーザーが見つかりません')
  }
  const nextBalance = snapshot.currentBalance + payload.delta
  if (nextBalance < 0) {
    throw new Error('残ポイントがマイナスになります')
  }
  snapshot.currentBalance = nextBalance
  if (payload.delta > 0) {
    snapshot.totalPurchased += payload.delta
  } else {
    snapshot.totalUsed += Math.abs(payload.delta)
  }
  snapshot.lastUpdatedAt = new Date().toISOString()
  const history = adminUserPointHistory[payload.userId]
  const adminLog: AdminUserPointAdminLogEntry = {
    id: `admin_${Date.now()}`,
    occurredAt: snapshot.lastUpdatedAt,
    operator: payload.operator ?? 'admin_mock',
    delta: payload.delta,
    reason: payload.reason,
  }
  if (history) {
    history.adminLogs = [adminLog, ...history.adminLogs]
  } else {
    adminUserPointHistory[payload.userId] = {
      purchases: [],
      usage: [],
      adminLogs: [adminLog],
    }
  }
  return { ...snapshot }
}

export type AdminTrafficSeverity = 'normal' | 'warning' | 'critical'

export interface AdminTrafficSummary {
  concurrentCalls: number
  sfuLoadPct: number
  avgRttMs: number
  packetLossPct: number
  apiRequestsPerMin: number
  updatedAt: string
}

export type AdminTrafficTrendRange = '15m' | '1h'

export interface AdminTrafficTrendPoint {
  timestamp: string
  concurrentCalls: number
}

export interface AdminTrafficSfuNodeMetrics {
  nodeId: string
  cpuPct: number
  memoryGb: number
  memoryCapacityGb: number
  upstreamMbps: number
  downstreamMbps: number
  status: AdminTrafficSeverity
}

export interface AdminTrafficRtpQuality {
  avgRttMs: number
  avgJitterMs: number
  packetLossPct: number
  abnormalCallCount: number
  notes: Array<string>
}

export interface AdminTrafficHeatmapEntry {
  hourLabel: string
  calls: number
}

export interface AdminTrafficAlertEntry {
  id: string
  severity: AdminTrafficSeverity | 'info'
  message: string
  occurredAt: string
  relatedCallId?: string
  relatedNodeId?: string
}

const ADMIN_TRAFFIC_DELAY_MS = 420

const adminTrafficSummarySnapshot: AdminTrafficSummary = {
  concurrentCalls: 12,
  sfuLoadPct: 41,
  avgRttMs: 82,
  packetLossPct: 1.4,
  apiRequestsPerMin: 420,
  updatedAt: new Date().toISOString(),
}

const adminTrafficTrendPoints: Record<
  AdminTrafficTrendRange,
  Array<AdminTrafficTrendPoint>
> = {
  '15m': [
    { timestamp: '2025-02-01T03:00:00Z', concurrentCalls: 3 },
    { timestamp: '2025-02-01T03:02:00Z', concurrentCalls: 5 },
    { timestamp: '2025-02-01T03:04:00Z', concurrentCalls: 7 },
    { timestamp: '2025-02-01T03:06:00Z', concurrentCalls: 9 },
    { timestamp: '2025-02-01T03:08:00Z', concurrentCalls: 11 },
    { timestamp: '2025-02-01T03:10:00Z', concurrentCalls: 12 },
    { timestamp: '2025-02-01T03:12:00Z', concurrentCalls: 10 },
    { timestamp: '2025-02-01T03:14:00Z', concurrentCalls: 8 },
  ],
  '1h': [
    { timestamp: '2025-02-01T02:15:00Z', concurrentCalls: 2 },
    { timestamp: '2025-02-01T02:25:00Z', concurrentCalls: 4 },
    { timestamp: '2025-02-01T02:35:00Z', concurrentCalls: 6 },
    { timestamp: '2025-02-01T02:45:00Z', concurrentCalls: 8 },
    { timestamp: '2025-02-01T02:55:00Z', concurrentCalls: 9 },
    { timestamp: '2025-02-01T03:05:00Z', concurrentCalls: 12 },
    { timestamp: '2025-02-01T03:15:00Z', concurrentCalls: 11 },
    { timestamp: '2025-02-01T03:25:00Z', concurrentCalls: 10 },
  ],
}

export type AdminNotificationCategory =
  | 'system'
  | 'update'
  | 'campaign'
  | 'otomo'
  | 'user'
  | 'critical'

export type AdminNotificationAudience = 'all' | 'users' | 'otomo' | 'custom'

export type AdminNotificationStatus = 'draft' | 'scheduled' | 'sent' | 'failed'

export type AdminNotificationChannel = 'inApp' | 'push' | 'email'

export interface AdminNotificationSummary {
  id: string
  title: string
  category: AdminNotificationCategory
  audience: AdminNotificationAudience
  status: AdminNotificationStatus
  scheduleMode: 'immediate' | 'scheduled'
  scheduledAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export interface AdminNotificationListFilters {
  title?: string
  category?: AdminNotificationCategory
  audience?: AdminNotificationAudience
  status?: AdminNotificationStatus
  scheduledFrom?: string
  scheduledTo?: string
}

export interface AdminNotificationFailureReason {
  code: string
  count: number
  description: string
}

export interface AdminNotificationDeliveryMetrics {
  successCount: number
  failureCount: number
  failureReasons: Array<AdminNotificationFailureReason>
}

export interface AdminNotificationDetail extends AdminNotificationSummary {
  body: string
  channels: Array<AdminNotificationChannel>
  previewSnippet: string
  targetUserIds?: Array<string>
  delivery: AdminNotificationDeliveryMetrics
}

export interface CreateAdminNotificationPayload {
  title: string
  body: string
  category: AdminNotificationCategory
  audience: AdminNotificationAudience
  channels: Array<AdminNotificationChannel>
  scheduleMode: 'immediate' | 'scheduled'
  scheduledAt?: string
  targetUserIds?: Array<string>
}

export interface UpdateAdminNotificationPayload extends Partial<CreateAdminNotificationPayload> {
  id: string
}

export interface SendAdminNotificationPayload {
  notificationId: string
  mode: 'immediate' | 'scheduled'
  scheduledAt?: string
}

const ADMIN_NOTIFICATION_DELAY_MS = 420

const initialAdminNotifications: Array<AdminNotificationDetail> = [
  {
    id: 'notif_100',
    title: '2/5 メンテナンスのお知らせ',
    category: 'system',
    audience: 'all',
    status: 'sent',
    scheduleMode: 'scheduled',
    scheduledAt: '2025-02-05T02:00:00Z',
    deliveredAt: '2025-02-05T02:00:05Z',
    createdAt: '2025-01-25T10:00:00Z',
    updatedAt: '2025-02-05T02:01:00Z',
    body: '2/5 02:00-03:00 の間にシステムメンテナンスを実施します。期間中は通話および課金機能が停止します。',
    channels: ['inApp', 'push'],
    previewSnippet: 'メンテナンス中はアプリ全機能が一時停止します。',
    delivery: {
      successCount: 12311,
      failureCount: 42,
      failureReasons: [
        {
          code: 'token_invalid',
          count: 18,
          description: 'デバイストークン失効',
        },
        { code: 'user_optout', count: 24, description: '通知拒否設定' },
      ],
    },
  },
  {
    id: 'notif_101',
    title: 'ポイント増量キャンペーン',
    category: 'campaign',
    audience: 'users',
    status: 'scheduled',
    scheduleMode: 'scheduled',
    scheduledAt: '2025-02-10T00:00:00Z',
    createdAt: '2025-01-29T06:00:00Z',
    updatedAt: '2025-01-29T06:00:00Z',
    body: '2/10〜2/14 の期間中、ポイントチャージ額に応じてボーナスポイントを付与します。',
    channels: ['inApp'],
    previewSnippet: '今だけポイントチャージで最大20%増量！',
    delivery: {
      successCount: 0,
      failureCount: 0,
      failureReasons: [],
    },
  },
  {
    id: 'notif_102',
    title: '収益レポート（1月度）',
    category: 'otomo',
    audience: 'otomo',
    status: 'draft',
    scheduleMode: 'scheduled',
    createdAt: '2025-01-30T03:30:00Z',
    updatedAt: '2025-01-30T03:30:00Z',
    body: '1月度の収益レポートを配信予定です。審査状況・還元額をご確認ください。',
    channels: ['inApp', 'email'],
    previewSnippet: '還元率やキャンセル率をまとめた月次レポートを配信します。',
    delivery: {
      successCount: 0,
      failureCount: 0,
      failureReasons: [],
    },
  },
  {
    id: 'notif_103',
    title: '利用規約違反による停止',
    category: 'critical',
    audience: 'custom',
    status: 'failed',
    scheduleMode: 'immediate',
    deliveredAt: '2025-01-28T15:10:00Z',
    createdAt: '2025-01-28T15:05:00Z',
    updatedAt: '2025-01-28T15:10:00Z',
    body: '規約違反が確認されたため、アカウントを一時停止しました。詳細はサポートまでお問い合わせください。',
    channels: ['inApp', 'email'],
    previewSnippet: '重要: アカウント停止のお知らせ',
    targetUserIds: ['user_077'],
    delivery: {
      successCount: 0,
      failureCount: 1,
      failureReasons: [
        { code: 'email_bounced', count: 1, description: 'メール送信に失敗' },
      ],
    },
  },
]

const cloneAdminNotification = (
  detail: AdminNotificationDetail,
): AdminNotificationDetail => ({
  ...detail,
  channels: detail.channels.slice(),
  targetUserIds: detail.targetUserIds?.slice(),
  delivery: {
    ...detail.delivery,
    failureReasons: detail.delivery.failureReasons.map((reason) => ({
      ...reason,
    })),
  },
})

const adminNotificationStore: Array<AdminNotificationDetail> =
  initialAdminNotifications.map((detail) => cloneAdminNotification(detail))

let adminNotificationSequence = 200

const toAdminNotificationSummary = (
  detail: AdminNotificationDetail,
): AdminNotificationSummary => ({
  id: detail.id,
  title: detail.title,
  category: detail.category,
  audience: detail.audience,
  status: detail.status,
  scheduleMode: detail.scheduleMode,
  scheduledAt: detail.scheduledAt,
  deliveredAt: detail.deliveredAt,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt,
})

const findAdminNotificationOrThrow = (id: string) => {
  const notification = adminNotificationStore.find((item) => item.id === id)
  if (!notification) {
    throw new Error('通知が見つかりません')
  }
  return notification
}

const applyNotificationFilters = (
  notifications: Array<AdminNotificationDetail>,
  filters: AdminNotificationListFilters,
) => {
  let list = notifications.slice()
  if (filters.title) {
    const keyword = filters.title.toLowerCase()
    list = list.filter((item) => item.title.toLowerCase().includes(keyword))
  }
  if (filters.category) {
    list = list.filter((item) => item.category === filters.category)
  }
  if (filters.audience) {
    list = list.filter((item) => item.audience === filters.audience)
  }
  if (filters.status) {
    list = list.filter((item) => item.status === filters.status)
  }
  if (filters.scheduledFrom) {
    const from = Date.parse(filters.scheduledFrom)
    list = list.filter((item) => {
      if (!item.scheduledAt) return false
      return Date.parse(item.scheduledAt) >= from
    })
  }
  if (filters.scheduledTo) {
    const to = Date.parse(filters.scheduledTo)
    list = list.filter((item) => {
      if (!item.scheduledAt) return false
      return Date.parse(item.scheduledAt) <= to
    })
  }
  return list
}

export async function fetchAdminNotifications(
  filters: AdminNotificationListFilters = {},
): Promise<Array<AdminNotificationSummary>> {
  await waitForMock(ADMIN_NOTIFICATION_DELAY_MS)
  return applyNotificationFilters(adminNotificationStore, filters)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map(toAdminNotificationSummary)
}

export async function fetchAdminNotificationDetail(
  notificationId: string,
): Promise<AdminNotificationDetail> {
  await waitForMock(ADMIN_NOTIFICATION_DELAY_MS)
  return cloneAdminNotification(findAdminNotificationOrThrow(notificationId))
}

export async function createAdminNotification(
  payload: CreateAdminNotificationPayload,
): Promise<AdminNotificationDetail> {
  await waitForMock(ADMIN_NOTIFICATION_DELAY_MS)
  const now = new Date().toISOString()
  const newNotification: AdminNotificationDetail = {
    id: `notif_${adminNotificationSequence++}`,
    title: payload.title,
    body: payload.body,
    category: payload.category,
    audience: payload.audience,
    status: payload.scheduleMode === 'immediate' ? 'sent' : 'draft',
    scheduleMode: payload.scheduleMode,
    scheduledAt:
      payload.scheduleMode === 'scheduled' ? payload.scheduledAt : now,
    deliveredAt: payload.scheduleMode === 'immediate' ? now : undefined,
    createdAt: now,
    updatedAt: now,
    channels: payload.channels.slice(),
    targetUserIds: payload.targetUserIds?.slice(),
    previewSnippet: payload.body.slice(0, 80),
    delivery:
      payload.scheduleMode === 'immediate'
        ? {
            successCount: 120,
            failureCount: 0,
            failureReasons: [],
          }
        : { successCount: 0, failureCount: 0, failureReasons: [] },
  }
  adminNotificationStore.unshift(newNotification)
  return cloneAdminNotification(newNotification)
}

export async function updateAdminNotification(
  payload: UpdateAdminNotificationPayload,
): Promise<AdminNotificationDetail> {
  await waitForMock(ADMIN_NOTIFICATION_DELAY_MS)
  const notification = findAdminNotificationOrThrow(payload.id)
  if (payload.title) notification.title = payload.title
  if (payload.body) {
    notification.body = payload.body
    notification.previewSnippet = payload.body.slice(0, 80)
  }
  if (payload.category) notification.category = payload.category
  if (payload.audience) notification.audience = payload.audience
  if (payload.channels) notification.channels = payload.channels.slice()
  if (payload.scheduleMode) notification.scheduleMode = payload.scheduleMode
  if (payload.scheduledAt) notification.scheduledAt = payload.scheduledAt
  if (payload.targetUserIds) {
    notification.targetUserIds = payload.targetUserIds.slice()
  }
  notification.updatedAt = new Date().toISOString()
  return cloneAdminNotification(notification)
}

export async function sendAdminNotification(
  payload: SendAdminNotificationPayload,
): Promise<AdminNotificationDetail> {
  await waitForMock(ADMIN_NOTIFICATION_DELAY_MS)
  const notification = findAdminNotificationOrThrow(payload.notificationId)
  const now = new Date().toISOString()
  notification.scheduleMode = payload.mode
  if (payload.mode === 'immediate') {
    notification.status = 'sent'
    notification.deliveredAt = now
    notification.scheduledAt = now
    notification.delivery = {
      successCount: Math.floor(Math.random() * 5000) + 2000,
      failureCount: Math.floor(Math.random() * 50),
      failureReasons: [],
    }
  } else {
    notification.status = 'scheduled'
    notification.scheduledAt = payload.scheduledAt ?? now
    notification.deliveredAt = undefined
    notification.delivery = {
      successCount: 0,
      failureCount: 0,
      failureReasons: [],
    }
  }
  notification.updatedAt = now
  return cloneAdminNotification(notification)
}

export type AdminReportCategory =
  | 'abuse'
  | 'sexual'
  | 'neglect'
  | 'spam'
  | 'fraud'
  | 'other'

export type AdminReportStatus = 'unprocessed' | 'reviewing' | 'resolved'

export type AdminReportPriority = 'high' | 'medium' | 'low'

export type AdminReportTargetType = 'user' | 'otomo'

export type AdminReportAction = 'warn' | 'temporarySuspend' | 'ban' | 'invalid'

export interface AdminReportSummary {
  id: string
  callId: string
  reporterId: string
  reporterType: AdminReportTargetType
  targetId: string
  targetType: AdminReportTargetType
  category: AdminReportCategory
  status: AdminReportStatus
  priority: AdminReportPriority
  reportedAt: string
  lastUpdatedAt: string
}

export interface AdminReportEvidence {
  callLogUrl: string
  recordingAvailable: boolean
  recordingUrl?: string
  recordingNote?: string
}

export interface AdminReportCallSummary {
  startedAt: string
  endedAt: string
  durationSeconds: number
}

export interface AdminReportTargetMetric {
  label: string
  value: string
  tone?: 'neutral' | 'warning' | 'danger'
}

export interface AdminReportTargetProfile {
  type: AdminReportTargetType
  headline: string
  metrics: Array<AdminReportTargetMetric>
}

export interface AdminReportHistoryEntry {
  id: string
  occurredAt: string
  operator: string
  status: AdminReportStatus
  note?: string
  resolutionAction?: AdminReportAction
}

export interface AdminReportResolution {
  action: AdminReportAction
  reason: string
  resolvedAt: string
  operator: string
}

export interface AdminReportDetail extends AdminReportSummary {
  message: string
  evidence: AdminReportEvidence
  callSummary: AdminReportCallSummary
  targetProfile: AdminReportTargetProfile
  history: Array<AdminReportHistoryEntry>
  resolution?: AdminReportResolution
}

export interface AdminReportFilters {
  reportId?: string
  callId?: string
  reporterId?: string
  targetId?: string
  category?: AdminReportCategory
  status?: AdminReportStatus
  reportedFrom?: string
  reportedTo?: string
}

export interface UpdateAdminReportStatusPayload {
  reportId: string
  status: AdminReportStatus
  operator: string
  note?: string
}

export interface ResolveAdminReportPayload {
  reportId: string
  action: AdminReportAction
  reason: string
  operator: string
}

const ADMIN_REPORT_DELAY_MS = 460

const adminReportStatusOrder: Record<AdminReportStatus, number> = {
  unprocessed: 0,
  reviewing: 1,
  resolved: 2,
}

const initialAdminReports: Array<AdminReportDetail> = [
  {
    id: 'report_102',
    callId: 'call_220',
    reporterId: 'user_112',
    reporterType: 'user',
    targetId: 'otomo_03',
    targetType: 'otomo',
    category: 'abuse',
    status: 'unprocessed',
    priority: 'high',
    reportedAt: '2025-02-01T12:20:00Z',
    lastUpdatedAt: '2025-02-01T12:20:00Z',
    message:
      '会話中に人格否定のような発言があり、不快でした。録音で該当箇所を確認してください。',
    evidence: {
      callLogUrl: '/history/call_220',
      recordingAvailable: true,
      recordingUrl: '#',
      recordingNote: 'ハラスメント対応チームのみ再生可能',
    },
    callSummary: {
      startedAt: '2025-02-01T12:05:00Z',
      endedAt: '2025-02-01T12:18:00Z',
      durationSeconds: 780,
    },
    targetProfile: {
      type: 'otomo',
      headline: '平均評価 4.2 / 過去通報 2 件',
      metrics: [
        { label: '平均評価', value: '4.2 / 5' },
        { label: '最近の低評価', value: '3件 / 30日', tone: 'warning' },
        { label: '過去の通報', value: '2件', tone: 'warning' },
        { label: '無応答率', value: '12%' },
      ],
    },
    history: [
      {
        id: 'hist_700',
        occurredAt: '2025-02-01T12:20:00Z',
        operator: 'system',
        status: 'unprocessed',
        note: 'ユーザーから自動受付',
      },
    ],
  },
  {
    id: 'report_099',
    callId: 'call_210',
    reporterId: 'otomo_04',
    reporterType: 'otomo',
    targetId: 'user_08',
    targetType: 'user',
    category: 'neglect',
    status: 'reviewing',
    priority: 'medium',
    reportedAt: '2025-01-31T22:10:00Z',
    lastUpdatedAt: '2025-02-01T01:00:00Z',
    message:
      '通話中に長時間無言状態が続き、複数回の呼びかけに応答がありませんでした。',
    evidence: {
      callLogUrl: '/history/call_210',
      recordingAvailable: false,
      recordingNote: '録音は未設定',
    },
    callSummary: {
      startedAt: '2025-01-31T21:40:00Z',
      endedAt: '2025-01-31T21:58:00Z',
      durationSeconds: 1080,
    },
    targetProfile: {
      type: 'user',
      headline: '課金状況: 正常 / 過去通報 1 件',
      metrics: [
        { label: '過去の通報', value: '1件' },
        { label: '課金状況', value: '正常' },
        { label: '迷惑行為', value: 'なし' },
      ],
    },
    history: [
      {
        id: 'hist_640',
        occurredAt: '2025-01-31T22:10:00Z',
        operator: 'system',
        status: 'unprocessed',
        note: 'おともはんからの通報を受付',
      },
      {
        id: 'hist_641',
        occurredAt: '2025-02-01T01:00:00Z',
        operator: 'admin_yoko',
        status: 'reviewing',
        note: 'ログ確認のため審査中に更新',
      },
    ],
  },
  {
    id: 'report_088',
    callId: 'call_115',
    reporterId: 'user_055',
    reporterType: 'user',
    targetId: 'otomo_01',
    targetType: 'otomo',
    category: 'spam',
    status: 'resolved',
    priority: 'low',
    reportedAt: '2025-01-28T09:05:00Z',
    lastUpdatedAt: '2025-01-28T12:45:00Z',
    message:
      '通話冒頭で外部サービスへの誘導があり、規約に抵触していると思われます。',
    evidence: {
      callLogUrl: '/history/call_115',
      recordingAvailable: true,
      recordingUrl: '#',
      recordingNote: '再生には監査ロールが必要',
    },
    callSummary: {
      startedAt: '2025-01-28T08:55:00Z',
      endedAt: '2025-01-28T09:10:00Z',
      durationSeconds: 900,
    },
    targetProfile: {
      type: 'otomo',
      headline: '平均評価 4.6 / 通報 0 件 (過去90日)',
      metrics: [
        { label: '平均評価', value: '4.6 / 5' },
        { label: 'キャンセル率', value: '3%' },
        { label: '過去通報', value: '0件' },
      ],
    },
    history: [
      {
        id: 'hist_600',
        occurredAt: '2025-01-28T09:05:00Z',
        operator: 'system',
        status: 'unprocessed',
      },
      {
        id: 'hist_601',
        occurredAt: '2025-01-28T10:00:00Z',
        operator: 'admin_mori',
        status: 'reviewing',
        note: '録音確認中',
      },
      {
        id: 'hist_602',
        occurredAt: '2025-01-28T12:45:00Z',
        operator: 'admin_mori',
        status: 'resolved',
        note: '警告でクローズ',
        resolutionAction: 'warn',
      },
    ],
    resolution: {
      action: 'warn',
      reason: '外部誘導を確認したため口頭警告',
      operator: 'admin_mori',
      resolvedAt: '2025-01-28T12:45:00Z',
    },
  },
]

const cloneAdminReport = (detail: AdminReportDetail): AdminReportDetail => ({
  ...detail,
  evidence: { ...detail.evidence },
  callSummary: { ...detail.callSummary },
  targetProfile: {
    ...detail.targetProfile,
    metrics: detail.targetProfile.metrics.map((metric) => ({ ...metric })),
  },
  history: detail.history.map((entry) => ({ ...entry })),
  resolution: detail.resolution ? { ...detail.resolution } : undefined,
})

const adminReportStore: Array<AdminReportDetail> = initialAdminReports.map(
  (report) => cloneAdminReport(report),
)

const toAdminReportSummary = (
  detail: AdminReportDetail,
): AdminReportSummary => ({
  id: detail.id,
  callId: detail.callId,
  reporterId: detail.reporterId,
  reporterType: detail.reporterType,
  targetId: detail.targetId,
  targetType: detail.targetType,
  category: detail.category,
  status: detail.status,
  priority: detail.priority,
  reportedAt: detail.reportedAt,
  lastUpdatedAt: detail.lastUpdatedAt,
})

const findAdminReportOrThrow = (reportId: string) => {
  const report = adminReportStore.find((entry) => entry.id === reportId)
  if (!report) {
    throw new Error('通報が見つかりません')
  }
  return report
}

const applyReportFilters = (
  reports: Array<AdminReportDetail>,
  filters: AdminReportFilters,
) => {
  let list = reports.slice()
  if (filters.reportId) {
    const keyword = filters.reportId.toLowerCase()
    list = list.filter((item) => item.id.toLowerCase().includes(keyword))
  }
  if (filters.callId) {
    const keyword = filters.callId.toLowerCase()
    list = list.filter((item) => item.callId.toLowerCase().includes(keyword))
  }
  if (filters.reporterId) {
    const keyword = filters.reporterId.toLowerCase()
    list = list.filter((item) =>
      item.reporterId.toLowerCase().includes(keyword),
    )
  }
  if (filters.targetId) {
    const keyword = filters.targetId.toLowerCase()
    list = list.filter((item) => item.targetId.toLowerCase().includes(keyword))
  }
  if (filters.category) {
    list = list.filter((item) => item.category === filters.category)
  }
  if (filters.status) {
    list = list.filter((item) => item.status === filters.status)
  }
  if (filters.reportedFrom) {
    const from = Date.parse(filters.reportedFrom)
    list = list.filter((item) => Date.parse(item.reportedAt) >= from)
  }
  if (filters.reportedTo) {
    const to = Date.parse(filters.reportedTo)
    list = list.filter((item) => Date.parse(item.reportedAt) <= to)
  }
  return list
}

export async function fetchAdminReports(
  filters: AdminReportFilters = {},
): Promise<Array<AdminReportSummary>> {
  await waitForMock(ADMIN_REPORT_DELAY_MS)
  return applyReportFilters(adminReportStore, filters)
    .sort((a, b) => {
      const statusDiff =
        adminReportStatusOrder[a.status] - adminReportStatusOrder[b.status]
      if (statusDiff !== 0) {
        return statusDiff
      }
      return Date.parse(b.reportedAt) - Date.parse(a.reportedAt)
    })
    .map(toAdminReportSummary)
}

export async function fetchAdminReportDetail(
  reportId: string,
): Promise<AdminReportDetail> {
  await waitForMock(ADMIN_REPORT_DELAY_MS)
  return cloneAdminReport(findAdminReportOrThrow(reportId))
}

export async function updateAdminReportStatus(
  payload: UpdateAdminReportStatusPayload,
): Promise<AdminReportDetail> {
  await waitForMock(ADMIN_REPORT_DELAY_MS)
  const report = findAdminReportOrThrow(payload.reportId)
  report.status = payload.status
  report.lastUpdatedAt = new Date().toISOString()
  report.history = [
    {
      id: `hist_${Date.now()}`,
      occurredAt: report.lastUpdatedAt,
      operator: payload.operator,
      status: payload.status,
      note: payload.note,
    },
    ...report.history,
  ]
  if (payload.status !== 'resolved') {
    report.resolution = undefined
  }
  return cloneAdminReport(report)
}

export async function resolveAdminReport(
  payload: ResolveAdminReportPayload,
): Promise<AdminReportDetail> {
  await waitForMock(ADMIN_REPORT_DELAY_MS)
  const report = findAdminReportOrThrow(payload.reportId)
  const now = new Date().toISOString()
  report.status = 'resolved'
  report.lastUpdatedAt = now
  report.resolution = {
    action: payload.action,
    reason: payload.reason,
    operator: payload.operator,
    resolvedAt: now,
  }
  report.history = [
    {
      id: `hist_${Date.now() + 1}`,
      occurredAt: now,
      operator: payload.operator,
      status: 'resolved',
      note: payload.reason,
      resolutionAction: payload.action,
    },
    ...report.history,
  ]
  return cloneAdminReport(report)
}

export type AdminReviewFlag = 'normal' | 'ai' | 'reported'

export type AdminReviewStatus = 'active' | 'deleted'

export interface AdminReviewHistoryEntry {
  id: string
  occurredAt: string
  operator: string
  action: string
  note?: string
}

export interface AdminReviewAnalytics {
  lowRatingCount7d: number
  avgRating7d: number
  recentFlags: number
  weeklyDelta: number
  notes: Array<string>
}

export interface AdminReviewSummary {
  id: string
  otomoId: string
  otomoName: string
  userId: string
  reviewerAlias: string
  callId: string
  rating: number
  hasComment: boolean
  commentSnippet: string
  flagged: AdminReviewFlag
  status: AdminReviewStatus
  createdAt: string
  updatedAt: string
}

export interface AdminReviewDetail extends AdminReviewSummary {
  comment: string
  flaggedKeywords: Array<string>
  aiLabels: Array<string>
  callStartedAt: string
  callDurationSeconds: number
  ratingTrend: Array<{ label: string; value: number }>
  analytics: AdminReviewAnalytics
  history: Array<AdminReviewHistoryEntry>
}

export interface AdminReviewFilters {
  otomoId?: string
  userId?: string
  rating?: number
  ratingMin?: number
  ratingMax?: number
  commentState?: 'with' | 'without'
  keyword?: string
  flagged?: AdminReviewFlag
  createdFrom?: string
  createdTo?: string
}

export interface DeleteAdminReviewPayload {
  reviewId: string
  reason: string
  operator: string
}

export interface FlagAdminReviewPayload {
  reviewId: string
  flag: AdminReviewFlag
  operator: string
  note?: string
}

const ADMIN_REVIEW_DELAY_MS = 380

const adminReviewFlagOrder: Record<AdminReviewFlag, number> = {
  reported: 0,
  ai: 1,
  normal: 2,
}

const buildReviewSnippet = (comment: string) =>
  comment.length <= 36 ? comment : `${comment.slice(0, 33)}…`

const maskUserId = (userId: string) => userId.replace(/(\d{2,})$/, '***')

const initialAdminReviews: Array<AdminReviewDetail> = [
  {
    id: 'rev_1021',
    otomoId: 'otomo_03',
    otomoName: 'すずか',
    userId: 'user_112',
    reviewerAlias: maskUserId('user_112'),
    callId: 'call_220',
    rating: 2,
    hasComment: true,
    comment:
      '途中で黙ってしまって気まずかったです。人格否定のような発言もあり、不快に感じました。',
    commentSnippet: buildReviewSnippet(
      '途中で黙ってしまって気まずかったです。人格否定のような発言もあり、不快に感じました。',
    ),
    flagged: 'reported',
    status: 'active',
    flaggedKeywords: ['人格否定'],
    aiLabels: ['暴言検知'],
    createdAt: '2025-02-01T12:22:00Z',
    updatedAt: '2025-02-01T12:25:00Z',
    callStartedAt: '2025-02-01T12:05:00Z',
    callDurationSeconds: 420,
    ratingTrend: [
      { label: '7D', value: 4.2 },
      { label: '30D', value: 4.4 },
      { label: '90D', value: 4.6 },
    ],
    analytics: {
      lowRatingCount7d: 3,
      avgRating7d: 4.2,
      recentFlags: 1,
      weeklyDelta: -0.4,
      notes: ['低評価が 48 時間で 2 件増加', '暴言タグ付きレビューあり'],
    },
    history: [
      {
        id: 'rev_hist_900',
        occurredAt: '2025-02-01T12:22:10Z',
        operator: 'system',
        action: 'received',
        note: 'ユーザー投稿を受付',
      },
    ],
  },
  {
    id: 'rev_1010',
    otomoId: 'otomo_01',
    otomoName: 'はるか',
    userId: 'user_038',
    reviewerAlias: maskUserId('user_038'),
    callId: 'call_210',
    rating: 5,
    hasComment: true,
    comment: '丁寧に話を聞いてくれて安心できました。またお願いしたいです。',
    commentSnippet: buildReviewSnippet(
      '丁寧に話を聞いてくれて安心できました。またお願いしたいです。',
    ),
    flagged: 'normal',
    status: 'active',
    flaggedKeywords: [],
    aiLabels: [],
    createdAt: '2025-01-31T09:05:00Z',
    updatedAt: '2025-01-31T09:05:00Z',
    callStartedAt: '2025-01-31T08:40:00Z',
    callDurationSeconds: 780,
    ratingTrend: [
      { label: '7D', value: 4.8 },
      { label: '30D', value: 4.7 },
      { label: '90D', value: 4.6 },
    ],
    analytics: {
      lowRatingCount7d: 0,
      avgRating7d: 4.8,
      recentFlags: 0,
      weeklyDelta: 0.1,
      notes: ['レビューの 82% が星4以上', '低評価は 30 日間で 0 件'],
    },
    history: [
      {
        id: 'rev_hist_850',
        occurredAt: '2025-01-31T09:05:05Z',
        operator: 'system',
        action: 'received',
      },
    ],
  },
  {
    id: 'rev_0999',
    otomoId: 'otomo_03',
    otomoName: 'すずか',
    userId: 'user_055',
    reviewerAlias: maskUserId('user_055'),
    callId: 'call_190',
    rating: 1,
    hasComment: true,
    comment: '急に広告リンクを送ってきて会話が成立しませんでした。',
    commentSnippet: buildReviewSnippet(
      '急に広告リンクを送ってきて会話が成立しませんでした。',
    ),
    flagged: 'ai',
    status: 'active',
    flaggedKeywords: ['広告リンク'],
    aiLabels: ['スパム疑い'],
    createdAt: '2025-01-29T18:40:00Z',
    updatedAt: '2025-01-29T18:45:00Z',
    callStartedAt: '2025-01-29T18:30:00Z',
    callDurationSeconds: 360,
    ratingTrend: [
      { label: '7D', value: 4.1 },
      { label: '30D', value: 4.3 },
      { label: '90D', value: 4.5 },
    ],
    analytics: {
      lowRatingCount7d: 2,
      avgRating7d: 4.1,
      recentFlags: 1,
      weeklyDelta: -0.2,
      notes: ['AI によりスパムの可能性を検知', '過去 7 日で低評価 2 件'],
    },
    history: [
      {
        id: 'rev_hist_810',
        occurredAt: '2025-01-29T18:40:05Z',
        operator: 'system',
        action: 'received',
      },
      {
        id: 'rev_hist_811',
        occurredAt: '2025-01-29T18:45:00Z',
        operator: 'ai_moderation',
        action: 'flagged',
        note: '広告リンクの検知',
      },
    ],
  },
]

const cloneAdminReview = (detail: AdminReviewDetail): AdminReviewDetail => ({
  ...detail,
  flaggedKeywords: detail.flaggedKeywords.slice(),
  aiLabels: detail.aiLabels.slice(),
  ratingTrend: detail.ratingTrend.map((point) => ({ ...point })),
  analytics: { ...detail.analytics, notes: detail.analytics.notes.slice() },
  history: detail.history.map((entry) => ({ ...entry })),
})

const adminReviewStore: Array<AdminReviewDetail> = initialAdminReviews.map(
  (detail) => cloneAdminReview(detail),
)

const toAdminReviewSummary = (
  detail: AdminReviewDetail,
): AdminReviewSummary => ({
  id: detail.id,
  otomoId: detail.otomoId,
  otomoName: detail.otomoName,
  userId: detail.userId,
  reviewerAlias: detail.reviewerAlias,
  callId: detail.callId,
  rating: detail.rating,
  hasComment: detail.hasComment,
  commentSnippet: detail.commentSnippet,
  flagged: detail.flagged,
  status: detail.status,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt,
})

const findAdminReviewOrThrow = (reviewId: string) => {
  const review = adminReviewStore.find((entry) => entry.id === reviewId)
  if (!review) {
    throw new Error('レビューが見つかりません')
  }
  return review
}

const applyReviewFilters = (
  reviews: Array<AdminReviewDetail>,
  filters: AdminReviewFilters,
) => {
  let list = reviews.filter((item) => item.status === 'active')
  if (filters.otomoId) {
    const keyword = filters.otomoId.toLowerCase()
    list = list.filter((item) => item.otomoId.toLowerCase().includes(keyword))
  }
  if (filters.userId) {
    const keyword = filters.userId.toLowerCase()
    list = list.filter((item) => item.userId.toLowerCase().includes(keyword))
  }
  if (filters.rating !== undefined) {
    list = list.filter((item) => item.rating === filters.rating)
  }
  if (filters.ratingMin !== undefined) {
    list = list.filter((item) => item.rating >= filters.ratingMin)
  }
  if (filters.ratingMax !== undefined) {
    list = list.filter((item) => item.rating <= filters.ratingMax)
  }
  if (filters.commentState === 'with') {
    list = list.filter((item) => item.hasComment)
  }
  if (filters.commentState === 'without') {
    list = list.filter((item) => !item.hasComment)
  }
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    list = list.filter((item) => item.comment.toLowerCase().includes(keyword))
  }
  if (filters.flagged) {
    list = list.filter((item) => item.flagged === filters.flagged)
  }
  if (filters.createdFrom) {
    const from = Date.parse(filters.createdFrom)
    list = list.filter((item) => Date.parse(item.createdAt) >= from)
  }
  if (filters.createdTo) {
    const to = Date.parse(filters.createdTo)
    list = list.filter((item) => Date.parse(item.createdAt) <= to)
  }
  return list
}

export async function fetchAdminReviews(
  filters: AdminReviewFilters = {},
): Promise<Array<AdminReviewSummary>> {
  await waitForMock(ADMIN_REVIEW_DELAY_MS)
  return applyReviewFilters(adminReviewStore, filters)
    .sort((a, b) => {
      const flagDiff =
        adminReviewFlagOrder[a.flagged] - adminReviewFlagOrder[b.flagged]
      if (flagDiff !== 0) {
        return flagDiff
      }
      if (a.rating !== b.rating) {
        return a.rating - b.rating
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt)
    })
    .map(toAdminReviewSummary)
}

export async function fetchAdminReviewDetail(
  reviewId: string,
): Promise<AdminReviewDetail> {
  await waitForMock(ADMIN_REVIEW_DELAY_MS)
  return cloneAdminReview(findAdminReviewOrThrow(reviewId))
}

export async function deleteAdminReview(
  payload: DeleteAdminReviewPayload,
): Promise<AdminReviewDetail> {
  await waitForMock(ADMIN_REVIEW_DELAY_MS)
  const review = findAdminReviewOrThrow(payload.reviewId)
  review.status = 'deleted'
  review.updatedAt = new Date().toISOString()
  review.history = [
    {
      id: `rev_hist_${Date.now()}`,
      occurredAt: review.updatedAt,
      operator: payload.operator,
      action: 'deleted',
      note: payload.reason,
    },
    ...review.history,
  ]
  return cloneAdminReview(review)
}

export async function flagAdminReview(
  payload: FlagAdminReviewPayload,
): Promise<AdminReviewDetail> {
  await waitForMock(ADMIN_REVIEW_DELAY_MS)
  const review = findAdminReviewOrThrow(payload.reviewId)
  review.flagged = payload.flag
  review.updatedAt = new Date().toISOString()
  review.history = [
    {
      id: `rev_hist_${Date.now() + 1}`,
      occurredAt: review.updatedAt,
      operator: payload.operator,
      action: 'flagged',
      note: payload.note ?? `フラグ: ${payload.flag}`,
    },
    ...review.history,
  ]
  return cloneAdminReview(review)
}

export type AdminAuditResult = 'success' | 'failed'

export type AdminAuditTargetType =
  | 'user'
  | 'otomo'
  | 'call'
  | 'review'
  | 'notification'
  | 'system'

export const adminAuditActionCatalog = {
  user_suspend: { label: 'ユーザー凍結', category: 'user' },
  user_unsuspend: { label: 'ユーザー凍結解除', category: 'user' },
  user_points_adjust: { label: 'ポイント調整', category: 'user' },
  otomo_suspend: { label: 'おともはん停止', category: 'otomo' },
  otomo_resume: { label: 'おともはん復帰', category: 'otomo' },
  otomo_profile_edit: {
    label: 'おともはんプロフィール編集',
    category: 'otomo',
  },
  notification_send: { label: '通知配信', category: 'notification' },
  notification_template_update: {
    label: '通知テンプレ更新',
    category: 'notification',
  },
  review_delete: { label: 'レビュー削除', category: 'review' },
  review_flag: { label: 'レビューへのフラグ付与', category: 'review' },
  call_recording_view: { label: '録音データ再生', category: 'call' },
  call_log_view: { label: '通話ログ閲覧', category: 'call' },
  system_login: { label: '管理画面ログイン', category: 'system' },
  system_setting_change: { label: 'システム設定変更', category: 'system' },
} as const

export type AdminAuditActionType = keyof typeof adminAuditActionCatalog

export type AdminAuditActionCategory =
  (typeof adminAuditActionCatalog)[AdminAuditActionType]['category']

export interface AdminAuditSummary {
  id: string
  adminId: string
  action: AdminAuditActionType
  actionLabel: string
  actionCategory: AdminAuditActionCategory
  targetId: string
  targetType: AdminAuditTargetType
  occurredAt: string
  result: AdminAuditResult
}

export interface AdminAuditRelatedLink {
  label: string
  href: string
  description?: string
}

export interface AdminAuditDetail extends AdminAuditSummary {
  ip: string
  detail: Record<string, unknown>
  failureReason?: string
  relatedLinks?: Array<AdminAuditRelatedLink>
}

export interface AdminAuditFilters {
  adminId?: string
  action?: AdminAuditActionType
  actionCategory?: AdminAuditActionCategory
  targetId?: string
  targetType?: AdminAuditTargetType
  result?: AdminAuditResult
  ip?: string
  keyword?: string
  occurredFrom?: string
  occurredTo?: string
}

type AdminAuditDetailInput = Omit<
  AdminAuditDetail,
  'actionLabel' | 'actionCategory'
>

const addAuditActionMeta = (
  detail: AdminAuditDetailInput,
): AdminAuditDetail => {
  const meta = adminAuditActionCatalog[detail.action]
  return {
    ...detail,
    actionLabel: meta.label,
    actionCategory: meta.category,
  }
}

const ADMIN_AUDIT_DELAY_MS = 420

const initialAdminAuditLogs: Array<AdminAuditDetail> = [
  addAuditActionMeta({
    id: 'log_9331',
    adminId: 'admin_02',
    action: 'otomo_suspend',
    targetId: 'otomo_03',
    targetType: 'otomo',
    occurredAt: '2025-02-01T12:40:22Z',
    result: 'success',
    ip: '192.168.1.40',
    detail: {
      reason: '暴言の疑い',
      previousStatus: 'active',
      newStatus: 'suspended',
    },
    relatedLinks: [
      {
        label: 'おともはん管理で確認',
        href: '/otomo/otomo_03',
        description: '対象のおともはん詳細へ',
      },
    ],
  }),
  addAuditActionMeta({
    id: 'log_9330',
    adminId: 'admin_01',
    action: 'review_delete',
    targetId: 'rev_1021',
    targetType: 'review',
    occurredAt: '2025-02-01T12:38:11Z',
    result: 'success',
    ip: '192.168.1.12',
    detail: {
      reason: '人格否定に該当',
      reviewer: 'user_112',
      otomoId: 'otomo_03',
    },
    relatedLinks: [
      {
        label: 'レビュー管理で確認',
        href: '/admin/reviews',
        description: '該当レビュースレッドへ',
      },
    ],
  }),
  addAuditActionMeta({
    id: 'log_9328',
    adminId: 'admin_03',
    action: 'user_points_adjust',
    targetId: 'user_022',
    targetType: 'user',
    occurredAt: '2025-02-01T12:22:02Z',
    result: 'failed',
    ip: '192.168.1.55',
    detail: {
      delta: -120,
      reason: '不正購入の返還',
      requestedBy: 'risk_bot',
    },
    failureReason: '権限不足 (need super-admin)',
  }),
  addAuditActionMeta({
    id: 'log_9325',
    adminId: 'admin_04',
    action: 'notification_send',
    targetId: 'notice_batch_210',
    targetType: 'notification',
    occurredAt: '2025-02-01T12:18:10Z',
    result: 'success',
    ip: '192.168.1.71',
    detail: {
      templateId: 'notice_low_rating_v2',
      recipients: 36,
      otomoIds: ['otomo_01', 'otomo_03'],
    },
    relatedLinks: [
      {
        label: '通知管理を開く',
        href: '/admin/notifications',
      },
    ],
  }),
  addAuditActionMeta({
    id: 'log_9322',
    adminId: 'admin_02',
    action: 'call_recording_view',
    targetId: 'call_229',
    targetType: 'call',
    occurredAt: '2025-02-01T12:10:44Z',
    result: 'success',
    ip: '192.168.1.40',
    detail: {
      playbackDuration: 132,
      caseId: 'report_882',
      note: '暴言検証',
    },
    relatedLinks: [
      {
        label: '通話ログを見る',
        href: '/call/call_229',
      },
    ],
  }),
  addAuditActionMeta({
    id: 'log_9318',
    adminId: 'admin_01',
    action: 'system_login',
    targetId: 'console',
    targetType: 'system',
    occurredAt: '2025-02-01T11:58:33Z',
    result: 'success',
    ip: '192.168.1.12',
    detail: {
      mfa: 'webauthn',
      sessionId: 'sess_5571',
    },
  }),
]

type AdminAuditRecord = AdminAuditDetail & { searchBlob: string }

const cloneAdminAuditDetail = (record: AdminAuditRecord): AdminAuditDetail => {
  const { searchBlob, detail, relatedLinks, ...rest } = record
  return {
    ...rest,
    detail: JSON.parse(JSON.stringify(detail)),
    relatedLinks: relatedLinks?.map((link) => ({ ...link })),
  }
}

const buildAuditSearchBlob = (detail: AdminAuditDetail) =>
  [
    detail.id,
    detail.adminId,
    detail.action,
    detail.targetId,
    detail.ip,
    detail.failureReason ?? '',
    JSON.stringify(detail.detail),
  ]
    .join(' ')
    .toLowerCase()

const adminAuditStore: Array<AdminAuditRecord> = initialAdminAuditLogs.map(
  (entry) => ({
    ...entry,
    detail: JSON.parse(JSON.stringify(entry.detail)),
    relatedLinks: entry.relatedLinks?.map((link) => ({ ...link })),
    searchBlob: buildAuditSearchBlob(entry),
  }),
)

const findAdminAuditOrThrow = (logId: string) => {
  const log = adminAuditStore.find((entry) => entry.id === logId)
  if (!log) {
    throw new Error('操作ログが見つかりません')
  }
  return log
}

const applyAuditFilters = (
  records: Array<AdminAuditRecord>,
  filters: AdminAuditFilters,
) => {
  let list = records.slice()
  if (filters.adminId) {
    const keyword = filters.adminId.toLowerCase()
    list = list.filter((entry) => entry.adminId.toLowerCase().includes(keyword))
  }
  if (filters.action) {
    list = list.filter((entry) => entry.action === filters.action)
  }
  if (filters.actionCategory) {
    list = list.filter(
      (entry) => entry.actionCategory === filters.actionCategory,
    )
  }
  if (filters.targetId) {
    const keyword = filters.targetId.toLowerCase()
    list = list.filter((entry) =>
      entry.targetId.toLowerCase().includes(keyword),
    )
  }
  if (filters.targetType) {
    list = list.filter((entry) => entry.targetType === filters.targetType)
  }
  if (filters.result) {
    list = list.filter((entry) => entry.result === filters.result)
  }
  if (filters.ip) {
    const keyword = filters.ip.toLowerCase()
    list = list.filter((entry) => entry.ip.toLowerCase().includes(keyword))
  }
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    list = list.filter((entry) => entry.searchBlob.includes(keyword))
  }
  if (filters.occurredFrom) {
    const from = Date.parse(filters.occurredFrom)
    list = list.filter((entry) => Date.parse(entry.occurredAt) >= from)
  }
  if (filters.occurredTo) {
    const to = Date.parse(filters.occurredTo)
    list = list.filter((entry) => Date.parse(entry.occurredAt) <= to)
  }
  return list
}

export async function fetchAdminAuditLogs(
  filters: AdminAuditFilters = {},
): Promise<Array<AdminAuditSummary>> {
  await waitForMock(ADMIN_AUDIT_DELAY_MS)
  return applyAuditFilters(adminAuditStore, filters)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .map((entry) => {
      const { searchBlob, detail, relatedLinks, ...rest } = entry
      return { ...rest }
    })
}

export async function fetchAdminAuditLogDetail(
  logId: string,
): Promise<AdminAuditDetail> {
  await waitForMock(ADMIN_AUDIT_DELAY_MS)
  return cloneAdminAuditDetail(findAdminAuditOrThrow(logId))
}

const adminTrafficSfuMetrics: Array<AdminTrafficSfuNodeMetrics> = [
  {
    nodeId: 'sfu-tokyo-1',
    cpuPct: 35,
    memoryGb: 2.1,
    memoryCapacityGb: 8,
    upstreamMbps: 38,
    downstreamMbps: 42,
    status: 'normal',
  },
  {
    nodeId: 'sfu-tokyo-2',
    cpuPct: 72,
    memoryGb: 3.8,
    memoryCapacityGb: 8,
    upstreamMbps: 55,
    downstreamMbps: 58,
    status: 'warning',
  },
  {
    nodeId: 'sfu-osaka-1',
    cpuPct: 58,
    memoryGb: 2.7,
    memoryCapacityGb: 8,
    upstreamMbps: 29,
    downstreamMbps: 31,
    status: 'normal',
  },
]

const adminTrafficRtpQuality: AdminTrafficRtpQuality = {
  avgRttMs: 82,
  avgJitterMs: 12,
  packetLossPct: 1.4,
  abnormalCallCount: 1,
  notes: ['RTT 上昇中（threshold: 120ms）', 'SFU-2 で packet loss が上振れ'],
}

const adminTrafficHeatmap: Array<AdminTrafficHeatmapEntry> = [
  { hourLabel: '06:00', calls: 2 },
  { hourLabel: '09:00', calls: 6 },
  { hourLabel: '12:00', calls: 12 },
  { hourLabel: '15:00', calls: 8 },
  { hourLabel: '18:00', calls: 16 },
  { hourLabel: '21:00', calls: 22 },
  { hourLabel: '24:00', calls: 10 },
]

const adminTrafficAlerts: Array<AdminTrafficAlertEntry> = [
  {
    id: 'traffic_alert_001',
    severity: 'warning',
    message: 'SFU-2 の CPU 使用率が 70% を超えました',
    occurredAt: '2025-02-01T03:12:00Z',
    relatedNodeId: 'sfu-tokyo-2',
  },
  {
    id: 'traffic_alert_002',
    severity: 'critical',
    message: 'call_229 のパケットロスが 3% を超過しました',
    occurredAt: '2025-02-01T03:11:30Z',
    relatedCallId: 'call_229',
  },
  {
    id: 'traffic_alert_003',
    severity: 'info',
    message: 'API リクエストが平常値に戻りました',
    occurredAt: '2025-02-01T03:10:00Z',
  },
]

export async function fetchAdminTrafficSummary(): Promise<AdminTrafficSummary> {
  await waitForMock(ADMIN_TRAFFIC_DELAY_MS)
  return { ...adminTrafficSummarySnapshot }
}

export async function fetchAdminTrafficTrend(
  range: AdminTrafficTrendRange,
): Promise<Array<AdminTrafficTrendPoint>> {
  await waitForMock(ADMIN_TRAFFIC_DELAY_MS)
  return adminTrafficTrendPoints[range].map((point) => ({ ...point }))
}

export async function fetchAdminTrafficSfuMetrics(): Promise<
  Array<AdminTrafficSfuNodeMetrics>
> {
  await waitForMock(ADMIN_TRAFFIC_DELAY_MS)
  return adminTrafficSfuMetrics.map((entry) => ({ ...entry }))
}

export async function fetchAdminTrafficRtpQuality(): Promise<AdminTrafficRtpQuality> {
  await waitForMock(ADMIN_TRAFFIC_DELAY_MS)
  return {
    ...adminTrafficRtpQuality,
    notes: adminTrafficRtpQuality.notes.slice(),
  }
}

export async function fetchAdminTrafficHeatmap(): Promise<
  Array<AdminTrafficHeatmapEntry>
> {
  await waitForMock(ADMIN_TRAFFIC_DELAY_MS)
  return adminTrafficHeatmap.map((entry) => ({ ...entry }))
}

export async function fetchAdminTrafficAlerts(): Promise<
  Array<AdminTrafficAlertEntry>
> {
  await waitForMock(ADMIN_TRAFFIC_DELAY_MS)
  return adminTrafficAlerts.map((entry) => ({ ...entry }))
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

// ─────────────────────────────────────────────────────────────────────────────
// Azure Communication Services (ACS) Token API
// ─────────────────────────────────────────────────────────────────────────────

export interface AcsTokenResponse {
  acsUserId: string
  token: string
  expiresOn: string
}

/**
 * ACSアクセストークンを取得
 * 通話開始時にこのトークンでACS Calling SDKを初期化する
 * @param callId 通話ID
 * @param existingAcsUserId 既存のACSユーザーID（トークン更新時）
 */
export async function fetchAcsToken(
  callId: string,
  existingAcsUserId?: string,
): Promise<AcsTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/acs/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      callId,
      existingAcsUserId,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => null)
    const friendlyError = extractFriendlyError(errorBody)
    throw new Error(friendlyError ?? 'ACSトークンの取得に失敗しました')
  }

  const data = (await response.json()) as {
    status: string
    acsUserId: string
    token: string
    expiresOn: string
  }

  return {
    acsUserId: data.acsUserId,
    token: data.token,
    expiresOn: data.expiresOn,
  }
}
