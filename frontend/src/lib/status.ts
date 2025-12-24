import type { OtomoPresenceStatus } from '@/lib/api'

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'outline'

export const OTOMO_STATUS_META: Record<
  OtomoPresenceStatus,
  {
    label: string
    helper: string
    badgeVariant: StatusBadgeVariant
    dotColor: string
  }
> = {
  online: {
    label: 'オンライン',
    helper: '今すぐ発信可',
    badgeVariant: 'success',
    dotColor: 'bg-emerald-400 shadow-emerald-400/40',
  },
  busy: {
    label: '通話中',
    helper: '終話通知を待つ',
    badgeVariant: 'danger',
    dotColor: 'bg-rose-500 shadow-rose-500/40',
  },
  away: {
    label: '離席中',
    helper: '戻り次第通知',
    badgeVariant: 'warning',
    dotColor: 'bg-amber-400 shadow-amber-400/40',
  },
  offline: {
    label: 'オフライン',
    helper: '今日はおやすみ',
    badgeVariant: 'outline',
    dotColor: 'bg-slate-500 shadow-slate-500/40',
  },
}

export const getStatusMeta = (status: OtomoPresenceStatus) =>
  OTOMO_STATUS_META[status]
