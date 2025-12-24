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

export interface WalletBalance {
  balance: number
  currency: string
  updatedAt: string
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

interface WalletBalanceResponse extends WalletBalance {}

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

  return data.items.map((item) => ({
    id: item.id,
    name: item.displayName,
    avatarUrl: item.avatarUrl,
    status: RAW_TO_PRESENT_STATUS[item.status],
    rating: item.rating,
    reviewCount: item.reviewCount,
    bio: item.bio,
    tags: item.tags,
    pricePerMinute: item.pricePerMinute,
  }))
}

export async function fetchWalletBalance(): Promise<WalletBalanceResponse> {
  return http<WalletBalanceResponse>('/wallet/balance')
}
