import type { CallEndReason } from '@/lib/api'

export type ReasonTone = 'info' | 'warning' | 'danger'

export const CALL_END_REASON_META: Record<
  CallEndReason,
  { title: string; description: string; tone: ReasonTone }
> = {
  user_end: {
    title: 'あなたが通話を終了しました',
    description: '通話終了ボタンの操作が完了しました。',
    tone: 'info',
  },
  otomo_end: {
    title: 'おともはんが通話を終了しました',
    description: '相手からの終了操作が行われました。',
    tone: 'info',
  },
  no_point: {
    title: 'ポイント不足により通話が終了しました',
    description: 'ウォレット残高が不足したため自動的に終了しました。',
    tone: 'warning',
  },
  network_lost: {
    title: '通信エラーにより終了しました',
    description: 'ネットワークが不安定なため通話が継続できませんでした。',
    tone: 'warning',
  },
  timeout: {
    title: '応答がなく通話が終了しました',
    description: '一定時間応答がなかったため自動的に終了しました。',
    tone: 'warning',
  },
  system_error: {
    title: 'システムエラーにより終了しました',
    description: 'エラーが発生したため通話を終了しました。',
    tone: 'danger',
  },
}

export const getCallEndReasonMeta = (reason?: CallEndReason) =>
  CALL_END_REASON_META[reason ?? 'user_end']
