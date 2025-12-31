import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/mypage/password')({
  component: PasswordPlaceholder,
})

function PasswordPlaceholder() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-rose-500/25 blur-[140px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-[150px]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-24 pt-10 sm:px-6">
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-white/10 text-white"
          >
            <Link
              to="/mypage"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              マイページへ戻る
            </Link>
          </Button>
          <span className="text-xs uppercase tracking-[0.35em] text-white/60">
            C-04
          </span>
        </div>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <ShieldCheck className="h-6 w-6 text-rose-200" />
              パスワード変更
            </CardTitle>
            <CardDescription className="text-white/70">
              この画面は次のタスクで実装予定です。準備が整い次第、プロフィール編集画面から遷移できるようになります。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/70">
            <p>
              セキュリティ強化のためのパスワード変更フロー（C-04）は近日公開予定です。今しばらくお待ちください。
            </p>
            <p>戻る場合は上部のボタンからマイページへ移動できます。</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
