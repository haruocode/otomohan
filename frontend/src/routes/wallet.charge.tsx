import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Home, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/wallet/charge')({
  component: ChargePlaceholder,
})

function ChargePlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <Card className="w-full max-w-lg border-white/10 bg-white/5">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3 text-sm text-white/70">
            <Wallet className="h-5 w-5" />
            <span>画面ID U-07 / 準備中</span>
          </div>
          <CardTitle className="text-3xl">ポイントチャージ</CardTitle>
          <CardDescription className="text-white/70">
            現在この画面は準備中です。今後のアップデートをお待ちください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            asChild
            className="w-full rounded-2xl bg-white text-slate-950"
          >
            <Link to="/wallet">ウォレットに戻る</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full rounded-2xl">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              ホームへ戻る
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-2xl">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              前の画面へ
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
